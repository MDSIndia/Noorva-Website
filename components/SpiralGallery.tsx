"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { galleryTransition } from "./store";
import { storyChapters } from "./storyData";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ─── SHADER ──────────────────────────────────────────────────────
   A real cylindrical roll — not a full-plane curl — travels once
   across the plane, left to right, as `uProgress` goes 0 → 1. Only
   the narrow band at the tube itself is wrapped into a half-cylinder
   cross-section (same sin/cos tube math as a full curl, just
   localized to a moving band); everything ahead of it stays flat on
   the old photo and everything behind it is already flat on the new
   one. Because the sweep never reverses, the roll happens exactly
   once per transition instead of curling shut and back open.        */
const VERTEX_SHADER = /* glsl */ `
  uniform float uProgress;  // 0 = tube before the left edge, 1 = tube past the right edge
  uniform float uRadius;    // tube radius, in the same unit-square space as position.x
  uniform float uBandWidth; // width of the tube's footprint as it travels
  varying vec2 vUv;
  varying float vLocalT; // 0 = ahead of the tube (old photo), 1 = behind it (new photo)
  varying vec3 vViewPos;

  const float PI = 3.14159265;

  void main() {
    vUv = uv;

    float xNorm = position.x + 0.5; // 0 (left edge) .. 1 (right edge)
    float center = mix(-uBandWidth * 0.5, 1.0 + uBandWidth * 0.5, uProgress);
    float localT = clamp((center - xNorm) / uBandWidth + 0.5, 0.0, 1.0);
    vLocalT = localT;

    // Wrap just this band around a half-cylinder — a genuine tube
    // cross-section, not a soft bump — so the traveling seam reads
    // unmistakably as a rolling photo rather than a fade.
    float angle = localT * PI;
    vec3 pos = position;
    pos.z += sin(angle) * uRadius;

    vec4 viewPos = modelViewMatrix * vec4(pos, 1.0);
    vViewPos = viewPos.xyz;
    gl_Position = projectionMatrix * viewPos;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uGradeA;  // 0 = faded/sepia, 1 = full color
  uniform float uGradeB;
  uniform vec4 uCoverA;   // xy = scale, zw = offset (object-cover UV correction)
  uniform vec4 uCoverB;
  varying vec2 vUv;
  varying float vLocalT;
  varying vec3 vViewPos;

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
    vec3 color = mix(colA, colB, smoothstep(0.48, 0.52, vLocalT));

    // Strong per-pixel shading on the tube itself, from real screen-space
    // derivatives of its geometry, so the roll reads as a lit cylinder —
    // dark on the trailing curve, a bright highlight along its crest.
    vec3 normal = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));
    if (normal.z < 0.0) normal = -normal;
    vec3 lightDir = normalize(vec3(0.35, 0.55, 1.0));
    float diff = max(dot(normal, lightDir), 0.0);
    color *= 0.32 + diff * 1.25;

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
  // resize/render, since the roll shader operates in normalized -0.5..0.5
  // space regardless of the mesh's actual on-screen size.
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 220, 2), []);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uRadius: { value: 0.22 },
      uBandWidth: { value: 0.3 },
      uTexA: { value: textures[0] },
      uTexB: { value: textures[1] ?? textures[0] },
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

    // Light smoothing so the roll never feels stepped even at low frame rates.
    const raw = clamp(galleryTransition.progress, 0, 1);
    smoothed.current += (raw - smoothed.current) * (1 - Math.exp(-delta * 18));

    mat.uniforms.uProgress.value = smoothed.current;

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
