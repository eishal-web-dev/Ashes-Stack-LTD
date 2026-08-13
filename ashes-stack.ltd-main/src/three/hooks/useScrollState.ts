import { useEffect, useRef, useState, useCallback } from 'react';
import type { SectionKey } from '../phoenixTypes';
import { SCENE_CONFIGS, SECTION_ORDER } from '../phoenixTypes';

/**
 * useScrollState — tracks scroll progress across the page and
 * determines which section is currently active.
 *
 * Returns:
 * - scrollProgress: 0-1 across the entire scrollable page
 * - activeSection: the section currently in view
 * - sectionProgress: 0-1 within the current section
 * - setActiveSection: manually set section (for capability hover)
 * - manualSection: if a section is manually overridden (e.g. by hovering a capability)
 */
export function useScrollState() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionKey>('hero');
  const [sectionProgress, setSectionProgress] = useState(0);
  const [manualSection, setManualSection] = useState<SectionKey | null>(null);

  // Use refs for high-frequency updates to avoid re-renders
  const scrollProgressRef = useRef(0);
  const sectionProgressRef = useRef(0);
  const rafRef = useRef<number>(0);

  // Throttled scroll handler using rAF
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0;
      scrollProgressRef.current = progress;

      // Determine active section based on scroll position
      const sections = document.querySelectorAll('[data-section]');
      let current: SectionKey = 'hero';
      let currentProgress = 0;

      sections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        const sectionKey = sec.getAttribute('data-section') as SectionKey;
        if (!sectionKey || !SCENE_CONFIGS[sectionKey]) return;

        // Section is active when its top is near the viewport center
        if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.3) {
          current = sectionKey;
          const sectionHeight = rect.height || 1;
          currentProgress = Math.max(0, Math.min(1, -rect.top / sectionHeight));
        }
      });

      sectionProgressRef.current = currentProgress;

      // Only update React state if values changed meaningfully
      setScrollProgress((prev) => (Math.abs(prev - progress) > 0.001 ? progress : prev));
      setActiveSection((prev) => (prev !== current ? current : prev));
      setSectionProgress((prev) => (Math.abs(prev - currentProgress) > 0.01 ? currentProgress : prev));
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);

  // Interpolate scene config between sections for smooth transitions
  const getInterpolatedConfig = useCallback(() => {
    // If a manual section is set (capability hover), use that
    if (manualSection && SCENE_CONFIGS[manualSection]) {
      return SCENE_CONFIGS[manualSection];
    }
    return SCENE_CONFIGS[activeSection] || SCENE_CONFIGS.hero;
  }, [activeSection, manualSection]);

  return {
    scrollProgress,
    scrollProgressRef,
    activeSection,
    sectionProgress,
    sectionProgressRef,
    manualSection,
    setManualSection,
    getInterpolatedConfig,
  };
}
