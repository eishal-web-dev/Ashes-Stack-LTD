import * as THREE from 'three';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  createFeatherGeometry,
  computeFeatherTransform,
  WING_FEATHER_LAYERS,
  type FeatherLayer,
} from '../geometry/featherGeometry';
import { createFeatherMaterial } from '../geometry/materials';

type WingProps = {
  side: 'left' | 'right';
  accentColor: THREE.Color;
  dissolving: boolean;
  wingSpread: number;
  wingSweep: number;
  flutter: number;
  scrollProgress: number;
  dissolveProgress: number;
  wireframeMix: number;
};

type InstancedFeatherData = {
  layer: FeatherLayer;
  index: number;
  baseMatrix: THREE.Matrix4;
  flutterOffset: number;
  dissolveFactor: number;
};

/**
 * Renders one wing as a collection of instanced feathers.
 * All feathers share a single geometry and material.
 * The wing is built once, then animated via per-instance matrix updates.
 */
export function PhoenixWing({
  side,
  accentColor,
  dissolving,
  wingSpread,
  wingSweep,
  flutter,
  scrollProgress,
  dissolveProgress,
  wireframeMix,
}: WingProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Build the feather geometry once
  const geometry = useMemo(() => createFeatherGeometry(1.0, 0.25, 10, 0.08), []);

  // Build the material — re-create when dissolving flag changes
  const material = useMemo(
    () => createFeatherMaterial(accentColor, dissolving),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Compute all feather transforms for this wing
  const { featherData, totalCount } = useMemo(() => {
    const allData: InstancedFeatherData[] = [];
    const dummy = new THREE.Object3D();

    for (const layer of WING_FEATHER_LAYERS) {
      for (let i = 0; i < layer.count; i++) {
        const { position, rotation, scale } = computeFeatherTransform(layer, i, side);
        dummy.position.copy(position);
        dummy.rotation.copy(rotation);
        dummy.scale.copy(scale);
        dummy.updateMatrix();

        allData.push({
          layer,
          index: i,
          baseMatrix: dummy.matrix.clone(),
          flutterOffset: i * 0.15 + layer.layerOffset * 2,
          dissolveFactor: layer.dissolveFactor,
        });
      }
    }

    return { featherData: allData, totalCount: allData.length };
  }, [side]);

  // Set instance matrices on mount
  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.count = totalCount;
    for (let i = 0; i < totalCount; i++) {
      meshRef.current.setMatrixAt(i, featherData[i].baseMatrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [featherData, totalCount]);

  // Cleanup material on unmount
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  // Animation: update wing spread, sweep, and flutter per-instance
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    // Update material uniforms
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = time;
    mat.uniforms.uFlutter.value = flutter;
    mat.uniforms.uScrollProgress.value = scrollProgress;
    mat.uniforms.uAccentColor.value = accentColor;
    mat.uniforms.uWireframeMix.value = wireframeMix;

    // Dissolve progress — right wing dissolves, left stays solid
    const wingDissolve = dissolving ? dissolveProgress : 0;
    mat.uniforms.uDissolveProgress.value = wingDissolve;

    // Update each feather's transform based on wing state
    for (let i = 0; i < totalCount; i++) {
      const data = featherData[i];
      const layer = data.layer;
      const layerT = layer.count > 1 ? data.index / (layer.count - 1) : 0.5;

      // Decompose base matrix
      dummy.matrix.copy(data.baseMatrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

      // Wing spread — feathers splay outward as spread increases
      const spreadFactor = THREE.MathUtils.lerp(0.4, 1.0, wingSpread);
      const baseAngle = THREE.MathUtils.lerp(-layer.spreadAngle / 2, layer.spreadAngle / 2, layerT);
      const spreadAngle = baseAngle * spreadFactor + layer.rotationOffset;

      // Wing sweep — feathers rotate back/forward
      const sweepAmount = wingSweep * (0.3 + layerT * 0.7);

      // Recompute position based on spread
      const radius = 0.3 + layer.layerOffset;
      dummy.position.copy(layer.offset);
      if (layer.rotationAxis === 'z') {
        dummy.position.x += Math.sin(spreadAngle + sweepAmount) * radius;
        dummy.position.y += Math.cos(spreadAngle + sweepAmount) * radius * 0.3;
      }
      dummy.position.y += Math.sin(time * 0.8 + data.flutterOffset) * flutter * 0.05 * layerT;

      // Recompute rotation
      if (layer.rotationAxis === 'z') {
        dummy.rotation.z = spreadAngle + sweepAmount - Math.PI / 2;
        dummy.rotation.x = layer.curlAmount * (1 - layerT * 0.5) - wingSpread * 0.1;
      }

      // Mirror for left side
      if (side === 'left') {
        dummy.position.x = -dummy.position.x;
        dummy.rotation.z = -dummy.rotation.z;
        dummy.rotation.y = -dummy.rotation.y;
      }

      // Flutter — delayed spring response
      const flutterDelay = data.flutterOffset;
      const flutterWave = Math.sin(time * 1.8 - flutterDelay) * flutter * 0.12 * layerT;
      dummy.rotation.z += flutterWave;

      dummy.updateMatrix();
      tempMatrix.copy(dummy.matrix);

      // Dissolve: shrink feathers that are dissolving
      if (dissolving && data.dissolveFactor > 0) {
        const featherDissolve = dissolveProgress * data.dissolveFactor;
        const shrink = 1.0 - featherDissolve * 0.6;
        tempMatrix.scale(new THREE.Vector3(shrink, shrink, shrink));
      }

      meshRef.current.setMatrixAt(i, tempMatrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, totalCount]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
}
