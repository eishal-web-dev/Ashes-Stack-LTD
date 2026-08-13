import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { createBodyMaterial, createBeakMaterial, createEnergyMaterial } from '../geometry/materials';

type PhoenixBodyProps = {
  breathing: number;
  wireframeMix: number;
  accentColor: THREE.Color;
};

/**
 * Creates the central body geometry — a stylized sculptural form
 * using a lathe geometry with a custom profile for organic shape.
 */
function useBodyGeometry() {
  return useMemo(() => {
    const points: THREE.Vector2[] = [];
    // Body profile — egg-shaped, wider at chest, narrowing toward tail
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = THREE.MathUtils.lerp(0.6, -0.8, t);
      // Width profile: wider near chest (top), narrower at tail (bottom)
      const r =
        Math.sin(t * Math.PI) * 0.35 +
        Math.sin(t * Math.PI * 0.4) * 0.15;
      points.push(new THREE.Vector2(Math.max(r, 0.02), y));
    }
    const geo = new THREE.LatheGeometry(points, 20);
    geo.computeVertexNormals();
    return geo;
  }, []);
}

/**
 * PhoenixBody — the central torso. Breathing animation scales it subtly.
 */
export function PhoenixBody({ breathing, wireframeMix, accentColor }: PhoenixBodyProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useBodyGeometry();
  const material = useMemo(() => createBodyMaterial(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const breath = 1 + Math.sin(time * 0.8) * breathing * 0.03;
    meshRef.current.scale.set(breath, breath * 0.98, breath);
    material.wireframe = wireframeMix > 0.5;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} castShadow receiveShadow />
  );
}

/**
 * PhoenixChest — a distinct puffed chest section in front of the body.
 * Slightly lighter, with energy glints.
 */
export function PhoenixChest({ breathing, accentColor }: { breathing: number; accentColor: THREE.Color }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => {
    const mat = createBodyMaterial();
    mat.color = new THREE.Color(0.04, 0.04, 0.05);
    mat.roughness = 0.6;
    return mat;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.32, 20, 16);
    geo.scale(1, 0.85, 0.7);
    return geo;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const breath = 1 + Math.sin(time * 0.8 + 0.3) * breathing * 0.04;
    meshRef.current.scale.set(breath, breath, breath);
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[0, 0.1, 0.22]}
      castShadow
      receiveShadow
    />
  );
}

/**
 * PhoenixNeck — connects body to head, curved and tapering.
 */
export function PhoenixNeck({ wireframeMix }: { wireframeMix: number }) {
  const geometry = useMemo(() => {
    // A curved cylinder-like neck using a tube along a custom curve
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.35, 0.1),
      new THREE.Vector3(0, 0.5, 0.15),
      new THREE.Vector3(0, 0.65, 0.12),
      new THREE.Vector3(0, 0.78, 0.05),
    ]);
    const geo = new THREE.TubeGeometry(curve, 16, 0.14, 12, false);
    // Taper the top slightly
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > 0.6) {
        const taper = 1 - (y - 0.6) * 0.8;
        pos.setX(i, pos.getX(i) * taper);
        pos.setZ(i, pos.getZ(i) * taper);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  const material = useMemo(() => createBodyMaterial(), []);

  return (
    <mesh geometry={geometry} material={material} castShadow receiveShadow
      onUpdate={(m) => { if (m.material instanceof THREE.MeshStandardMaterial) m.material.wireframe = wireframeMix > 0.5; }}
    />
  );
}

type PhoenixHeadProps = {
  accentColor: THREE.Color;
  headTilt: number;
  wireframeMix: number;
};

/**
 * PhoenixHead — a sculptural head with crest, beak, and glowing eyes.
 * The head has recognizable phoenix proportions: angular, refined.
 */
