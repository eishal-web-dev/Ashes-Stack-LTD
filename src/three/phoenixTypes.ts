/**
 * Shared types for the phoenix 3D system.
 * These are kept in plain TypeScript (no R3F imports) so they can be
 * referenced from both the scene components and the animation controller.
 */

export type CapabilityKey = 'ai' | 'web' | 'mobile' | 'immersive';

export type SectionKey =
  | 'hero'
  | 'capabilities'
  | 'ai'
  | 'web'
  | 'mobile'
  | 'immersive'
  | 'projects'
  | 'philosophy'
  | 'process'
  | 'about'
  | 'cta';

export type PhoenixPose = {
  scale: number;
  wingSpread: number;     // 0 = closed, 1 = fully open
  wingSweep: number;      // -1 = swept back, 0 = neutral, 1 = forward
  headTilt: number;       // radians
  bodyRotationY: number;  // radians
  bodyRotationX: number;
  bodyPosition: [number, number, number];
  dissolveProgress: number; // 0 = solid, 1 = fully dissolved
  wireframeMix: number;     // 0 = solid, 1 = full wireframe
};

export type CameraState = {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
};

export type SceneConfig = {
  section: SectionKey;
  pose: PhoenixPose;
  camera: CameraState;
  accentColor: [number, number, number];
  secondaryAccent: [number, number, number];
  showSmartGlasses: boolean;
  showLaptop: boolean;
  showPhone: boolean;
  showVRGlasses: boolean;
  vrGlassesOnHead: boolean; // on forehead vs over eyes
  particleIntensity: number; // 0-1
  environmentIntensity: number; // 0-1
};

export const ACCENT_COLORS: Record<string, [number, number, number]> = {
  hero: [0.53, 0.29, 0.96],       // ultraviolet
  ai: [0.13, 0.83, 0.93],         // cyan
  web: [0.78, 0.96, 0.39],        // lime
  mobile: [1.0, 0.29, 0.42],      // coral
  immersive: [0.55, 0.36, 0.96],  // violet
  projects: [0.13, 0.83, 0.93],   // cyan
  philosophy: [0.4, 0.4, 0.45],   // mineral grey
  process: [0.78, 0.96, 0.39],    // lime
  about: [1.0, 0.29, 0.42],       // coral
  cta: [0.53, 0.29, 0.96],        // ultraviolet
};

export const SECONDARY_COLORS: Record<string, [number, number, number]> = {
  hero: [1.0, 0.29, 0.42],
  ai: [0.55, 0.36, 0.96],
  web: [0.13, 0.83, 0.93],
  mobile: [0.55, 0.36, 0.96],
  immersive: [1.0, 0.29, 0.42],
  projects: [0.55, 0.36, 0.96],
  philosophy: [0.3, 0.3, 0.35],
  process: [0.13, 0.83, 0.93],
  about: [0.13, 0.83, 0.93],
  cta: [0.13, 0.83, 0.93],
};

