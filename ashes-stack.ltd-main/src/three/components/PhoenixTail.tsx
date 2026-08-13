import * as THREE from 'three';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  createFeatherGeometry,
  computeFeatherTransform,
  TAIL_FEATHER_LAYERS,
} from '../geometry/featherGeometry';
import { createFeatherMaterial } from '../geometry/materials';

type PhoenixTailProps = {
  accentColor: THREE.Color;
  flutter: number;
  scrollProgress: number;
  dissolveProgress: number;
  wireframeMix: number;
};

/**
 * Phoenix tail — long flowing feathers spread in a fan below the body.
 * Uses instanced mesh for all tail feathers.
 */
export function PhoenixTail({
  accentColor,
  flutter,
  scrollProgress,
  dissolveProgress,
  wireframeMix,
}: PhoenixTailProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => createFeatherGeometry(1.0, 0.18, 8, 0.1), []);
  const material = useMemo(() => createFeatherMaterial(accentColor, false), []); // eslint-disable-line

  const { featherData, totalCount } = useMemo(() => {
    const allData: { baseMatrix: THREE.Matrix4; flutterOffset: number; layerT: number }[] = [];
    const dummy = new THREE.Object3D();

    for (const layer of TAIL_FEATHER_LAYERS) {
      for (let i = 0; i < layer.count; i++) {
        const { position, rotation, scale } = computeFeatherTransform(layer, i, 'tail');
        dummy.position.copy(position);
        dummy.rotation.copy(rotation);
        dummy.scale.copy(scale);
        dummy.updateMatrix();

        const layerT = layer.count > 1 ? i / (layer.count - 1) : 0.5;
        allData.push({
          baseMatrix: dummy.matrix.clone(),
          flutterOffset: i * 0.2 + layer.layerOffset * 3,
          layerT,
        });
      }
    }
    return { featherData: allData, totalCount: allData.length };
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < totalCount; i++) {
      meshRef.current.setMatrixAt(i, featherData[i].baseMatrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [featherData, totalCount]);

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = time;
    mat.uniforms.uFlutter.value = flutter;
    mat.uniforms.uScrollProgress.value = scrollProgress;
    mat.uniforms.uAccentColor.value = accentColor;
    mat.uniforms.uDissolveProgress.value = dissolveProgress * 0.3;
    mat.uniforms.uWireframeMix.value = wireframeMix;

    for (let i = 0; i < totalCount; i++) {
      const data = featherData[i];
      dummy.matrix.copy(data.baseMatrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

      // Tail drifts independently
      const drift = Math.sin(time * 0.6 + data.flutterOffset) * flutter * 0.08;
      dummy.rotation.y += drift;
      dummy.rotation.x += Math.sin(time * 0.4 + data.flutterOffset * 0.5) * flutter * 0.04;

      dummy.updateMatrix();
      tempMatrix.copy(dummy.matrix);
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
