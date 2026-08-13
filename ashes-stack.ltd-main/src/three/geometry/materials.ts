import * as THREE from 'three';
import { featherVertex, featherFragment } from '../shaders/phoenixShaders';

/**
 * Creates the shared ShaderMaterial for phoenix feathers.
 * All feather instances share this material — only uniforms are updated.
 */
export function createFeatherMaterial(
  accentColor: THREE.Color,
  isDissolving: boolean,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: featherVertex,
    fragmentShader: featherFragment,
    uniforms: {
      uTime: { value: 0 },
      uFlutter: { value: 0.3 },
      uScrollProgress: { value: 0 },
      uDissolveProgress: { value: isDissolving ? 0.3 : 0 },
      uAccentColor: { value: accentColor },
      uNoiseScale: { value: 2.5 },
      uEdgeWidth: { value: 0.08 },
      uWireframeMix: { value: 0 },
      uRimColor: { value: new THREE.Color(0.22, 0.19, 0.16) },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true,
  });
}

/**
 * Creates a simpler MeshStandardMaterial for body parts.
 * Matte carbon-black with dark mineral highlights.
 */
export function createBodyMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.025, 0.025, 0.03),
    roughness: 0.7,
    metalness: 0.3,
    flatShading: false,
  });
}

/**
 * Creates a material for beak and claws — darker, more metallic.
 */
export function createBeakMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.15, 0.13, 0.11),
    roughness: 0.4,
    metalness: 0.6,
  });
}

/**
 * Creates a glowing energy material for accents (eyes, internal glints).
 */
export function createEnergyMaterial(color: THREE.Color): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.8,
  });
}

/**
 * Shared geometry cache — avoids recreating geometries.
 */
const geometryCache = new Map<string, THREE.BufferGeometry>();

export function getCachedGeometry(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geometryCache.has(key)) {
    geometryCache.set(key, factory());
  }
  return geometryCache.get(key)!;
}

export function disposeGeometryCache(): void {
  geometryCache.forEach((g) => g.dispose());
  geometryCache.clear();
}
