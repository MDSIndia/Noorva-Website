"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import PhoneModel from "./PhoneModel";

interface SceneProps {
  /** Pause rendering while the phone is off-screen. */
  active: boolean;
  /** Which app is on the phone's screen. */
  screen?: "chat" | "video";
}

export default function Scene({ active, screen = "chat" }: SceneProps) {
  // Client-only component (loaded with ssr:false), so window is safe here.
  const [reducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, 4.6], fov: 32, near: 0.1, far: 100 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, 1.8]}
      shadows
    >
      <ambientLight intensity={0.55} />
      {/* Key light — sweeps a highlight across the titanium rail as it turns. */}
      <directionalLight position={[2.6, 3.8, 6]} intensity={2.6} castShadow shadow-mapSize={[1024, 1024]} />
      {/* Frontal fill so the face-on bezel doesn't go flat/dark. */}
      <pointLight position={[0, 0.5, 4.5]} intensity={1.1} distance={10} decay={2} />
      {/* Rim light picks the silhouette out against the dark backdrop. */}
      <directionalLight position={[-2.5, 1.5, -4]} intensity={1.3} color="#b9c4ff" />
      <directionalLight position={[-3, -2.5, 2]} intensity={0.4} color="#7c5cfc" />
      <Environment preset="city" background={false} environmentIntensity={1.6} />

      <PhoneModel reducedMotion={reducedMotion} screen={screen} />
    </Canvas>
  );
}
