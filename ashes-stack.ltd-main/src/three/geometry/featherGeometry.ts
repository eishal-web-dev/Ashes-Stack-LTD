import * as THREE from 'three';

/**
 * Creates a tapered, curved feather BufferGeometry with real depth.
 * The feather has a central shaft (rachis) and vanes on both sides,
 * tapers toward the tip, has slight curvature, and casts shadows.
 *
 * The geometry is built in local space with the base at origin and
 * the tip extending along +Y. Width is along X, depth curvature along Z.
 */
export function createFeatherGeometry(
  length = 1.0,
  width = 0.35,
  segments = 12,
  depth = 0.08,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // We build the feather as a strip of quads along the shaft,
  // with vanes tapering to zero at tip and base.
  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 at base, 1 at tip
    const y = t * length;

    // Width profile — narrow at base, widest near 25%, tapering to point at tip
    const widthProfile =
      Math.sin(t * Math.PI) * 0.7 + // general curved shape
      Math.sin(t * Math.PI * 0.5) * 0.3; // wider toward base
    const halfWidth = width * widthProfile * (1 - t * 0.85); // taper to tip

    // Curvature in Z — feather arches slightly forward
    const zCurve = Math.sin(t * Math.PI * 0.6) * depth;
    // Slight twist toward tip
    const twist = t * 0.15;

    // Left vane edge
    const lx = -halfWidth * Math.cos(twist);
    const lz = -halfWidth * Math.sin(twist) + zCurve;
    // Right vane edge
    const rx = halfWidth * Math.cos(twist);
    const rz = halfWidth * Math.sin(twist) + zCurve;

    // Shaft position (center)
    const sx = 0;
    const sz = zCurve;

    positions.push(lx, y, lz); // left vane
    positions.push(sx, y, sz); // shaft
    positions.push(rx, y, rz); // right vane

    // UVs
    uvs.push(0, t);
    uvs.push(0.5, t);
    uvs.push(1, t);

    // Normals — mostly up/forward, adjusted for curvature
    const baseNormal = new THREE.Vector3(0, 0.2, 1).normalize();
    normals.push(baseNormal.x, baseNormal.y, baseNormal.z);
    normals.push(baseNormal.x, baseNormal.y, baseNormal.z);
    normals.push(baseNormal.x, baseNormal.y, baseNormal.z);
  }

  // Build faces between strips
  for (let i = 0; i < segments; i++) {
    const row = i * 3;
    const nextRow = (i + 1) * 3;
    // Left vane quad
    indices.push(row, nextRow, row + 1);
    indices.push(row + 1, nextRow, nextRow + 1);
    // Right vane quad
    indices.push(row + 1, nextRow, row + 2);
    indices.push(row + 2, nextRow, nextRow + 1);
    // Backface (so we see from both sides)
    indices.push(row + 1, nextRow, row);
    indices.push(nextRow + 1, row + 1, nextRow);
    indices.push(row + 2, nextRow, row + 1);
    indices.push(nextRow + 1, row + 2, row + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  // Add custom attributes for the feather shader
  const vertCount = positions.length / 3;
  const featherIndex = new Float32Array(vertCount);
  const restPos = new Float32Array(positions);
  const flexDir = new Float32Array(vertCount * 3);

  for (let i = 0; i < vertCount; i++) {
    featherIndex[i] = 0; // will be set per-instance
    const py = positions[i * 3 + 1];
    const normY = py / length;
    // Flex direction: mostly outward from shaft, stronger at tip
    flexDir[i * 3] = positions[i * 3] * normY;
    flexDir[i * 3 + 1] = normY * 0.2;
    flexDir[i * 3 + 2] = 0.1 * normY;
  }

  geo.setAttribute('aFeatherIndex', new THREE.Float32BufferAttribute(featherIndex, 1));
  geo.setAttribute('aRestPos', new THREE.Float32BufferAttribute(restPos, 3));
  geo.setAttribute('aFlexDir', new THREE.Float32BufferAttribute(flexDir, 3));

  return geo;
}

/**
 * Feather layer definition — defines the arrangement of feathers
 * along a wing or tail.
 */
export type FeatherLayer = {
  name: string;
  count: number;
  lengthBase: number;
  lengthTip: number;
  widthBase: number;
  widthTip: number;
  spreadAngle: number; // total arc the layer covers
  offset: THREE.Vector3; // base position relative to wing root
  rotationAxis: 'x' | 'y' | 'z';
  rotationOffset: number;
  layerOffset: number; // distance from previous layer (stacking)
  curlAmount: number;
  dissolveFactor: number; // 0 = solid, 1 = fully dissolvable
};

/**
 * Default feather layers for a wing, from inner to outer.
 */
export const WING_FEATHER_LAYERS: FeatherLayer[] = [
  {
    name: 'shoulder',
    count: 8,
    lengthBase: 0.45,
    lengthTip: 0.55,
    widthBase: 0.28,
    widthTip: 0.22,
    spreadAngle: 0.6,
    offset: new THREE.Vector3(0, 0, 0),
    rotationAxis: 'z',
    rotationOffset: 0.3,
    layerOffset: 0.0,
    curlAmount: 0.15,
    dissolveFactor: 0.0,
  },
  {
    name: 'coverts',
    count: 10,
    lengthBase: 0.6,
    lengthTip: 0.75,
    widthBase: 0.25,
    widthTip: 0.18,
    spreadAngle: 0.9,
    offset: new THREE.Vector3(0.05, 0.05, 0.02),
    rotationAxis: 'z',
    rotationOffset: 0.1,
    layerOffset: 0.06,
    curlAmount: 0.2,
    dissolveFactor: 0.1,
  },
  {
    name: 'secondaries',
    count: 12,
    lengthBase: 0.85,
    lengthTip: 1.05,
    widthBase: 0.22,
    widthTip: 0.15,
    spreadAngle: 1.2,
    offset: new THREE.Vector3(0.1, 0.1, 0.04),
    rotationAxis: 'z',
    rotationOffset: -0.05,
    layerOffset: 0.1,
    curlAmount: 0.25,
    dissolveFactor: 0.3,
  },
  {
    name: 'primaries',
    count: 14,
    lengthBase: 1.15,
    lengthTip: 1.55,
    widthBase: 0.2,
    widthTip: 0.1,
    spreadAngle: 1.5,
    offset: new THREE.Vector3(0.15, 0.15, 0.06),
    rotationAxis: 'z',
    rotationOffset: -0.2,
    layerOffset: 0.08,
    curlAmount: 0.3,
    dissolveFactor: 0.6,
  },
  {
    name: 'outer-dissolve',
    count: 10,
    lengthBase: 1.3,
    lengthTip: 1.7,
    widthBase: 0.16,
    widthTip: 0.06,
    spreadAngle: 0.8,
    offset: new THREE.Vector3(0.2, 0.2, 0.08),
    rotationAxis: 'z',
    rotationOffset: -0.35,
    layerOffset: 0.04,
    curlAmount: 0.35,
    dissolveFactor: 1.0,
  },
];

/**
 * Tail feather layers — long, flowing, spread in a fan.
 */
export const TAIL_FEATHER_LAYERS: FeatherLayer[] = [
  {
    name: 'tail-upper',
    count: 8,
    lengthBase: 1.0,
    lengthTip: 1.4,
    widthBase: 0.2,
    widthTip: 0.08,
    spreadAngle: 0.7,
    offset: new THREE.Vector3(0, -0.3, -0.1),
    rotationAxis: 'y',
    rotationOffset: 0,
    layerOffset: 0.05,
    curlAmount: 0.2,
    dissolveFactor: 0.2,
  },
  {
    name: 'tail-lower',
    count: 10,
    lengthBase: 1.3,
    lengthTip: 1.8,
    widthBase: 0.18,
    widthTip: 0.06,
    spreadAngle: 1.0,
    offset: new THREE.Vector3(0, -0.35, -0.15),
    rotationAxis: 'y',
    rotationOffset: 0.1,
    layerOffset: 0.03,
    curlAmount: 0.3,
    dissolveFactor: 0.4,
  },
];

/**
 * Computes the transform matrix for a single feather in a layer.
 * Returns position, rotation (euler), and scale for that feather.
 */
export function computeFeatherTransform(
  layer: FeatherLayer,
  index: number,
  side: 'left' | 'right' | 'tail' = 'right',
): {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
} {
  const t = layer.count > 1 ? index / (layer.count - 1) : 0.5;
  const angle = THREE.MathUtils.lerp(-layer.spreadAngle / 2, layer.spreadAngle / 2, t)
    + layer.rotationOffset;

  // Length interpolation
  const length = THREE.MathUtils.lerp(layer.lengthBase, layer.lengthTip, t);
  const width = THREE.MathUtils.lerp(layer.widthBase, layer.widthTip, t);

  // Position along wing arc
  const radius = 0.3 + layer.layerOffset;
  const pos = layer.offset.clone();
  if (layer.rotationAxis === 'z') {
    pos.x += Math.sin(angle) * radius;
    pos.y += Math.cos(angle) * radius * 0.3;
  } else {
    pos.x += Math.sin(angle) * radius;
    pos.z += Math.cos(angle) * radius * 0.3;
  }

  // Rotation — feathers splay outward
  const rot = new THREE.Euler();
  if (layer.rotationAxis === 'z') {
    rot.z = angle - Math.PI / 2;
    rot.x = layer.curlAmount * (1 - t * 0.5);
  } else {
    rot.y = angle;
    rot.x = -Math.PI / 2 + layer.curlAmount;
  }

  // Mirror for left side
  if (side === 'left') {
    pos.x = -pos.x;
    rot.z = -rot.z;
    rot.y = -rot.y;
  }

  return {
    position: pos,
    rotation: rot,
    scale: new THREE.Vector3(width, length, width),
  };
}
