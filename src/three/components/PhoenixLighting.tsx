import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type PhoenixLightingProps = {
  accentColor: THREE.Color;
  environmentIntensity: number;
  enableShadows: boolean;
};

/**
 * PhoenixLighting — a three-point lighting rig with accent-colored rim lights.
 * Key light from front-top, fill from the opposite side, rim from behind.
 */
export function PhoenixLighting({ accentColor, environmentIntensity, enableShadows }: PhoenixLightingProps) {
  const rimRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (rimRef.current) {
      const t = state.clock.elapsedTime;
      rimRef.current.intensity = 2 + Math.sin(t * 0.5) * 0.5;
    }
  });

  return (
    <>
      {/* Ambient — low, dark base */}
      <ambientLight intensity={0.15 * environmentIntensity} color={new THREE.Color(0.1, 0.1, 0.15)} />

      {/* Key light — front-top, slightly warm */}
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.2}
        color={new THREE.Color(0.9, 0.88, 0.82)}
        castShadow={enableShadows}
        shadow-mapSize-width={enableShadows ? 1024 : 256}
        shadow-mapSize-height={enableShadows ? 1024 : 256}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0001}
      />

      {/* Fill light — opposite side, cool */}
      <directionalLight
        position={[-3, 2, 2]}
        intensity={0.4}
        color={new THREE.Color(0.3, 0.4, 0.5)}
      />

      {/* Rim light — behind, accent colored */}
      <pointLight
        ref={rimRef}
        position={[0, 2, -3]}
        intensity={2}
        color={accentColor}
        distance={10}
      />

      {/* Bottom bounce — subtle ground reflection */}
      <pointLight
        position={[0, -2, 1]}
        intensity={0.3}
        color={new THREE.Color(0.15, 0.15, 0.2)}
        distance={5}
      />
    </>
  );
}

/**
 * PerspectiveGrid — a subtle grid floor below the phoenix.
 * Gives depth and spatial grounding.
 */
export function PerspectiveGrid() {
  const gridRef = useRef<THREE.GridHelper>(null);

  const grid = useMemo(() => {
    const g = new THREE.GridHelper(20, 40, 0x8b5cf6, 0x1a1a24);
    const mat = g.material as THREE.Material | THREE.Material[];
    if (Array.isArray(mat)) {
      mat.forEach((m) => {
        m.transparent = true;
        m.opacity = 0.08;
      });
    } else {
      mat.transparent = true;
      mat.opacity = 0.08;
    }
    return g;
  }, []);

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.z = (state.clock.elapsedTime * 0.3) % 0.5;
    }
  });

  return <primitive ref={gridRef} object={grid} position={[0, -2.5, 0]} />;
}

/**
 * VolumetricDepth — subtle fog for atmospheric depth.
 */
export function VolumetricDepth() {
  return (
    <fog attach="fog" args={[new THREE.Color(0x08080c), 5, 20]} />
  );
}
