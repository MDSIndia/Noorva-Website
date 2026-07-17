"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TERRAIN_VERTEX_SHADER, TERRAIN_FRAGMENT_SHADER } from "./terrainShaders";

interface TerrainProps {
  segments: number;
  glintIntensity: number;
}

const SIZE = 220;

// Shared with Scene.tsx's own directional light, which visibly lights the
// destination props — kept as matching constants (rather than reading the
// live Light object) since this is a raw ShaderMaterial, not a built-in
// lit material that would pick up scene lights automatically.
export const SUN_DIRECTION = new THREE.Vector3(5, 8, 3).normalize();
export const SUN_COLOR = new THREE.Color("#fff4e6").multiplyScalar(1.35);
const AMBIENT_COLOR = new THREE.Color("#3a3f4d").multiplyScalar(0.55);
// Fixed, low-intensity soft-purple — the environment's only branding-
// color touch (see terrainShaders.ts), never blended per-feature.
const ACCENT_COLOR = new THREE.Color("#8b7cf0");

export default function Terrain({ segments, glintIntensity }: TerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => new THREE.PlaneGeometry(SIZE, SIZE, segments, segments), [segments]);
  // The old geometry instance is orphaned (not garbage-collected by JS GC
  // alone — its GPU buffers stay allocated) once `segments` changes and a
  // new one is memoized; dispose it explicitly on unmount/re-create.
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ camera, clock }) => {
    const material = materialRef.current;
    if (!material) return;
    const mesh = meshRef.current;
    if (!mesh) return;
    // Recenter under the camera every frame (classic infinite-ground
    // trick) — the shader samples noise using world-space XZ (position +
    // uCameraOffset, see terrainShaders.ts), not local vertex position, so
    // the regolith/crater pattern doesn't visibly "swim" when the mesh
    // snaps back. This also means each stretch of ground is sampled at a
    // genuinely different, never-repeating world position as the camera
    // travels — different craters/rocks at every destination along the
    // flight path, with no extra per-feature seeding needed.
    mesh.position.x = camera.position.x;
    mesh.position.z = camera.position.z;

    const uniforms = material.uniforms;
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uCameraOffset.value.set(mesh.position.x, mesh.position.z);
    uniforms.uGlintIntensity.value = glintIntensity;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={TERRAIN_VERTEX_SHADER}
        fragmentShader={TERRAIN_FRAGMENT_SHADER}
        // Inline literal, present from this component's very first render
        // rather than seeded later by an effect — R3F's own render loop
        // can compile/render this material before a mount effect has a
        // chance to run (it's driven by requestAnimationFrame, not
        // strictly ordered after React's own effect phase), and the
        // compiled shader's declared `uniform float uTime` etc. get read
        // by three.js's own uniform-upload code on that very first
        // render — if `material.uniforms.uTime` doesn't exist yet at that
        // point, three.js itself throws trying to read `.value` off
        // `undefined` (confirmed: this raced and crashed under the
        // effect-based approach tried first). useFrame above only ever
        // reaches this object through the live material ref, never
        // through this literal's own variable, so it's fine that this
        // object is recreated on ancestor re-render.
        //
        // Also merges in THREE.UniformsLib.fog (fogColor/fogDensity/etc)
        // — `fog={true}` alone only makes three.js inject the #define
        // USE_FOG / fog GLSL chunks into the compiled shader; for a
        // hand-built custom ShaderMaterial (unlike the built-in
        // materials), it does NOT also auto-populate those uniform
        // entries on `.uniforms` for you. Without this merge,
        // three.js's own per-frame refreshFogUniforms() crashes reading
        // `.value` off the missing fogColor/fogDensity uniforms
        // (confirmed via the actual thrown stack trace).
        uniforms={{
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          uTime: { value: 0 },
          uCameraOffset: { value: new THREE.Vector2(0, 0) },
          uSunDirection: { value: SUN_DIRECTION },
          uSunColor: { value: SUN_COLOR },
          uAmbientColor: { value: AMBIENT_COLOR },
          uAccentColor: { value: ACCENT_COLOR },
          uGlintIntensity: { value: glintIntensity },
        }}
        fog
      />
    </mesh>
  );
}
