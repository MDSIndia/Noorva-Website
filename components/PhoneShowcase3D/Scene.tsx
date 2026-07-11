"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import PhoneModel, { type PhoneModelHandle } from "./PhoneModel";
import Podium from "./Podium";
import type { Ref } from "react";

interface SceneProps {
  activeIndex: number;
  phoneRef: Ref<PhoneModelHandle>;
  frameloop?: "always" | "never" | "demand";
}

export default function Scene({ activeIndex, phoneRef, frameloop = "always" }: SceneProps) {
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

      <PhoneModel ref={phoneRef} activeIndex={activeIndex} />

      {/* This camera (fixed at z=4.6, fov=32, not a dynamic fitTarget like
          other Scene components in this repo) only shows about 1.32 world
          units below center before its own frustum edge — the phone's body
          half-height alone (~1.21) already eats most of that, leaving just
          ~0.1 units of real headroom. Position math: phone rest-bottom
          (-1.21) minus a 0.03 gap minus the podium's own ~0.04 stacked
          height lands the base at -1.28, with margin to spare before the
          frustum bottom (~-1.32) — a taller podium here would clip. */}
      <Podium position={[0, -1.28, 0]} />

      <ContactShadows position={[0, -1.3, 0]} opacity={0.55} scale={4} blur={2.4} far={2} resolution={256} frames={1} color="#000000" />
    </Canvas>
  );
}
