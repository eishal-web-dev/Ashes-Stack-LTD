import * as THREE from 'three';
import { useRef, useMemo, useCallback, useEffect } from 'react';

export type AnimationState = {
  // Mouse / pointer
  pointerX: number;      // -1 to 1, normalized
  pointerY: number;
  pointerActive: boolean;
  // Drag rotation
  dragRotationY: number;
  dragRotationX: number;
  dragVelocityY: number;
  dragVelocityX: number;
  isDragging: boolean;
  // Smoothed values for the rig
  smoothedPointerX: number;
  smoothedPointerY: number;
  smoothedRotationY: number;
  smoothedRotationX: number;
  // Breathing
  breathing: number;
  // Flutter
  flutter: number;
  // Scroll
  scrollProgress: number;    // 0 to 1 across whole page
  sectionProgress: number;   // 0 to 1 within current section
  // Reduced motion
  reducedMotion: boolean;
};

/**
 * PhoenixAnimationController — manages all animation state via refs
 * to avoid React state updates inside animation frames.
 *
 * Exposes the current animation state and methods to update it
 * from pointer events, drag events, and scroll state.
 */
export function usePhoenixAnimation() {
  const stateRef = useRef<AnimationState>({
    pointerX: 0,
    pointerY: 0,
    pointerActive: false,
    dragRotationY: 0,
    dragRotationX: 0,
    dragVelocityY: 0,
    dragVelocityX: 0,
    isDragging: false,
    smoothedPointerX: 0,
    smoothedPointerY: 0,
    smoothedRotationY: 0,
    smoothedRotationX: 0,
    breathing: 1,
    flutter: 0.3,
    scrollProgress: 0,
    sectionProgress: 0,
    reducedMotion: false,
  });

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    stateRef.current.reducedMotion = mq.matches;
    const handler = (e: MediaQueryListEvent) => {
      stateRef.current.reducedMotion = e.matches;
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Pointer move handler
  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    const x = (clientX / window.innerWidth) * 2 - 1;
    const y = -(clientY / window.innerHeight) * 2 + 1;
    stateRef.current.pointerX = x;
    stateRef.current.pointerY = y;
    stateRef.current.pointerActive = true;
  }, []);

  // Pointer leave
  const handlePointerLeave = useCallback(() => {
    stateRef.current.pointerActive = false;
  }, []);

  // Drag start/move/end
  const lastDragRef = useRef({ x: 0, y: 0 });

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    stateRef.current.isDragging = true;
    lastDragRef.current = { x: clientX, y: clientY };
  }, []);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!stateRef.current.isDragging) return;
    const dx = clientX - lastDragRef.current.x;
    const dy = clientY - lastDragRef.current.y;
    lastDragRef.current = { x: clientX, y: clientY };
    stateRef.current.dragVelocityY = dx * 0.008;
    stateRef.current.dragVelocityX = dy * 0.008;
    stateRef.current.dragRotationY += dx * 0.008;
    stateRef.current.dragRotationX += dy * 0.008;
    // Clamp X rotation
    stateRef.current.dragRotationX = THREE.MathUtils.clamp(
      stateRef.current.dragRotationX, -0.5, 0.5,
    );
  }, []);

  const handleDragEnd = useCallback(() => {
    stateRef.current.isDragging = false;
  }, []);

  // Scroll update
  const handleScroll = useCallback((scrollProgress: number, sectionProgress: number) => {
    stateRef.current.scrollProgress = scrollProgress;
    stateRef.current.sectionProgress = sectionProgress;
  }, []);

  // Per-frame smoothing — call this in useFrame
  const updateSmoothing = useCallback((delta: number) => {
    const s = stateRef.current;
    const damp = 1 - Math.exp(-delta * 5);
    const dampSlow = 1 - Math.exp(-delta * 3);

    // Smooth pointer
    s.smoothedPointerX = THREE.MathUtils.lerp(s.smoothedPointerX, s.pointerX, damp);
    s.smoothedPointerY = THREE.MathUtils.lerp(s.smoothedPointerY, s.pointerY, damp);

    if (s.reducedMotion) {
      // Minimal movement in reduced motion
      s.smoothedPointerX *= 0.1;
      s.smoothedPointerY *= 0.1;
    }

    // Inertia for drag rotation — decays when not dragging
    if (!s.isDragging) {
      s.dragVelocityY *= 0.95;
      s.dragVelocityX *= 0.95;
      s.dragRotationY += s.dragVelocityY;
      s.dragRotationX = THREE.MathUtils.clamp(
        s.dragRotationX + s.dragVelocityX, -0.5, 0.5,
      );
      // Gradual return to resting orientation
      s.dragRotationY = THREE.MathUtils.lerp(s.dragRotationY, 0, dampSlow * 0.3);
      s.dragRotationX = THREE.MathUtils.lerp(s.dragRotationX, 0, dampSlow * 0.3);
    }

    s.smoothedRotationY = s.dragRotationY;
    s.smoothedRotationX = s.dragRotationX;

    // Breathing and flutter — always alive
    if (!s.reducedMotion) {
      s.flutter = 0.25 + Math.sin(Date.now() * 0.001) * 0.1;
    } else {
      s.flutter = 0.05;
    }
  }, []);

  // Pointer ref for shader access
  const pointerRef = useMemo(
    () => ({
      current: { x: 0, y: 0, active: false },
    }),
    [],
  );

  // Sync pointerRef from stateRef each frame
  const syncPointerRef = useCallback(() => {
    pointerRef.current.x = stateRef.current.smoothedPointerX * 3;
    pointerRef.current.y = stateRef.current.smoothedPointerY * 2;
    pointerRef.current.active = stateRef.current.pointerActive;
  }, [pointerRef]);

  return {
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
  };
}
