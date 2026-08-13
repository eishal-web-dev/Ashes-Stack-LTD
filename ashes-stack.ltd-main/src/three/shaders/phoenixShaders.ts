// GLSL shader chunks shared across the phoenix materials
// All shaders are written as plain strings for THREE.ShaderMaterial / raw shader composition

// ── Noise utilities ──────────────────────────────────────────────
// Simplex 3D noise by Ashima Arts (public domain)
export const noise3DGLSL = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Fractal Brownian Motion using the simplex noise
float fbm(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// Curl noise for flow-field particle motion — returns a divergence-free vector
vec3 curlNoise(vec3 p) {
  const float eps = 0.1;
  vec3 dx = vec3(eps, 0.0, 0.0);
  vec3 dy = vec3(0.0, eps, 0.0);
  vec3 dz = vec3(0.0, 0.0, eps);

  float p_x0 = snoise(p - dy).x; float p_x1 = snoise(p + dy).x;
  float p_y0 = snoise(p - dz).y; float p_y1 = snoise(p + dz).y;
  float p_z0 = snoise(p - dx).z; float p_z1 = snoise(p + dx).z;

  float y = p_y1 - p_y0 - 2.0 * eps;
  float z = p_z1 - p_z0 - 2.0 * eps;
  float x = p_x1 - p_x0 - 2.0 * eps;

  return normalize(vec3(y, z, x) + 0.0001);
}
`;

// ── Energy Particle Vertex Shader ────────────────────────────────
export const energyParticleVertex = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform vec2 uPointer;
uniform float uPointerStrength;
uniform float uPixelRatio;
uniform float uScrollProgress;

attribute float aScale;
attribute float aOffset;
attribute float aSpeed;
attribute vec3 aColor;
attribute vec3 aVelocity;
attribute float aLife;
attribute float aMaxLife;
attribute float aEmissionZone; // 0=wing, 1=chest, 2=neck, 3=tail, 4=dissolve

varying vec3 vColor;
varying float vAlpha;
varying float vLifeRatio;

void main() {
  vec3 pos = position;

  // Lifecycle: 0 → 1 over aMaxLife
  float t = mod(uTime * aSpeed + aOffset, aMaxLife) / aMaxLife;
  vLifeRatio = t;

  // Travel along velocity, accelerating slightly
  float accel = 1.0 + t * 0.8;
  pos += aVelocity * t * accel;

  // Flow-field curl noise curves the path
  vec3 flow = curlNoise(pos * 0.5 + uTime * 0.1);
  pos += flow * t * 0.6;

  // Pointer attraction — particles drift toward cursor
  vec2 toPointer = uPointer - pos.xy;
  float dist = length(toPointer);
  float pull = uPointerStrength * (1.0 / (dist * dist + 0.5));
  pos.xy += toPointer * pull * 0.3 * (1.0 - t);

  // Fade in early, fade out late
  float fadeIn = smoothstep(0.0, 0.15, t);
  float fadeOut = 1.0 - smoothstep(0.7, 1.0, t);
  vAlpha = fadeIn * fadeOut;
  vColor = aColor;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size attenuation with perspective
  float size = aScale * uSize * uPixelRatio * (1.0 + t * 0.5);
  gl_PointSize = size * (300.0 / -mvPosition.z);
}
`;

// ── Energy Particle Fragment Shader ──────────────────────────────
export const energyParticleFragment = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
varying float vLifeRatio;

void main() {
  // Soft circular point with bright core
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float core = 1.0 - smoothstep(0.0, 0.15, d);
  float glow = 1.0 - smoothstep(0.0, 0.5, d);
  float intensity = core * 0.8 + glow * 0.3;

  // Slight color shift over life — starts brighter, cools at end
  vec3 col = vColor * (0.7 + intensity * 0.6);
  col += vColor * core * 1.5;

  float alpha = vAlpha * intensity * 0.9;
  gl_FragColor = vec4(col, alpha);
}
`;

// ── Feather / Body Vertex Shader ─────────────────────────────────
export const featherVertex = /* glsl */ `
uniform float uTime;
uniform float uFlutter;
uniform float uScrollProgress;
uniform float uDissolveProgress;

attribute float aFeatherIndex;
attribute vec3 aRestPos;
attribute vec3 aFlexDir;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vDissolveFactor;
varying float vFeatherDepth;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;

  // Flutter: delayed spring response based on feather index
  float delay = aFeatherIndex * 0.04;
  float wave = sin(uTime * 1.5 - delay) * uFlutter;
  pos += aFlexDir * wave * 0.15;

  // Dissolve displacement — feathers shrink toward root as dissolve progresses
  float distFromRoot = length(pos - aRestPos);
  float dissolveMask = smoothstep(0.0, 1.0, uDissolveProgress - distFromRoot * 0.3);
  pos *= 1.0 - dissolveMask * 0.5;

  vDissolveFactor = dissolveMask;
  vFeatherDepth = distFromRoot;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPos = worldPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

// ── Feather / Body Fragment Shader (carbon-black with energy glints) ──
export const featherFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uAccentColor;
uniform float uDissolveProgress;
uniform float uNoiseScale;
uniform float uEdgeWidth;
uniform float uWireframeMix;
uniform vec3 uRimColor;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vDissolveFactor;
varying float vFeatherDepth;
varying vec2 vUv;

${noise3DGLSL}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);

  // Fresnel rim — warm rakh-grey edges with metallic feel
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);

  // Base matte carbon-black
  vec3 baseColor = vec3(0.025, 0.025, 0.03);
  // Dark mineral highlights
  vec3 mineralHL = vec3(0.08, 0.085, 0.1);
  // Warm rakh-grey edge
  vec3 rakhEdge = vec3(0.22, 0.19, 0.16);

  float NdotV = max(dot(normal, viewDir), 0.0);
  vec3 color = mix(baseColor, mineralHL, NdotV * 0.4);
  color = mix(color, rakhEdge, fresnel * 0.6);

  // Internal energy glints — subtle noise-driven colored sparks
  float glintNoise = fbm(vWorldPos * uNoiseScale * 3.0 + uTime * 0.3, 3);
  float glintMask = smoothstep(0.6, 0.8, glintNoise);
  color += uAccentColor * glintMask * 0.15;

  // Fine wireframe detail in selected areas (feather center)
  float wireZone = smoothstep(0.3, 0.5, vUv.y) * smoothstep(0.7, 0.5, vUv.y);
  float wirePattern = abs(sin(vUv.x * 30.0)) * abs(sin(vUv.y * 12.0));
  color += uRimColor * wirePattern * wireZone * uWireframeMix * 0.08;

  // ── Ash dissolve ──
  float dissolveNoise = fbm(vWorldPos * uNoiseScale + uTime * 0.05, 4);
  float dissolveThreshold = uDissolveProgress * 1.3 - 0.15;
  float dissolved = smoothstep(dissolveThreshold - uEdgeWidth, dissolveThreshold + uEdgeWidth, dissolveNoise + vDissolveFactor * 0.3);

  // Dissolve edge — mineral/colored, not fire
  float edgeBand = smoothstep(dissolveThreshold - uEdgeWidth, dissolveThreshold, dissolveNoise + vDissolveFactor * 0.3)
                 - smoothstep(dissolveThreshold, dissolveThreshold + uEdgeWidth, dissolveNoise + vDissolveFactor * 0.3);
  vec3 dissolveEdgeColor = mix(uAccentColor, vec3(0.4, 0.38, 0.35), 0.5);
  color += dissolveEdgeColor * edgeBand * 2.0;

  if (dissolved > 0.95) discard;

  float alpha = 1.0 - dissolved * 0.98;
  gl_FragColor = vec4(color, alpha);
}
`;

// ── Ash Dissolve Particle Vertex (for fragments breaking off) ────
export const ashDissolveVertex = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;

attribute float aScale;
attribute vec3 aColor;
attribute float aOffset;
attribute vec3 aBasePos;
attribute vec3 aDir;

varying vec3 vColor;
varying float vAlpha;

void main() {
  float t = mod(uTime * 0.3 + aOffset, 1.0);
  vec3 pos = aBasePos + aDir * t * 2.0;
  pos.y -= t * t * 0.5; // gravity

  vAlpha = (1.0 - t) * smoothstep(0.0, 0.1, t);
  vColor = aColor;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = aScale * uSize * uPixelRatio * (200.0 / -mvPosition.z);
}
`;

export const ashDissolveFragment = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float softness = 1.0 - smoothstep(0.0, 0.5, d);
  gl_FragColor = vec4(vColor, vAlpha * softness * 0.6);
}
`;
