import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PhoenixBody, PhoenixChest, PhoenixNeck, PhoenixHead, PhoenixFeet } from './PhoenixBody';
import { PhoenixWing } from './PhoenixWing';
import { PhoenixTail } from './PhoenixTail';
import { EnergyParticles } from './EnergyParticles';
import { AshDissolveParticles } from './AshDissolveParticles';
import { SmartGlasses, FloatingLaptop, FloatingPhone, VRGlasses, FloatingUIElements } from './PhoenixAccessories';
import type { SceneConfig } from '../phoenixTypes';
import type { AnimationState } from '../PhoenixAnimationController';
import type { QualitySettings } from '../PhoenixQualityController';

type PhoenixRigProps = {
  sceneConfig: SceneConfig;
  animState: React.MutableRefObject<AnimationState>;
  pointerRef: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
  quality: QualitySettings;
};

/**
 * PhoenixRig — assembles the entire phoenix from all sub-components.
 * The rig group is the root that gets positioned, rotated, and scaled
 * based on scene config and animation state.
 *
 * Wings, body, head, tail, accessories, and particles are all children
 * of this rig and move together.
 */
export function PhoenixRig({ sceneConfig, animState, pointerRef, quality }: PhoenixRigProps) {
  const rigRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  // Current smoothed pose values (interpolated toward target)
  const smoothed = useRef({
    scale: 1,
    wingSpread: 0.85,
    wingSweep: 0,
    headTilt: 0,
    bodyRotY: 0,
    bodyRotX: 0,
    bodyPosX: 0,
    bodyPosY: 0,
    bodyPosZ: 0,
    dissolveProgress: 0.25,
    wireframeMix: 0,
  });

  const accentColor = useMemo(
    () => new THREE.Color(...sceneConfig.accentColor),
    [sceneConfig.accentColor],
  );
  const secondaryColor = useMemo(
    () => new THREE.Color(...sceneConfig.secondaryAccent),
    [sceneConfig.secondaryAccent],
  );

  // Lerp helper
  const lerp = THREE.MathUtils.lerp;

  useFrame((_, delta) => {
    const s = animState.current;
    const pose = sceneConfig.pose;
    const sm = smoothed.current;
    const damp = 1 - Math.exp(-delta * 4);

    // Smooth all pose values toward target
    sm.scale = lerp(sm.scale, pose.scale, damp);
    sm.wingSpread = lerp(sm.wingSpread, pose.wingSpread, damp);
    sm.wingSweep = lerp(sm.wingSweep, pose.wingSweep, damp);
    sm.headTilt = lerp(sm.headTilt, pose.headTilt, damp);
    sm.bodyRotY = lerp(sm.bodyRotY, pose.bodyRotationY, damp);
    sm.bodyRotX = lerp(sm.bodyRotX, pose.bodyRotationX, damp);
    sm.bodyPosX = lerp(sm.bodyPosX, pose.bodyPosition[0], damp);
    sm.bodyPosY = lerp(sm.bodyPosY, pose.bodyPosition[1], damp);
    sm.bodyPosZ = lerp(sm.bodyPosZ, pose.bodyPosition[2], damp);
    sm.dissolveProgress = lerp(sm.dissolveProgress, pose.dissolveProgress, damp);
    sm.wireframeMix = lerp(sm.wireframeMix, pose.wireframeMix, damp);

    if (rigRef.current) {
      // Apply position
      rigRef.current.position.set(sm.bodyPosX, sm.bodyPosY, sm.bodyPosZ);
      // Apply rotation: drag + pose + subtle pointer parallax
      const pointerRotY = s.reducedMotion ? 0 : s.smoothedPointerX * 0.15;
      const pointerRotX = s.reducedMotion ? 0 : s.smoothedPointerY * 0.08;
      rigRef.current.rotation.y = sm.bodyRotY + s.smoothedRotationY + pointerRotY;
      rigRef.current.rotation.x = sm.bodyRotX + s.smoothedRotationX * 0.5 + pointerRotX;
      // Apply scale
      rigRef.current.scale.setScalar(sm.scale);
    }

    // Head follows pointer — applied via the head group in PhoenixHead
    // We pass the target head tilt + pointer influence
    const pointerHeadTilt = s.reducedMotion ? 0 : s.smoothedPointerX * 0.1;
    const pointerHeadPitch = s.reducedMotion ? 0 : -s.smoothedPointerY * 0.06;
    if (bodyRef.current) {
      const head = bodyRef.current.getObjectByName('phoenixHead');
      if (head) {
        head.rotation.x = pointerHeadPitch;
        head.rotation.y = pointerHeadTilt;
      }
    }
  });

  return (
    <group ref={rigRef}>
      {/* Body group — contains body, chest, neck, head, feet */}
      <group ref={bodyRef}>
        <PhoenixBody
          breathing={animState.current.breathing}
          wireframeMix={smoothed.current.wireframeMix}
          accentColor={accentColor}
        />
        <PhoenixChest breathing={animState.current.breathing} accentColor={accentColor} />
        <PhoenixNeck wireframeMix={smoothed.current.wireframeMix} />

        <group name="phoenixHead">
          <PhoenixHead
            accentColor={accentColor}
            headTilt={smoothed.current.headTilt}
            wireframeMix={smoothed.current.wireframeMix}
          />
        </group>

        <PhoenixFeet />

        {/* Smart glasses on head */}
        {sceneConfig.showSmartGlasses && (
          <group position={[0, 0.85, 0.05]}>
            <SmartGlasses accentColor={accentColor} />
          </group>
        )}

        {/* VR glasses on head */}
        {sceneConfig.showVRGlasses && (
          <group position={[0, 0.85, 0.05]}>
            <VRGlasses
              accentColor={accentColor}
              secondaryColor={secondaryColor}
              onForehead={sceneConfig.vrGlassesOnHead}
            />
          </group>
        )}
      </group>

      {/* Left wing — solid */}
      <PhoenixWing
        side="left"
        accentColor={accentColor}
        dissolving={false}
        wingSpread={smoothed.current.wingSpread}
        wingSweep={smoothed.current.wingSweep}
        flutter={animState.current.flutter}
        scrollProgress={animState.current.scrollProgress}
        dissolveProgress={0}
        wireframeMix={smoothed.current.wireframeMix}
      />

      {/* Right wing — dissolving */}
      <PhoenixWing
        side="right"
        accentColor={accentColor}
        dissolving={true}
        wingSpread={smoothed.current.wingSpread}
        wingSweep={smoothed.current.wingSweep}
        flutter={animState.current.flutter}
        scrollProgress={animState.current.scrollProgress}
        dissolveProgress={smoothed.current.dissolveProgress}
        wireframeMix={smoothed.current.wireframeMix}
      />

      {/* Tail */}
      <PhoenixTail
        accentColor={accentColor}
        flutter={animState.current.flutter}
        scrollProgress={animState.current.scrollProgress}
        dissolveProgress={smoothed.current.dissolveProgress}
        wireframeMix={smoothed.current.wireframeMix}
      />

      {/* Energy particles */}
      <EnergyParticles
        count={quality.particleCount}
        accentColor={accentColor}
        secondaryColor={secondaryColor}
        intensity={sceneConfig.particleIntensity}
        pointer={pointerRef}
        scrollProgress={animState.current.scrollProgress}
        capabilityKey={sceneConfig.section}
      />

      {/* Ash dissolve particles (right wing) */}
      <AshDissolveParticles
        count={quality.ashParticleCount}
        dissolveProgress={smoothed.current.dissolveProgress}
        accentColor={accentColor}
      />

      {/* Floating laptop */}
      {sceneConfig.showLaptop && <FloatingLaptop accentColor={accentColor} />}

      {/* Floating phone */}
      {sceneConfig.showPhone && <FloatingPhone accentColor={accentColor} />}

      {/* Floating UI elements for capabilities */}
      {(sceneConfig.section === 'ai' ||
        sceneConfig.section === 'web' ||
        sceneConfig.section === 'mobile' ||
        sceneConfig.section === 'immersive') && (
        <FloatingUIElements capability={sceneConfig.section} accentColor={accentColor} />
      )}
    </group>
  );
}