// ── Scene configurations for each section ────────────────────────
export const SCENE_CONFIGS: Record<string, SceneConfig> = {
  hero: {
    section: 'hero',
    pose: {
      scale: 1.0,
      wingSpread: 0.85,
      wingSweep: 0,
      headTilt: 0,
      bodyRotationY: 0,
      bodyRotationX: 0,
      bodyPosition: [0, 0, 0],
      dissolveProgress: 0.25,
      wireframeMix: 0,
    },
    camera: { position: [0, 0.5, 7], lookAt: [0, 0, 0], fov: 45 },
    accentColor: ACCENT_COLORS.hero,
    secondaryAccent: SECONDARY_COLORS.hero,
    showSmartGlasses: false,
    showLaptop: false,
    showPhone: false,
    showVRGlasses: false,
    vrGlassesOnHead: false,
    particleIntensity: 0.7,
    environmentIntensity: 0.5,
  },
  capabilities: {
    section: 'capabilities',
    pose: {
      scale: 0.9,
      wingSpread: 0.6,
      wingSweep: 0,
      headTilt: 0,
      bodyRotationY: 0.3,
      bodyRotationX: 0,
      bodyPosition: [0, 0.3, 0],
      dissolveProgress: 0.2,
      wireframeMix: 0,
    },
    camera: { position: [2, 1, 6], lookAt: [0, 0, 0], fov: 50 },
    accentColor: ACCENT_COLORS.hero,
    secondaryAccent: SECONDARY_COLORS.hero,
    showSmartGlasses: false,
    showLaptop: false,
    showPhone: false,
    showVRGlasses: false,
    vrGlassesOnHead: false,
    particleIntensity: 0.5,
    environmentIntensity: 0.4,
  },
  ai: {
    section: 'ai',
    pose: {
      scale: 0.85,
      wingSpread: 0.5,
      wingSweep: 0.1,
      headTilt: 0.05,
      bodyRotationY: -0.15,
      bodyRotationX: 0,
      bodyPosition: [0, 0.2, 0],
      dissolveProgress: 0.15,
      wireframeMix: 0,
    },
    camera: { position: [-1.5, 0.8, 5.5], lookAt: [0, 0.2, 0], fov: 50 },
    accentColor: ACCENT_COLORS.ai,
    secondaryAccent: SECONDARY_COLORS.ai,
    showSmartGlasses: true,
    showLaptop: false,
    showPhone: false,
    showVRGlasses: false,
    vrGlassesOnHead: false,
    particleIntensity: 0.6,
    environmentIntensity: 0.5,
  },
  web: {
    section: 'web',
    pose: {
      scale: 0.8,
      wingSpread: 0.45,
      wingSweep: 0.2,
      headTilt: -0.05,
      bodyRotationY: 0.2,
      bodyRotationX: 0.05,
      bodyPosition: [0.3, -0.1, 0],
      dissolveProgress: 0.1,
      wireframeMix: 0,
    },
    camera: { position: [1.5, 0.5, 5], lookAt: [0, 0, 0], fov: 55 },
    accentColor: ACCENT_COLORS.web,
    secondaryAccent: SECONDARY_COLORS.web,
    showSmartGlasses: false,
    showLaptop: true,
    showPhone: false,
    showVRGlasses: false,
    vrGlassesOnHead: false,
    particleIntensity: 0.6,
    environmentIntensity: 0.5,
  },
  mobile: {
    section: 'mobile',
    pose: {
      scale: 0.8,
      wingSpread: 0.4,
      wingSweep: 0.15,
      headTilt: 0.1,
      bodyRotationY: -0.1,
      bodyRotationX: -0.05,
      bodyPosition: [-0.2, 0.1, 0],
      dissolveProgress: 0.1,
      wireframeMix: 0,
    },
    camera: { position: [-1, 0.3, 5], lookAt: [0, 0, 0], fov: 55 },
    accentColor: ACCENT_COLORS.mobile,
    secondaryAccent: SECONDARY_COLORS.mobile,
    showSmartGlasses: false,
    showLaptop: false,
    showPhone: true,
    showVRGlasses: false,
    vrGlassesOnHead: false,
    particleIntensity: 0.55,
    environmentIntensity: 0.45,
  },
  immersive: {
    section: 'immersive',
    pose: {
      scale: 0.85,
      wingSpread: 0.6,
      wingSweep: 0.1,
      headTilt: 0,
      bodyRotationY: 0.1,
      bodyRotationX: 0,
      bodyPosition: [0, 0.15, 0],
      dissolveProgress: 0.15,
      wireframeMix: 0,
    },
    camera: { position: [1, 0.5, 5.5], lookAt: [0, 0.1, 0], fov: 52 },
    accentColor: ACCENT_COLORS.immersive,
    secondaryAccent: SECONDARY_COLORS.immersive,
    showSmartGlasses: false,
    showLaptop: false,
    showPhone: false,
    showVRGlasses: true,
    vrGlassesOnHead: false,
    particleIntensity: 0.65,
    environmentIntensity: 0.5,
  },
  projects: {
    section: 'projects',
    pose: {
      scale: 0.75,
      wingSpread: 0.7,
      wingSweep: -0.1,
      headTilt: 0,
      bodyRotationY: 0.4,
      bodyRotationX: 0,
      bodyPosition: [0, 0.2, 0],
      dissolveProgress: 0.2,
      wireframeMix: 0,
    },
    camera: { position: [2.5, 1, 6], lookAt: [0, 0, 0], fov: 50 },
    accentColor: ACCENT_COLORS.projects,
    secondaryAccent: SECONDARY_COLORS.projects,
    showSmartGlasses: false,
    showLaptop: false,
    showPhone: false,
    showVRGlasses: false,
    vrGlassesOnHead: false,
    particleIntensity: 0.5,
    environmentIntensity: 0.4,
  },
  philosophy: {
    section: 'philosophy',
    pose: {
      scale: 0.9,
      wingSpread: 0.55,
      wingSweep: 0,
      headTilt: 0,
      bodyRotationY: 0,
      bodyRotationX: 0,
      bodyPosition: [0, 0, 0],
      dissolveProgress: 0.1,
      wireframeMix: 0.7,
    },
    camera: { position: [0, 0.5, 6], lookAt: [0, 0, 0], fov: 48 },
    accentColor: ACCENT_COLORS.philosophy,
    secondaryAccent: SECONDARY_COLORS.philosophy,
    showSmartGlasses: false,
    showLaptop: false,
    showPhone: false,
    showVRGlasses: false,
    vrGlassesOnHead: false,
    particleIntensity: 0.35,
    environmentIntensity: 0.3,
  },
  process: {
    section: 'process',
    pose: {
      scale: 0.75,
      wingSpread: 0.4,
      wingSweep: 0.15,
      headTilt: -0.05,
      bodyRotationY: 0.15,
      bodyRotationX: 0.03,
      bodyPosition: [0.2, -0.05, 0],
      dissolveProgress: 0.12,
      wireframeMix: 0,
    },
    camera: { position: [1, 0.3, 5], lookAt: [0, 0, 0], fov: 55 },
    accentColor: ACCENT_COLORS.process,
    secondaryAccent: SECONDARY_COLORS.process,
    showSmartGlasses: false,
    showLaptop: true,
    showPhone: true,
    showVRGlasses: false,
    vrGlassesOnHead: false,
    particleIntensity: 0.5,
    environmentIntensity: 0.45,
  },
  about: {
    section: 'about',
    pose: {
      scale: 0.6,
      wingSpread: 0.3,
      wingSweep: 0,
      headTilt: 0.05,
      bodyRotationY: -0.3,
      bodyRotationX: 0,
      bodyPosition: [0.3, 0.15, 0.5],
      dissolveProgress: 0.05,
      wireframeMix: 0,
    },
    camera: { position: [0.5, 0.8, 4], lookAt: [0.2, 0.1, 0], fov: 55 },
    accentColor: ACCENT_COLORS.about,
    secondaryAccent: SECONDARY_COLORS.about,
    showSmartGlasses: false,
    showLaptop: true,
    showPhone: false,
    showVRGlasses: false,
    vrGlassesOnHead: false,
    particleIntensity: 0.4,
    environmentIntensity: 0.4,
  },
  cta: {
    section: 'cta',
    pose: {
      scale: 1.05,
      wingSpread: 1.0,
      wingSweep: 0,
      headTilt: 0,
      bodyRotationY: 0,
      bodyRotationX: 0,
      bodyPosition: [0, 0, 0],
      dissolveProgress: 0.0,
      wireframeMix: 0,
    },
    camera: { position: [0, 0.5, 7.5], lookAt: [0, 0, 0], fov: 42 },
    accentColor: ACCENT_COLORS.cta,
    secondaryAccent: SECONDARY_COLORS.cta,
    showSmartGlasses: false,
    showLaptop: false,
    showPhone: false,
    showVRGlasses: true,
    vrGlassesOnHead: true, // lifted on forehead
    particleIntensity: 0.8,
    environmentIntensity: 0.6,
  },
};

export const SECTION_ORDER: SectionKey[] = [
  'hero', 'capabilities', 'ai', 'web', 'mobile', 'immersive',
  'projects', 'philosophy', 'process', 'about', 'cta',
];
