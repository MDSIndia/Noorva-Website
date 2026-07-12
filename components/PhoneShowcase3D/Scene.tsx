"use client";

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import PhoneModel from "./PhoneModel";

interface SceneProps {
  /** Which feature is currently showing on the phone's screen — see
   *  PhoneModel.tsx's own prop doc for how/when this changes in place. */
  activeIndex: number;
  /** Whether the caption sits beside the phone (lg+, so it can sit fully
   *  centered) or stacked below it (mobile, so it needs to be raised to
   *  leave room) — see PhoneModel.tsx's own vertical-offset logic. */
  isDesktop: boolean;
  frameloop?: "always" | "never" | "demand";
}

export default function Scene({ activeIndex, isDesktop, frameloop = "always" }: SceneProps) {
  return (
    <Canvas
      frameloop={frameloop}
      camera={{ position: [0, 0, 4.6], fov: 32, near: 0.1, far: 100 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, 1.8]}
      shadows
    >
      <ambientLight intensity={0.55} />
      {/* Key light — the main highlight sweeping across the titanium rail as
          the phone turns. */}
      <directionalLight position={[2.6, 3.8, 6]} intensity={2.6} castShadow shadow-mapSize={[1024, 1024]} />
      {/* Frontal fill, close to the camera — keeps the face-on frame and
          bezel from going flat/dark when the phone is showing its screen. */}
      <pointLight position={[0, 0.5, 4.5]} intensity={1.1} distance={10} decay={2} />
      {/* Rim light from behind, picks out the edge of the frame against the
          dark backdrop so the silhouette reads even in back-facing frames. */}
      <directionalLight position={[-2.5, 1.5, -4]} intensity={1.3} color="#b9c4ff" />
      {/* Low warm fill, keeps the shadow side from going fully black. */}
      <directionalLight position={[-3, -2.5, 2]} intensity={0.4} color="#7c5cfc" />
      {/* Adds realistic metal/glass reflections without dictating the visible
          backdrop — the page's own cosmic background stays what's seen. */}
      <Environment preset="city" background={false} environmentIntensity={1.6} />

      {/* A single, persistently-mounted phone now (no podium, no
          outgoing/incoming pair arcing past each other) — it just turns in
          place, and its screen content swaps via the activeIndex prop
          rather than a whole new instance mounting per feature. No ground
          contact shadow either — without a podium there's no surface for
          the phone to look grounded on; it reads as floating in the page's
          own starfield instead. */}
      <PhoneModel activeIndex={activeIndex} isDesktop={isDesktop} />
    </Canvas>
  );
}
