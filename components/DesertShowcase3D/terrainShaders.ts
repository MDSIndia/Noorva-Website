// 2D simplex noise — Ashima Arts / Ian McEwan's well-known webgl-noise
// implementation (MIT), the same algorithm the `glsl-noise` package (an
// installed transitive dep) ships. Inlined as a plain string rather than
// imported from that package: `glsl-noise`'s files are written for the
// glslify bundler transform (`#pragma glslify: require(...)`), and this
// project has no glslify loader configured (plain Turbopack) — pulling in
// glslify solely for one noise function isn't worth the build config
// change, so the algorithm is copied in directly instead.
const SIMPLEX_NOISE_2D = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

const FBM = /* glsl */ `
float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amp * snoise(p);
    p *= 2.02;
    amp *= 0.5;
  }
  return value;
}
`;

// Cheap 2D hash + a vec2 variant — used for crater-field cell placement,
// not meant to be a high-quality random source, just decorrelated enough
// to avoid visible periodicity.
const HASH = /* glsl */ `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec2 hash22(vec2 p) {
  return vec2(hash21(p), hash21(p + 19.19));
}
`;

// Procedural crater field — the standard hashed-cell scattering technique
// for convincing crater fields without an authored heightmap: each cell
// of a fixed lattice has a chance of hosting one crater (randomized
// position-within-cell, radius, depth); every sample checks its own cell
// plus the surrounding 3x3 neighborhood so craters can overlap cell
// borders without seams. Each crater is a smooth paraboloid bowl with a
// slightly raised rim, which is what actually sells "crater" rather than
// just "dip."
const CRATER_FIELD = /* glsl */ `
const float CRATER_FREQ = 0.045;

float craterShape(float d, float depth) {
  // d = distance from crater center / crater radius. Deep, smooth bowl
  // near the center; a small raised ring right around d = 1 (the rim);
  // fades to exactly 0 by ~d = 1.5 so neighboring craters blend cleanly.
  float bowl = smoothstep(1.0, 0.0, d);
  float rim = exp(-pow((d - 1.0) * 6.0, 2.0)) * 0.35;
  return depth * (rim - bowl);
}

float craterField(vec2 worldXZ) {
  vec2 p = worldXZ * CRATER_FREQ;
  vec2 cell = floor(p);
  float total = 0.0;
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      vec2 neighbor = cell + vec2(float(dx), float(dy));
      // Sparse — only ~45% of cells host a crater, so they read as
      // scattered impacts rather than a uniform honeycomb.
      if (hash21(neighbor + 0.17) < 0.55) continue;
      vec2 jitter = hash22(neighbor + 3.7) - 0.5;
      vec2 craterCenter = neighbor + jitter * 0.7;
      float sizeRand = hash21(neighbor + 8.8);
      float radius = mix(0.25, 0.85, sizeRand);
      float depth = mix(0.09, 0.3, sizeRand);
      float d = length(p - craterCenter) / radius;
      if (d > 1.6) continue;
      total += craterShape(d, depth);
    }
  }
  return total;
}
`;

// Shared world-space height field — sampled 3x per vertex (center + two
// small offsets) so the vertex shader can derive a real analytic normal
// from the finite differences below, which is what lets the fragment
// shader do genuine directional-light (Lambert) shading instead of the
// flat, self-illuminated color the old sci-fi terrain used. Three
// contributions, largest to smallest: a very gentle broad undulation
// (soft uneven terrain, not dunes), fine high-frequency regolith bump
// (small rocks / dust texture), and the crater field above. Only the
// regolith layer carries a (tiny, slow) time offset — craters and the
// broad undulation are static, since real geology doesn't drift; per the
// brief this should read as "almost unnoticeable," not liquid or wavy.
const HEIGHT_FIELD = /* glsl */ `
uniform float uTime;

// Decomposed variant (used once, for the center vertex) so the caller
// can reuse the individual terms for albedo/AO instead of recomputing
// them — the opaque terrainHeight() below is only for the two small
// normal-sampling offsets, where just the combined height is needed.
float terrainHeightParts(vec2 worldXZ, out float undulation, out float regolith, out float craters) {
  undulation = fbm(worldXZ * 0.02) * 0.15;
  float breathe = uTime * 0.015;
  regolith = fbm(worldXZ * 1.2 + vec2(breathe, 0.0)) * 0.025;
  craters = craterField(worldXZ);
  return undulation + regolith + craters;
}

float terrainHeight(vec2 worldXZ) {
  float u, r, c;
  return terrainHeightParts(worldXZ, u, r, c);
}
`;

