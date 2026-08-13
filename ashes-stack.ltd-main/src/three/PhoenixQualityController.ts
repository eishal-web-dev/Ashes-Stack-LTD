import { useEffect, useState, useMemo } from 'react';

export type QualityLevel = 'high' | 'medium' | 'low';

export type QualitySettings = {
  level: QualityLevel;
  particleCount: number;
  ashParticleCount: number;
  featherSegments: number;
  enableShadows: boolean;
  pixelRatio: number;
  enablePostProcessing: boolean;
  dprMax: number;
  isMobile: boolean;
  isTablet: boolean;
  reducedMotion: boolean;
};

/**
 * PhoenixQualityController — detects device capabilities and returns
 * appropriate quality settings. Also listens for changes in viewport
 * size and reduced-motion preference.
 */
export function useQualityController(): QualitySettings {
  const [settings, setSettings] = useState<QualitySettings>(() => detectQuality());

  useEffect(() => {
    const handleResize = () => {
      setSettings((prev) => ({ ...prev, ...detectQualityBase() }));
    };
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotion = () => {
      setSettings((prev) => ({ ...prev, reducedMotion: mq.matches }));
    };

    window.addEventListener('resize', handleResize);
    mq.addEventListener('change', handleMotion);

    return () => {
      window.removeEventListener('resize', handleResize);
      mq.removeEventListener('change', handleMotion);
    };
  }, []);

  return settings;
}

function detectQualityBase(): Partial<QualitySettings> {
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  return { isMobile, isTablet };
}

function detectQuality(): QualitySettings {
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Detect WebGL support
  let hasGoodGPU = true;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) hasGoodGPU = false;
    else {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        // Detect low-end GPUs
        if (/Intel.*HD|Mali|Adreno.*3/i.test(renderer)) {
          hasGoodGPU = false;
        }
      }
    }
  } catch {
    hasGoodGPU = false;
  }

  let level: QualityLevel = 'high';
  if (isMobile || !hasGoodGPU) level = 'low';
  else if (isTablet) level = 'medium';

  if (reducedMotion) level = 'low';

  return computeSettings(level, isMobile, isTablet, reducedMotion);
}

function computeSettings(
  level: QualityLevel,
  isMobile: boolean,
  isTablet: boolean,
  reducedMotion: boolean,
): QualitySettings {
  const base: QualitySettings = {
    level,
    particleCount: 800,
    ashParticleCount: 200,
    featherSegments: 10,
    enableShadows: true,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    enablePostProcessing: false,
    dprMax: 2,
    isMobile,
    isTablet,
    reducedMotion,
  };

  switch (level) {
    case 'high':
      return {
        ...base,
        particleCount: 1200,
        ashParticleCount: 300,
        featherSegments: 12,
        enableShadows: true,
        enablePostProcessing: false, // keep off for performance
        dprMax: 2,
      };
    case 'medium':
      return {
        ...base,
        particleCount: 600,
        ashParticleCount: 150,
        featherSegments: 8,
        enableShadows: true,
        enablePostProcessing: false,
        dprMax: 1.5,
      };
    case 'low':
      return {
        ...base,
        // Mobile reduces particles by 60-75%
        particleCount: isMobile ? 250 : 400,
        ashParticleCount: isMobile ? 60 : 100,
        featherSegments: 6,
        enableShadows: false,
        enablePostProcessing: false,
        dprMax: 1,
      };
  }
}

/**
 * Check if WebGL is available in the current browser.
 */
export function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
