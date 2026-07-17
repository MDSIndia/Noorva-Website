"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { Suspense, useEffect, type ReactNode } from "react";
import * as THREE from "three";

interface FitTarget {
  width: number;
  height: number;
  /** Extra breathing room around the target, as a fraction (0.1 = 10% margin on each side). */
  margin?: number;
}

interface SceneProps {
  children: ReactNode;
  frameloop?: "always" | "never" | "demand";
  dpr?: [number, number];
  cameraZ?: number;
  fov?: number;
  /** When set, the camera distance is recomputed every frame so a
   *  fixed-size object (e.g. the book) stays fully in frame regardless of
   *  viewport aspect ratio — a plain fixed cameraZ/fov overflows badly on
   *  narrow (portrait mobile) viewports, since it was tuned against a
   *  roughly landscape aspect. */
  fitTarget?: FitTarget;
  /** Fires once R3F has actually created the WebGL context and measured its
   *  container — the one reliable "safe to animate now" signal for callers
   *  that need to apply a CSS transform to an ancestor without racing R3F's
   *  own internal size measurement (see StoryGallerySection.tsx's
   *  handleEnter for why a blind delay wasn't robust enough). */
  onReady?: () => void;
  /** Overrides the plain `[0, 0, cameraZ]` head-on camera position — needed
   *  for BookLandingScene.tsx's tilted, slightly-elevated view down onto a
   *  desk (a head-on camera can't see a horizontal tabletop at all). Left
   *  undefined by every other caller, which all want the original
   *  straight-on framing. */
  cameraPosition?: [number, number, number];
  /** Paired with `cameraPosition` — R3F only orients the default camera to
   *  look at the origin when `cameraPosition` is itself on the Z axis (the
   *  every-other-caller case); any other position needs an explicit
   *  lookAt or it keeps the camera's default forward (-Z) orientation
   *  regardless of where it's placed. */
  cameraLookAt?: [number, number, number];
  /** ContactShadows' own ground position/scale — defaults match every
   *  existing caller's implicit ground at y=-1. BookLandingScene.tsx's desk
   *  sits at a different height with a much larger footprint, so it needs
   *  to move both. */
  contactShadowPosition?: [number, number, number];
  contactShadowScale?: number;
}

function CameraLookAt({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
    // target is a fresh array literal from the caller every render;
    // comparing its contents isn't worth it for a one-time-per-mount
    // orientation call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);
  return null;
}

function CameraFit({ width, height, margin = 0.08, baseZ, fov }: FitTarget & { baseZ: number; fov: number }) {
  // Reads camera/size off the useFrame callback's own state parameter
  // rather than a separate useThree() call — mutating a value pulled
  // directly off a hook's return identifier trips this repo's
  // react-hooks/immutability lint rule (see PhoneModel.tsx/ScreenContent.tsx
  // for the same worked-around pattern), but reaching it through the
  // callback argument doesn't.
  useFrame((state) => {
    const { camera, size } = state;
    const aspect = size.width / size.height;
    const targetW = width * (1 + margin * 2);
    const targetH = height * (1 + margin * 2);
    const vFov = THREE.MathUtils.degToRad(fov);
    // Distance needed to fit targetH within the vertical FOV, and
    // separately the distance needed to fit targetW within the horizontal
    // FOV (derived from vFov + aspect) — take whichever is farther so
    // BOTH dimensions stay inside frame, not just whichever the fixed fov
    // was originally tuned around.
    const distForHeight = targetH / 2 / Math.tan(vFov / 2);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const distForWidth = targetW / 2 / Math.tan(hFov / 2);
    camera.position.z = Math.max(baseZ, distForHeight, distForWidth);
    camera.updateProjectionMatrix();
  });
  return null;
}

export default function Scene({
  children,
  frameloop = "always",
  dpr = [1, 1.8],
  cameraZ = 3.4,
  fov = 32,
  fitTarget,
  onReady,
  cameraPosition,
  cameraLookAt,
  contactShadowPosition = [0, -1, 0],
  contactShadowScale = 4,
}: SceneProps) {
  return (
    <Canvas
      frameloop={frameloop}
      camera={{ position: cameraPosition ?? [0, 0, cameraZ], fov, near: 0.1, far: 100 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={dpr}
      shadows
      onCreated={onReady}
    >
      {fitTarget && <CameraFit {...fitTarget} baseZ={cameraZ} fov={fov} />}
      {cameraLookAt && <CameraLookAt target={cameraLookAt} />}
      <ambientLight intensity={0.9} />
      <directionalLight position={[2.4, 3.6, 5.5]} intensity={2.6} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0, 0.4, 4]} intensity={1.8} distance={10} decay={2} />
      <directionalLight position={[-2.4, 1.4, -3.6]} intensity={0.7} color="#b9c4ff" />
      <directionalLight position={[-2.8, -2.2, 1.8]} intensity={0.5} color="#e8b478" />
      <Environment preset="city" background={false} environmentIntensity={1.1} />

      <Suspense fallback={null}>{children}</Suspense>

      <ContactShadows
        position={contactShadowPosition}
        opacity={0.5}
        scale={contactShadowScale}
        blur={2.2}
        far={2}
        resolution={256}
        frames={1}
        color="#000000"
      />
    </Canvas>
  );
}
