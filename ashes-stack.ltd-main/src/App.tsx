import { useState, useEffect, useCallback } from 'react';
import { PhoenixCanvas } from './three/PhoenixCanvas';
import { checkWebGLSupport } from './three/PhoenixQualityController';
import { Loader } from './components/Loader';
import { Navigation } from './components/Navigation';
import {
  HeroSection,
  CapabilitiesSection,
  AISection,
  WebSection,
  MobileSection,
  ImmersiveSection,
  ProjectsSection,
  PhilosophySection,
  ProcessSection,
  AboutSection,
  CTASection,
  ScrollProgressIndicator,
} from './components/Sections';
import { StaticFallbackHero } from './components/StaticFallback';

function App() {
  const [loading, setLoading] = useState(true);
  const [webglSupported] = useState(() => checkWebGLSupport());
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleLoadComplete = useCallback(() => {
    setLoading(false);
  }, []);

  // Track scroll progress for the indicator
  useEffect(() => {
    let rafId = 0;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleCapabilityHover = useCallback((key: string | null) => {
    const fn = (window as unknown as { __setPhoenixSection?: (s: string | null) => void }).__setPhoenixSection;
    if (fn) fn(key);
  }, []);

  return (
    <div className="relative w-full bg-ash-900 text-ash-100 overflow-x-hidden">
      {/* Loader */}
      {loading && <Loader onComplete={handleLoadComplete} />}

      {/* Persistent 3D Canvas or static fallback */}
      {webglSupported ? (
        <PhoenixCanvas onLoadComplete={handleLoadComplete} />
      ) : (
        <StaticFallbackHero />
      )}

      {/* Navigation */}
      <Navigation onCapabilityHover={handleCapabilityHover} />

      {/* Scroll progress indicator */}
      <ScrollProgressIndicator progress={scrollProgress} />

      {/* Content sections — all stacked, scrolling drives the 3D scene */}
      <main className="relative z-20">
        <HeroSection />
        <CapabilitiesSection />
        <AISection />
        <WebSection />
        <MobileSection />
        <ImmersiveSection />
        <ProjectsSection />
        <PhilosophySection />
        <ProcessSection />
        <AboutSection />
        <CTASection />
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-ash-700/30 px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-sm tracking-mega text-ash-300">ASHES</span>
          <span className="text-xs text-ash-500 font-mono">— We build what rises next.</span>
        </div>
        <div className="flex items-center gap-6 text-xs font-mono text-ash-500">
          <a href="#hero" className="hover:text-ash-200 transition-colors">Top</a>
          <a href="#section-projects" className="hover:text-ash-200 transition-colors">Work</a>
          <a href="#section-about" className="hover:text-ash-200 transition-colors">About</a>
          <a href="mailto:hello@ashes.studio" className="hover:text-ash-200 transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
