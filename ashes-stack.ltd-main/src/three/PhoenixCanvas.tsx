import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PhoenixScene } from './components/PhoenixScene';
import { usePhoenixAnimation } from './PhoenixAnimationController';
import { useQualityController, checkWebGLSupport } from './PhoenixQualityController';
import { useScrollState } from './hooks/useScrollState';
import type { SceneConfig } from './phoenixTypes';

type PhoenixCanvasProps = {
  onLoadComplete?: () => void;
};

/**
 * PhoenixCanvas — the persistent Three.js canvas that stays mounted
 * throughout the homepage. The scene transitions between configurations
 * based on scroll position and capability hover state.
 *
 * Handles:
 * - Pointer events (mouse move, drag rotate)
 * - Touch events (mobile drag)
 * - WebGL fallback
 * - Quality adaptation
 * - Tab visibility (pause rendering when hidden)
 */
export function PhoenixCanvas({ onLoadComplete }: PhoenixCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported] = useState(() => checkWebGLSupport());
  const quality = useQualityController();
  const {
    scrollProgressRef,
    sectionProgressRef,
    activeSection,
    manualSection,
    setManualSection,
    getInterpolatedConfig,
  } = useScrollState();

  const {
    stateRef,
    pointerRef,
    handlePointerMove,
    handlePointerLeave,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleScroll,
    updateSmoothing,
    syncPointerRef,
  } = usePhoenixAnimation();

  // Sync scroll state to animation controller
  useEffect(() => {
    handleScroll(scrollProgressRef.current, sectionProgressRef.current);
    const interval = setInterval(() => {
      handleScroll(scrollProgressRef.current, sectionProgressRef.current);
    }, 100);
    return () => clearInterval(interval);
  }, [handleScroll, scrollProgressRef, sectionProgressRef]);

  // Get the current scene config (with manual override for capability hover)
  const sceneConfig: SceneConfig = getInterpolatedConfig();

  // Pointer event handlers on the canvas container
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      handlePointerMove(e.clientX, e.clientY);
      if (stateRef.current.isDragging) {
        handleDragMove(e.clientX, e.clientY);
      }
    },
    [handlePointerMove, handleDragMove, stateRef],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      handleDragStart(e.clientX, e.clientY);
    },
    [handleDragStart],
  );

  const onPointerUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const onPointerLeave = useCallback(() => {
    handlePointerLeave();
    handleDragEnd();
  }, [handlePointerLeave, handleDragEnd]);

  // Touch events for mobile
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        handlePointerMove(t.clientX, t.clientY);
        if (stateRef.current.isDragging) {
          handleDragMove(t.clientX, t.clientY);
        }
      }
    },
    [handlePointerMove, handleDragMove, stateRef],
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [handleDragStart],
  );

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Expose manual section control to parent via ref-like API
  // (used by capability hover buttons in the UI overlay)
  useEffect(() => {
    (window as unknown as { __setPhoenixSection?: (s: string | null) => void }).__setPhoenixSection = (s: string | null) => {
      setManualSection(s as typeof manualSection);
    };
    return () => {
      delete (window as unknown as { __setPhoenixSection?: (s: string | null) => void }).__setPhoenixSection;
    };
  }, [setManualSection]);

  // Paused rendering when tab is hidden
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const handleVisibility = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Trigger load complete after first frame
  useEffect(() => {
    if (!webglSupported) {
      onLoadComplete?.();
      return;
    }
    const timer = setTimeout(() => onLoadComplete?.(), 800);
    return () => clearTimeout(timer);
  }, [webglSupported, onLoadComplete]);

  // WebGL not supported — render fallback
  if (!webglSupported) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-10 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 rounded-full bg-gradient-radial from-ash-700/40 to-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-10 pointer-events-auto touch-none md:touch-pan-y"
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        // Allow scroll to pass through on non-drag areas
        // The canvas itself is pointer-events-none, but the container handles drag
        touchAction: 'pan-y',
      }}
    >
      <Canvas
        shadows={quality.enableShadows}
        dpr={quality.dprMax}
        gl={{
          antialias: quality.level !== 'low',
          powerPreference: 'high-performance',
          alpha: true,
        }}
        camera={{ fov: 45, position: [0, 0.5, 7], near: 0.1, far: 100 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
        frameloop={isVisible ? 'always' : 'never'}
      >
        <PhoenixScene
          sceneConfig={sceneConfig}
          animState={stateRef}
          pointerRef={pointerRef}
          quality={quality}
          updateSmoothing={updateSmoothing}
          syncPointerRef={syncPointerRef}
        />
      </Canvas>
    </div>
  );
}
