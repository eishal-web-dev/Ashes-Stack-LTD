import * as THREE from 'three';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { energyParticleVertex, energyParticleFragment, noise3DGLSL } from '../shaders/phoenixShaders';

// Insert noise functions into the vertex shader
const fullVertexShader = noise3DGLSL + energyParticleVertex;

export type EmissionZone = 0 | 1 | 2 | 3 | 4; // wing, chest, neck, tail, dissolve

type EnergyParticlesProps = {
  count: number;
  accentColor: THREE.Color;
  secondaryColor: THREE.Color;
  intensity: number;
  pointer: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
  scrollProgress: number;
  capabilityKey: string;
};

// Emission zone definitions — positions where particles spawn
const ZONE_POSITIONS: { pos: THREE.Vector3; spread: number; weight: number }[] = [
  // 0: Wing feathers (left + right)
  { pos: new THREE.Vector3(0.8, 0.2, 0.05), spread: 0.5, weight: 0.25 },
  { pos: new THREE.Vector3(-0.8, 0.2, 0.05), spread: 0.5, weight: 0.25 },
  // 1: Chest
  { pos: new THREE.Vector3(0, 0.1, 0.25), spread: 0.2, weight: 0.15 },
  // 2: Neck
  { pos: new THREE.Vector3(0, 0.55, 0.1), spread: 0.15, weight: 0.1 },
  // 3: Tail
  { pos: new THREE.Vector3(0, -0.4, -0.1), spread: 0.3, weight: 0.15 },
  // 4: Dissolve edge (right wing outer)
  { pos: new THREE.Vector3(1.2, 0.3, 0.1), spread: 0.4, weight: 0.1 },
];

// Particle palette
const PALETTE = [
  new THREE.Color(0.72, 0.72, 0.75), // warm silver
  new THREE.Color(0.45, 0.42, 0.38), // rakh grey
  new THREE.Color(1.0, 0.29, 0.42),  // electric coral
  new THREE.Color(0.55, 0.36, 0.96), // ultraviolet
  new THREE.Color(0.13, 0.83, 0.93), // cyan
  new THREE.Color(0.78, 0.96, 0.39), // acid lime
];

// Weights — mostly warm silver/rakh grey, accents sparingly
const PALETTE_WEIGHTS = [0.35, 0.25, 0.12, 0.12, 0.1, 0.06];

function pickPaletteColor(): THREE.Color {
  let r = Math.random();
  for (let i = 0; i < PALETTE_WEIGHTS.length; i++) {
    r -= PALETTE_WEIGHTS[i];
    if (r <= 0) return PALETTE[i].clone();
  }
  return PALETTE[0].clone();
}

/**
 * EnergyParticles — GPU-friendly particle system using THREE.Points.
 * Hundreds/thousands of tiny coloured dots emerge from between feathers,
 * travel toward feather tips, escape, follow flow-field noise, react to
 * cursor, fade out, and return to the pool.
 */
export function EnergyParticles({
  count,
  accentColor,
  secondaryColor,
  intensity,
  pointer,
  scrollProgress,
  capabilityKey,
}: EnergyParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Build all particle attributes
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const offsets = new Float32Array(count);
    const speeds = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lives = new Float32Array(count);
    const maxLives = new Float32Array(count);
    const emissionZones = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Pick emission zone weighted by zone weight
      const zoneIdx = pickWeightedZone();
      emissionZones[i] = zoneIdx;
      const zone = ZONE_POSITIONS[zoneIdx];

      // Start position — near the zone with spread
      positions[i * 3] = zone.pos.x + (Math.random() - 0.5) * zone.spread;
      positions[i * 3 + 1] = zone.pos.y + (Math.random() - 0.5) * zone.spread * 0.5;
      positions[i * 3 + 2] = zone.pos.z + (Math.random() - 0.5) * zone.spread * 0.3;

      // Velocity — direction outward from feather
      const dir = new THREE.Vector3(
        zone.pos.x > 0 ? 1 : zone.pos.x < 0 ? -1 : (Math.random() - 0.5),
        Math.random() * 0.5 + 0.1,
        (Math.random() - 0.5) * 0.3,
      ).normalize();
      velocities[i * 3] = dir.x * (0.3 + Math.random() * 0.4);
      velocities[i * 3 + 1] = dir.y * (0.3 + Math.random() * 0.3);
      velocities[i * 3 + 2] = dir.z * (0.3 + Math.random() * 0.2);

      scales[i] = Math.random() * 0.8 + 0.2;
      offsets[i] = Math.random() * 10;
      speeds[i] = 0.3 + Math.random() * 0.5;
      lives[i] = 0;
      maxLives[i] = 2 + Math.random() * 3;

      const color = pickPaletteColor();
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
    geo.setAttribute('aLife', new THREE.BufferAttribute(lives, 1));
    geo.setAttribute('aMaxLife', new THREE.BufferAttribute(maxLives, 1));
    geo.setAttribute('aEmissionZone', new THREE.BufferAttribute(emissionZones, 1));

    geo.setDrawRange(0, count);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 5);

    const mat = new THREE.ShaderMaterial({
      vertexShader: fullVertexShader,
      fragmentShader: energyParticleFragment,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 8.0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uPointerStrength: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uScrollProgress: { value: 0 },
        uAccentColor: { value: accentColor },
        uIntensity: { value: intensity },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, [count]); // eslint-disable-line

  // Update accent color when capability changes
  useEffect(() => {
    const mat = material;
    mat.uniforms.uAccentColor.value = accentColor;
  }, [accentColor, material]);

  useEffect(() => {
    const mat = material;
    mat.uniforms.uIntensity.value = intensity;
  }, [intensity, material]);

  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const mat = pointsRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uScrollProgress.value = scrollProgress;
    mat.uniforms.uIntensity.value = intensity;

    // Pointer attraction
    const p = pointer.current;
    mat.uniforms.uPointer.value.set(p.x, p.y);
    mat.uniforms.uPointerStrength.value = p.active ? 0.5 : 0.15;
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
}

function pickWeightedZone(): number {
  const totalWeight = ZONE_POSITIONS.reduce((s, z) => s + z.weight, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < ZONE_POSITIONS.length; i++) {
    r -= ZONE_POSITIONS[i].weight;
    if (r <= 0) return i;
  }
  return 0;
}
