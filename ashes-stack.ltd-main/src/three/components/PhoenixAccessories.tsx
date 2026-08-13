import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// ── Shared materials ─────────────────────────────────────────────
function useAccessoryMaterials() {
  return useMemo(
    () => ({
      frame: new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.1, 0.1, 0.12),
        roughness: 0.3,
        metalness: 0.8,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0.05, 0.08, 0.12),
        roughness: 0.05,
        metalness: 0,
        transmission: 0.8,
        transparent: true,
        opacity: 0.4,
        ior: 1.5,
      }),
      screen: new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.02, 0.02, 0.03),
        roughness: 0.2,
        metalness: 0.5,
        emissive: new THREE.Color(0.13, 0.83, 0.93),
        emissiveIntensity: 0.15,
      }),
      dark: new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.06, 0.06, 0.08),
        roughness: 0.5,
        metalness: 0.4,
      }),
      accent: (color: THREE.Color) =>
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }),
    }),
    [],
  );
}

// ── Smart Glasses ────────────────────────────────────────────────
export function SmartGlasses({ accentColor }: { accentColor: THREE.Color }) {
  const mats = useAccessoryMaterials();
  const groupRef = useRef<THREE.Group>(null);

  const lensGeo = useMemo(() => new THREE.CircleGeometry(0.07, 16), []);
  const frameGeo = useMemo(() => new THREE.TorusGeometry(0.08, 0.012, 8, 20), []);
  const bridgeGeo = useMemo(() => new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8), []);
  const templeGeo = useMemo(() => new THREE.CylinderGeometry(0.008, 0.008, 0.25, 6), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Subtle holographic shimmer on lenses
    groupRef.current.children.forEach((c, i) => {
      if (c.name === 'lens' && c instanceof THREE.Mesh) {
        const mat = c.material as THREE.Material & { opacity: number };
        mat.opacity = 0.3 + Math.sin(t * 2 + i) * 0.1;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0.02, 0.13]} rotation={[0, 0, 0]}>
      {/* Left lens frame */}
      <mesh geometry={frameGeo} material={mats.frame} position={[0.09, 0, 0]} castShadow />
      {/* Right lens frame */}
      <mesh geometry={frameGeo} material={mats.frame} position={[-0.09, 0, 0]} castShadow />
      {/* Bridge */}
      <mesh geometry={bridgeGeo} material={mats.frame} rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]} />
      {/* Left lens */}
      <mesh name="lens" geometry={lensGeo} material={mats.glass.clone()} position={[0.09, 0, 0.01]} />
      {/* Right lens */}
      <mesh name="lens" geometry={lensGeo} material={mats.glass.clone()} position={[-0.09, 0, 0.01]} />
      {/* Temples */}
      <mesh geometry={templeGeo} material={mats.frame} position={[0.17, 0, -0.05]} rotation={[0, 0.3, Math.PI / 2]} />
      <mesh geometry={templeGeo} material={mats.frame} position={[-0.17, 0, -0.05]} rotation={[0, -0.3, Math.PI / 2]} />
      {/* Neural particles — small glowing dots around glasses */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.2, Math.sin(angle) * 0.08, 0.05]}>
            <sphereGeometry args={[0.008, 6, 6]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Floating Laptop ──────────────────────────────────────────────
export function FloatingLaptop({ accentColor }: { accentColor: THREE.Color }) {
  const mats = useAccessoryMaterials();
  const groupRef = useRef<THREE.Group>(null);

  const baseGeo = useMemo(() => new THREE.BoxGeometry(0.9, 0.03, 0.6), []);
  const screenGeo = useMemo(() => new THREE.BoxGeometry(0.9, 0.6, 0.03), []);
  const screenFaceGeo = useMemo(() => new THREE.PlaneGeometry(0.82, 0.52), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = -0.4 + Math.sin(t * 0.5) * 0.05;
    groupRef.current.rotation.z = Math.sin(t * 0.3) * 0.02;
  });

  return (
    <group ref={groupRef} position={[0.3, -0.4, 0.4]} rotation={[0, -0.3, 0]}>
      {/* Base */}
      <mesh geometry={baseGeo} material={mats.dark} castShadow receiveShadow />
      {/* Screen back */}
      <mesh geometry={screenGeo} material={mats.dark} position={[0, 0.3, -0.28]} rotation={[-0.1, 0, 0]} castShadow />
      {/* Screen face */}
      <mesh
        geometry={screenFaceGeo}
        material={mats.screen.clone()}
        position={[0, 0.3, -0.265]}
        rotation={[-0.1, 0, 0]}
      >
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0.08}
        />
      </mesh>
      {/* Code lines on screen */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh
          key={i}
          position={[-0.3 + (i % 3) * 0.15, 0.45 - Math.floor(i / 3) * 0.08, -0.26]}
          rotation={[-0.1, 0, 0]}
        >
          <planeGeometry args={[0.1 + (i * 0.03) % 0.08, 0.03]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.4} />
        </mesh>
      ))}
      {/* SHIP IT sticker */}
      <mesh position={[0.25, 0.01, 0.15]}>
        <planeGeometry args={[0.12, 0.06]} />
        <meshBasicMaterial color={new THREE.Color(0.78, 0.96, 0.39)} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