export const TERRAIN_VERTEX_SHADER = /* glsl */ `
#include <fog_pars_vertex>

uniform vec2 uCameraOffset;

varying float vAlbedoT;
varying float vCraterDepth;
varying vec2 vWorldXZ;
varying vec3 vNormal;

${HASH}
${SIMPLEX_NOISE_2D}
${FBM}
${CRATER_FIELD}
${HEIGHT_FIELD}

void main() {
  vec2 worldXZ = position.xy + uCameraOffset;
  vWorldXZ = worldXZ;

  float undulation, regolith, craters;
  float h = terrainHeightParts(worldXZ, undulation, regolith, craters);

  // Finite-difference normal — the displacement above happens entirely
  // on the GPU, so there's no CPU-side geometry to run
  // computeVertexNormals() on; sampling the same height field at two
  // small offsets and crossing the resulting tangent vectors is the
  // standard analytic-normal technique for shader-displaced terrain.
  float eps = 0.35;
  float hX = terrainHeight(worldXZ + vec2(eps, 0.0));
  float hZ = terrainHeight(worldXZ + vec2(0.0, eps));
  vec3 tangentX = vec3(eps, 0.0, hX - h);
  vec3 tangentZ = vec3(0.0, eps, hZ - h);
  vec3 n = normalize(cross(tangentX, tangentZ));
  // World-space (not view-space) normal — modelMatrix rather than
  // normalMatrix, since this mesh only ever rotates/translates (no
  // non-uniform scale), and keeping lighting in world space means the
  // fragment shader's sun direction uniform can stay a fixed constant
  // instead of being re-derived into view space every frame.
  vNormal = normalize((modelMatrix * vec4(n, 0.0)).xyz);

  // Cheap per-pixel variation reused in the fragment shader: a
  // fine-noise-driven albedo tint (small rocks/dust patches, not a flat
  // gray) and a crater-bowl darkening factor standing in for ambient
  // occlusion inside craters.
  vAlbedoT = clamp(regolith * 20.0 + 0.5, 0.0, 1.0);
  vCraterDepth = clamp(-craters * 4.0, 0.0, 1.0);

  vec3 transformed = vec3(position.xy, position.z + h);
  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  #include <fog_vertex>
}
`;

// Fragment shader — genuine directional-light (Lambert) shading against
// a fixed sun direction/color (fed from the same directional light in
// Scene.tsx), a small neutral ambient term, fine-noise-varied
// charcoal-to-moon-white albedo, crater-bowl darkening (cheap AO stand-
// in), a faint cool-blue fresnel rim ("slight bluish reflections from
// space"), and a fixed, low-intensity soft-purple rim as the *only*
// branding-color touch — constant regardless of which feature is
// active, replacing the old per-feature saturated accent blend (the
// brief wants the environment to stay monochrome across all 4
// destinations, with purple appearing only as a small accent).
export const TERRAIN_FRAGMENT_SHADER = /* glsl */ `
#include <fog_pars_fragment>

uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uAmbientColor;
uniform vec3 uAccentColor;
uniform float uGlintIntensity;
uniform float uTime;

varying float vAlbedoT;
varying float vCraterDepth;
varying vec2 vWorldXZ;
varying vec3 vNormal;

${HASH}

void main() {
  vec3 N = normalize(vNormal);
  float NdotL = max(dot(N, uSunDirection), 0.0);

  vec3 albedoLow = vec3(0.075, 0.073, 0.08);
  vec3 albedoHigh = vec3(0.52, 0.51, 0.53);
  vec3 albedo = mix(albedoLow, albedoHigh, vAlbedoT);
  albedo *= mix(1.0, 0.5, vCraterDepth);

  vec3 diffuse = albedo * uSunColor * NdotL;
  vec3 ambient = albedo * uAmbientColor;

  float fresnel = pow(1.0 - max(dot(N, vec3(0.0, 1.0, 0.0)), 0.0), 3.0);
  vec3 spaceRim = vec3(0.45, 0.55, 0.78) * fresnel * 0.12;
  vec3 brandRim = uAccentColor * fresnel * 0.05;

  vec3 color = diffuse + ambient + spaceRim + brandRim;

  // Sparkling regolith — real lunar dust contains tiny glass beads
  // (fused by ancient micrometeorite impacts) that catch sunlight as
  // small bright glints; a sparse hashed-cell dot lattice with a slow
  // per-dot twinkle and a sunlit-side bias reads as exactly that, not as
  // a starfield-on-the-ground sci-fi flourish. Mostly dark cells (only
  // ~12% host a glint) keep it a texture detail, not a pattern.
  vec2 glintCell = floor(vWorldXZ * 0.4);
  vec2 glintLocal = fract(vWorldXZ * 0.4) - 0.5;
  float glintHash = hash21(glintCell + 71.3);
  vec2 glintJitter = vec2(hash21(glintCell + 5.3), hash21(glintCell + 91.7)) - 0.5;
  float glintDist = length(glintLocal - glintJitter * 0.72);
  float glintPresence = step(0.88, glintHash);
  float twinkle = 0.5 + 0.5 * sin(uTime * (1.1 + glintHash * 2.2) + glintHash * 30.0);
  float glintDot = smoothstep(0.05, 0.0, glintDist) * glintPresence;
  float sunBias = 0.35 + NdotL * 0.65;
  color += vec3(1.0, 0.98, 0.94) * glintDot * (0.35 + twinkle * 0.65) * sunBias * uGlintIntensity;

  gl_FragColor = vec4(color, 1.0);

  #include <fog_fragment>
}
`;
