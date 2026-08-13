import * as THREE from 'three';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { ashDissolveVertex, ashDissolveFragment } from '../shaders/phoenixShaders';

type AshDissolveParticlesProps = {
  count: number;
  dissolveProgress: number;
  accentColor: THREE.Color;
};

/**
 * AshDissolveParticles — fragments that break off from the dissolving
 * right wing. These spawn at the dissolve boundary and fall/float away.
 */
export function AshDissolveParticles({
  count,
  dissolveProgress,
  accentColor,
}: AshDissolveParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const offsets = new Float32Array(count);
    const basePositions = new Float32Array(count * 3);
    const dirs = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Base positions along the right wing edge
      const t = Math.random();
      const angle = THREE.MathUtils.lerp(-0.8, 0.4, t);
      const radius = 0.5 + Math.random() * 1.2;
      basePositions[i * 3] = Math.sin(angle) * radius + 0.2;
      basePositions[i * 3 + 1] = Math.cos(angle) * radius * 0.3 + 0.1;
      basePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;

      positions[i * 3] = basePositions[i * 3];
      positions[i * 3 + 1] = basePositions[i * 3 + 1];
      positions[i * 3 + 2] = basePositions[i * 3 + 2];

      // Direction — outward + upward drift
      dirs[i * 3] = 0.5 + Math.random() * 0.5;
      dirs[i * 3 + 1] = 0.3 + Math.random() * 0.3;
      dirs[i * 3 + 2] = (Math.random() - 0.5) * 0.3;

      scales[i] = Math.random() * 0.6 + 0.3;
      offsets[i] = Math.random() * 10;

      // Color — mostly warm grey, some accent
      const useAccent = Math.random() < 0.2;
      if (useAccent) {
        colors[i * 3] = accentColor.r;
        colors[i * 3 + 1] = accentColor.g;
        colors[i * 3 + 2] = accentColor.b;
      } else {
        colors[i * 3] = 0.4;
        colors[i * 3 + 1] = 0.38;
        colors[i * 3 + 2] = 0.35;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));
    geo.setAttribute('aBasePos', new THREE.BufferAttribute(basePositions, 3));
    geo.setAttribute('aDir', new THREE.BufferAttribute(dirs, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 5);

    const mat = new THREE.ShaderMaterial({
      vertexShader: ashDissolveVertex,
      fragmentShader: ashDissolveFragment,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 6.0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, [count, accentColor]);

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
    // Scale visibility with dissolve progress
    pointsRef.current.visible = dissolveProgress > 0.1;
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
}
