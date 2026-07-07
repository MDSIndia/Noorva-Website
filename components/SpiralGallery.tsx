"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { galleryTransition } from "./store";
import { storyChapters } from "./storyData";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ─── SHADER ──────────────────────────────────────────────────────
   A single plane, finely subdivided along X, deforms from a flat
   sheet into an open cylindrical spiral as `uProgress` goes 0 → 1.
   The center-to-edge sweep is genuine 3D geometry (mix of a flat
   position and a wrapped-around-a-cylinder position) — not a CSS
   scale trick — so the image plane actually curls, with real
   perspective and per-vertex lighting. Geometry stays a fixed unit
   square (-0.5..0.5); actual on-screen size comes from mesh.scale,
   so the curl math never has to care about viewport size.          */
const VERTEX_SHADER = /* glsl */ `
  uniform float uProgress; // 0 = flat sheet, 1 = fully rolled tube
  uniform float uRadius;   // tube radius, in the same unit-square space as position.x
  uniform float uTurns;    // how many times the sheet wraps around itself
  varying vec2 vUv;
  varying float vLight;

  const float TAU = 6.28318530718;

  void main() {
    vUv = uv;

    float xNorm = position.x + 0.5; // 0 (anchored edge) .. 1 (rolling edge)
    float fullAngle = xNorm * uTurns * TAU;
    float turnIndex = floor(fullAngle / TAU);
    float radiusAtTurn = uRadius / (1.0 + turnIndex * 0.45);

    vec3 flatPos = vec3(position.x, position.y, 0.0);
    vec3 rolledPos = vec3(
      sin(fullAngle) * radiusAtTurn,
      position.y,
      -(1.0 - cos(fullAngle)) * radiusAtTurn
    );

    vec3 pos = mix(flatPos, rolledPos, uProgress);

    vec3 flatNormal = vec3(0.0, 0.0, 1.0);
    vec3 rolledNormal = normalize(vec3(sin(fullAngle), 0.0, cos(fullAngle)));
    vec3 n = normalize(mix(flatNormal, rolledNormal, uProgress));
    vec3 worldNormal = normalize(normalMatrix * n);

    vec3 lightDir = normalize(vec3(0.35, 0.55, 1.0));
    float diff = max(dot(worldNormal, lightDir), 0.0);
    vLight = 0.24 + diff * 0.98;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uMix;     // 0 = show A, 1 = show B
  uniform float uGradeA;  // 0 = faded/sepia, 1 = full color
  uniform float uGradeB;
  uniform vec4 uCoverA;   // xy = scale, zw = offset (object-cover UV correction)
  uniform vec4 uCoverB;
  varying vec2 vUv;
  varying float vLight;

  vec3 applyGrade(vec3 c, float g) {
    float gray = dot(c, vec3(0.299, 0.587, 0.114));
    vec3 warm = vec3(gray * 1.08, gray * 0.92, gray * 0.72);
    return mix(warm, c, clamp(g, 0.0, 1.0));
  }

  void main() {
    vec2 uvA = clamp(vUv * uCoverA.xy + uCoverA.zw, 0.0, 1.0);
    vec2 uvB = clamp(vUv * uCoverB.xy + uCoverB.zw, 0.0, 1.0);

    vec3 colA = applyGrade(texture2D(uTexA, uvA).rgb, uGradeA);
    vec3 colB = applyGrade(texture2D(uTexB, uvB).rgb, uGradeB);
    vec3 color = mix(colA, colB, uMix);

    color *= vLight;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function coverUV(imgW: number, imgH: number, viewportW: number, viewportH: number): [number, number, number, number] {
  const imgAspect = imgW / imgH;
  const viewAspect = viewportW / viewportH;
  let scaleX = 1, scaleY = 1, offX = 0, offY = 0;
  if (viewAspect > imgAspect) {
    // viewport wider than image -> crop top/bottom
    scaleY = imgAspect / viewAspect;
    offY = (1 - scaleY) / 2;
  } else {
    scaleX = viewAspect / imgAspect;
    offX = (1 - scaleX) / 2;
  }
  return [scaleX, scaleY, offX, offY];
}

function GalleryPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothed = useRef(0);

  const textures = useTexture(storyChapters.map((c) => c.imageSrc));

  // Fixed unit-square geometry, created exactly once — never recreated on
  // resize/render, since the curl shader operates in normalized -0.5..0.5
  // space regardless of the mesh's actual on-screen size.
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 220, 2), []);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uRadius: { value: 0.26 },
      uTurns: { value: 1.85 },
      uTexA: { value: textures[0] },
      uTexB: { value: textures[1] ?? textures[0] },
      uMix: { value: 0 },
      uGradeA: { value: storyChapters[0].grade },
      uGradeB: { value: storyChapters[1]?.grade ?? storyChapters[0].grade },
      uCoverA: { value: new THREE.Vector4(1, 1, 0, 0) },
      uCoverB: { value: new THREE.Vector4(1, 1, 0, 0) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame(({ viewport }, delta) => {
    const mat = materialRef.current;
    const mesh = meshRef.current;
    if (!mat || !mesh) return;

    // Size the mesh to fill the viewport every frame (cheap: three number
    // writes, no allocation) instead of recreating geometry on resize.
    mesh.scale.set(viewport.width, viewport.height, viewport.width);

    // Light smoothing so the curl never feels stepped even at low frame rates.
    const raw = clamp(galleryTransition.progress, 0, 1);
    smoothed.current += (raw - smoothed.current) * (1 - Math.exp(-delta * 18));
    const t = smoothed.current; // 0 = flat on fromIndex, 1 = flat on toIndex

    const curl = t < 0.5 ? t * 2 : (1 - t) * 2;
    const mixT = t < 0.5 ? 0 : 1;

    mat.uniforms.uProgress.value = curl;
    mat.uniforms.uMix.value = mixT;

    const texA = textures[galleryTransition.fromIndex];
    const texB = textures[galleryTransition.toIndex];
    if (mat.uniforms.uTexA.value !== texA) mat.uniforms.uTexA.value = texA;
    if (mat.uniforms.uTexB.value !== texB) mat.uniforms.uTexB.value = texB;

    mat.uniforms.uGradeA.value = storyChapters[galleryTransition.fromIndex].grade;
    mat.uniforms.uGradeB.value = storyChapters[galleryTransition.toIndex].grade;

    const imgA = texA.image as { width: number; height: number };
    const imgB = texB.image as { width: number; height: number };
    if (imgA?.width) {
      const [sx, sy, ox, oy] = coverUV(imgA.width, imgA.height, viewport.width, viewport.height);
      mat.uniforms.uCoverA.value.set(sx, sy, ox, oy);
    }
    if (imgB?.width) {
      const [sx, sy, ox, oy] = coverUV(imgB.width, imgB.height, viewport.width, viewport.height);
      mat.uniforms.uCoverB.value.set(sx, sy, ox, oy);
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function CameraDrift() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.12) * 0.08;
    camera.position.y = Math.cos(t * 0.09) * 0.05;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function SpiralGallery({
  frameloop = "always",
}: {
  frameloop?: "always" | "never" | "demand";
}) {
  return (
    <Canvas
      frameloop={frameloop}
      camera={{ position: [0, 0, 5.2], fov: 50, near: 0.1, far: 100 }}
      style={{ position: "absolute", inset: 0 }}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
    >
      <CameraDrift />
      <Suspense fallback={null}>
        <GalleryPlane />
      </Suspense>
    </Canvas>
  );
}