// ── Floating Phone ───────────────────────────────────────────────
export function FloatingPhone({ accentColor }: { accentColor: THREE.Color }) {
  const mats = useAccessoryMaterials();
  const groupRef = useRef<THREE.Group>(null);

  const bodyGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const w = 0.18;
    const h = 0.36;
    const r = 0.03;
    shape.moveTo(-w + r, -h);
    shape.lineTo(w - r, -h);
    shape.quadraticCurveTo(w, -h, w, -h + r);
    shape.lineTo(w, h - r);
    shape.quadraticCurveTo(w, h, w - r, h);
    shape.lineTo(-w + r, h);
    shape.quadraticCurveTo(-w, h, -w, h - r);
    shape.lineTo(-w, -h + r);
    shape.quadraticCurveTo(-w, -h, -w + r, -h);
    return new THREE.ExtrudeGeometry(shape, { depth: 0.025, bevelEnabled: false });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.15;
    groupRef.current.position.y = -0.1 + Math.sin(t * 0.6) * 0.03;
  });

  return (
    <group ref={groupRef} position={[-0.5, -0.1, 0.35]} rotation={[0, 0.3, 0]}>
      {/* Phone body */}
      <mesh geometry={bodyGeo} material={mats.dark} castShadow receiveShadow />
      {/* Screen */}
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[0.32, 0.66]} />
        <meshStandardMaterial
          color={new THREE.Color(0.02, 0.02, 0.03)}
          emissive={accentColor}
          emissiveIntensity={0.1}
          roughness={0.2}
        />
      </mesh>
      {/* Notification cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} position={[0, 0.15 - i * 0.12, 0.028]}>
          <planeGeometry args={[0.28, 0.08]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.15 + i * 0.05} />
        </mesh>
      ))}
    </group>
  );
}

// ── VR Glasses ───────────────────────────────────────────────────
type VRGlassesProps = {
  accentColor: THREE.Color;
  secondaryColor: THREE.Color;
  onForehead: boolean; // lifted up vs over eyes
};

export function VRGlasses({ accentColor, secondaryColor, onForehead }: VRGlassesProps) {
  const mats = useAccessoryMaterials();
  const groupRef = useRef<THREE.Group>(null);

  const visorGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.18, -0.08);
    shape.lineTo(0.18, -0.08);
    shape.quadraticCurveTo(0.2, 0, 0.18, 0.08);
    shape.lineTo(-0.18, 0.08);
    shape.quadraticCurveTo(-0.2, 0, -0.18, -0.08);
    return new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 });
  }, []);

  const strapGeo = useMemo(() => new THREE.TorusGeometry(0.22, 0.015, 8, 24, Math.PI), []);

  const lensColor1 = useMemo(() => new THREE.Color(1.0, 0.29, 0.42), []); // coral
  const lensColor2 = useMemo(() => new THREE.Color(0.55, 0.36, 0.96), []); // violet
  const lensColor3 = useMemo(() => new THREE.Color(0.13, 0.83, 0.93), []); // cyan

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Lens glow pulse
    groupRef.current.children.forEach((c) => {
      if (c.name === 'lensGlow' && c instanceof THREE.Mesh) {
        const mat = c.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.4 + Math.sin(t * 1.5 + c.userData.offset) * 0.15;
      }
    });
  });

  // Position: over eyes or lifted on forehead
  const y = onForehead ? 0.12 : 0.02;
  const z = onForehead ? 0.05 : 0.15;

  return (
    <group ref={groupRef} position={[0, y, z]} rotation={[onForehead ? -0.4 : 0, 0, 0]}>
      {/* Visor body */}
      <mesh geometry={visorGeo} material={mats.dark} castShadow receiveShadow />
      {/* Left lens */}
      <mesh name="lensGlow" position={[-0.08, 0, 0.13]} userData={{ offset: 0 }}>
        <circleGeometry args={[0.05, 16]} />
        <meshBasicMaterial color={lensColor1} transparent opacity={0.5} />
      </mesh>
      {/* Right lens */}
      <mesh name="lensGlow" position={[0.08, 0, 0.13]} userData={{ offset: 1.5 }}>
        <circleGeometry args={[0.05, 16]} />
        <meshBasicMaterial color={lensColor2} transparent opacity={0.5} />
      </mesh>
      {/* Center glow */}
      <mesh name="lensGlow" position={[0, 0, 0.13]} userData={{ offset: 3 }}>
        <circleGeometry args={[0.03, 12]} />
        <meshBasicMaterial color={lensColor3} transparent opacity={0.4} />
      </mesh>
      {/* Top strap */}
      <mesh geometry={strapGeo} material={mats.dark} position={[0, 0.08, 0]} rotation={[0, 0, 0]} />
      {/* Side accent lines */}
      <mesh position={[-0.2, 0, 0.06]}>
        <boxGeometry args={[0.01, 0.04, 0.08]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.2, 0, 0.06]}>
        <boxGeometry args={[0.01, 0.04, 0.08]} />
        <meshBasicMaterial color={secondaryColor} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// ── Floating UI elements around capabilities ─────────────────────
export function FloatingUIElements({
  capability,
  accentColor,
}: {
  capability: string;
  accentColor: THREE.Color;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      child.position.y += Math.sin(t * 0.5 + i) * 0.001;
      child.rotation.z = Math.sin(t * 0.3 + i) * 0.05;
    });
  });

  const elements = useMemo(() => {
    const items: { pos: [number, number, number]; size: [number, number]; label?: string }[] = [];
    const count = capability === 'ai' ? 5 : capability === 'web' ? 4 : 3;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + 0.3;
      const r = 1.5 + Math.random() * 0.5;
      items.push({
        pos: [Math.cos(angle) * r, Math.sin(angle) * 0.8 + 0.3, Math.sin(angle) * r * 0.3],
        size: [0.15 + Math.random() * 0.1, 0.04 + Math.random() * 0.03],
      });
    }
    return items;
  }, [capability]);

  return (
    <group ref={groupRef}>
      {elements.map((el, i) => (
        <mesh key={i} position={el.pos}>
          <planeGeometry args={el.size} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  );
}
