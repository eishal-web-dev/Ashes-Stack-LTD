import * as THREE from 'three';
import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PhoenixRig } from './PhoenixRig';
import { PhoenixLighting, PerspectiveGrid, VolumetricDepth } from './PhoenixLighting';
import type { SceneConfig } from '../phoenixTypes';
import type { AnimationState } from '../PhoenixAnimationController';
import type { QualitySettings } from '../PhoenixQualityController';

type PhoenixSceneProps = {
  sceneConfig: SceneConfig;
  animState: React.MutableRefObject<AnimationState>;
  pointerRef: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
  quality: QualitySettings;
  updateSmoothing: (delta: number) => void;
  syncPointerRef: () => void;
};

/**
 * PhoenixScene — the main 3D scene.
 * Contains the rig, lighting, grid, fog, and camera controller.
 * The camera smoothly interpolates between section configs.
 */
export function PhoenixScene({
  sceneConfig,
  animState,
  pointerRef,
  quality,
  updateSmoothing,
  syncPointerRef,
}: PhoenixSceneProps) {
  const { camera } = useThree();

  // Smoothed camera state
  const camSmoothed = useRef({
    posX: 0, posY: 0.5, posZ: 7,
    lookX: 0, lookY: 0, lookZ: 0,
    fov: 45,
  });

  const lookAtTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    // Update animation smoothing
    updateSmoothing(delta);
    syncPointerRef();

    // Smooth camera toward target config
    const target = sceneConfig.camera;
    const damp = 1 - Math.exp(-delta * 3);
    const cs = camSmoothed.current;
    cs.posX = THREE.MathUtils.lerp(cs.posX, target.position[0], damp);
    cs.posY = THREE.MathUtils.lerp(cs.posY, target.position[1], damp);
    cs.posZ = THREE.MathUtils.lerp(cs.posZ, target.position[2], damp);
    cs.lookX = THREE.MathUtils.lerp(cs.lookX, target.lookAt[0], damp);
    cs.lookY = THREE.MathUtils.lerp(cs.lookY, target.lookAt[1], damp);
    cs.lookZ = THREE.MathUtils.lerp(cs.lookZ, target.lookAt[2], damp);
    cs.fov = THREE.MathUtils.lerp(cs.fov, target.fov, damp);

    // Subtle parallax based on pointer
    const s = animState.current;
    const parallaxX = s.reducedMotion ? 0 : s.smoothedPointerX * 0.3;
    const parallaxY = s.reducedMotion ? 0 : s.smoothedPointerY * 0.2;

    camera.position.set(cs.posX + parallaxX, cs.posY + parallaxY, cs.posZ);
    lookAtTarget.set(cs.lookX, cs.lookY, cs.lookZ);
    camera.lookAt(lookAtTarget);

    const perspCam = camera as THREE.PerspectiveCamera;
    if (perspCam.fov !== undefined && perspCam.fov !== cs.fov) {
      perspCam.fov = cs.fov;
      perspCam.updateProjectionMatrix();
    }
  });

  // Set initial camera
  useEffect(() => {
    camera.position.set(...sceneConfig.camera.position);
    camera.lookAt(...sceneConfig.camera.lookAt);
    if ((camera as THREE.PerspectiveCamera).fov !== undefined) {
      (camera as THREE.PerspectiveCamera).fov = sceneConfig.camera.fov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  }, []); // eslint-disable-line

  const accentColor = useMemo(
    () => new THREE.Color(...sceneConfig.accentColor),
    [sceneConfig.accentColor],
  );

  return (
    <>
      <VolumetricDepth />
      <PhoenixLighting
        accentColor={accentColor}
        environmentIntensity={sceneConfig.environmentIntensity}
        enableShadows={quality.enableShadows}
      />
      <PerspectiveGrid />
      <PhoenixRig
        sceneConfig={sceneConfig}
        animState={animState}
        pointerRef={pointerRef}
        quality={quality}
      />
    </>
  );
}