export function PhoenixHead({ accentColor, headTilt, wireframeMix }: PhoenixHeadProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyMaterial = useMemo(() => createBodyMaterial(), []);
  const beakMaterial = useMemo(() => createBeakMaterial(), []);
  const eyeMaterial = useMemo(() => createEnergyMaterial(accentColor), [accentColor]);

  // Head geometry — modified sphere, slightly angular
  const headGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.2, 16, 14);
    geo.scale(1, 0.85, 1.1);
    // Squish the back slightly for a more raptor-like profile
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      if (z < 0) {
        pos.setZ(i, z * 0.8);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Beak — a small elegant cone, curved downward
  const beakGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.06, 0.18, 8);
    // Flatten and curve
    geo.scale(1, 1, 0.5);
    geo.rotateX(-0.3);
    return geo;
  }, []);

  // Crest feathers — 3 small angled shapes on top of head
  const crestGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.04, 0.12, 0, 0.2);
    shape.quadraticCurveTo(-0.04, 0.12, 0, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false });
    return geo;
  }, []);

  // Eye — small glowing sphere
  const eyeGeo = useMemo(() => new THREE.SphereGeometry(0.025, 8, 8), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    // Tiny head movements — subtle tilt and look
    groupRef.current.rotation.z = headTilt + Math.sin(time * 0.5) * 0.02;
    groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.03;
    // Occasional blink — scale eyes briefly
    const blink = Math.sin(time * 0.4) > 0.98 ? 0.1 : 1;
    const eyeL = groupRef.current.getObjectByName('eyeL');
    const eyeR = groupRef.current.getObjectByName('eyeR');
    if (eyeL) eyeL.scale.y = blink;
    if (eyeR) eyeR.scale.y = blink;
  });

  const wireframe = wireframeMix > 0.5;

  return (
    <group ref={groupRef} position={[0, 0.85, 0.05]}>
      {/* Head */}
      <mesh geometry={headGeo} material={bodyMaterial} castShadow receiveShadow
        onUpdate={(m) => { if (m.material instanceof THREE.MeshStandardMaterial) m.material.wireframe = wireframe; }}
      />

      {/* Beak — upper mandible */}
      <mesh geometry={beakGeo} material={beakMaterial} position={[0, -0.08, 0.2]} castShadow />

      {/* Beak — lower mandible (smaller) */}
      <mesh
        geometry={beakGeo}
        material={beakMaterial}
        position={[0, -0.12, 0.18]}
        scale={[0.8, 0.6, 0.8]}
        castShadow
      />

      {/* Crest feathers */}
      <mesh geometry={crestGeo} material={bodyMaterial} position={[0, 0.15, -0.05]} rotation={[-0.3, 0, 0]} castShadow />
      <mesh geometry={crestGeo} material={bodyMaterial} position={[0.06, 0.14, -0.03]} rotation={[-0.2, 0.3, -0.15]} castShadow />
      <mesh geometry={crestGeo} material={bodyMaterial} position={[-0.06, 0.14, -0.03]} rotation={[-0.2, -0.3, 0.15]} castShadow />

      {/* Eyes */}
      <mesh name="eyeL" geometry={eyeGeo} material={eyeMaterial} position={[0.1, 0.02, 0.15]} />
      <mesh name="eyeR" geometry={eyeGeo} material={eyeMaterial} position={[-0.1, 0.02, 0.15]} />
    </group>
  );
}

/**
 * PhoenixFeet — restrained clawed feet at the base of the body.
 */
export function PhoenixFeet() {
  const material = useMemo(() => createBeakMaterial(), []);

  const toeGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.015, 0.01, 0.15, 6);
    return geo;
  }, []);

  const footRef = useRef<THREE.Group>(null);

  return (
    <group ref={footRef} position={[0, -0.7, 0.05]}>
      {/* Left foot */}
      <group position={[0.12, 0, 0]}>
        <mesh geometry={toeGeo} material={material} position={[0, -0.07, 0.05]} rotation={[0.3, 0, 0]} castShadow />
        <mesh geometry={toeGeo} material={material} position={[0.04, -0.07, 0.08]} rotation={[0.3, 0.3, 0]} castShadow />
        <mesh geometry={toeGeo} material={material} position={[-0.04, -0.07, 0.08]} rotation={[0.3, -0.3, 0]} castShadow />
        <mesh geometry={toeGeo} material={material} position={[0, -0.07, -0.03]} rotation={[-0.3, 0, 0]} castShadow />
      </group>
      {/* Right foot */}
      <group position={[-0.12, 0, 0]}>
        <mesh geometry={toeGeo} material={material} position={[0, -0.07, 0.05]} rotation={[0.3, 0, 0]} castShadow />
        <mesh geometry={toeGeo} material={material} position={[0.04, -0.07, 0.08]} rotation={[0.3, -0.3, 0]} castShadow />
        <mesh geometry={toeGeo} material={material} position={[-0.04, -0.07, 0.08]} rotation={[0.3, 0.3, 0]} castShadow />
        <mesh geometry={toeGeo} material={material} position={[0, -0.07, -0.03]} rotation={[-0.3, 0, 0]} castShadow />
      </group>
    </group>
  );
}
