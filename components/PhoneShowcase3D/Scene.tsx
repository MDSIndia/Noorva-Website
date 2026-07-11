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
          units below center before its own frustum edge. PhoneModel.tsx
          applies a 0.8 SHOWCASE_SCALE to the whole phone to buy back
          headroom here: rest-bottom shrinks from -1.255 to about -1.01,
          leaving ~0.3 units free. Podium.tsx's stack is ~0.126 tall — base =
          phone rest-bottom (-1.01) minus a 0.04 gap minus that height lands
          at -1.18, about 0.14 units clear of the frustum bottom (~-1.32) —
          deliberately more margin than the bare minimum, since real browser
          windows (chrome/taskbar/zoom) render a shorter effective viewport
          than a clean test window, which was eating into a tighter margin
          and clipping most of the podium down to a thin visible sliver. */}
      <Podium position={[0, -1.18, 0]} />

      {/* Dedicated stage lighting for the podium — its own light sources
          close to it, rather than just catching spillover from the phone's
          key/rim lights above. Plain pointLights (not spotLight) since a
          spotLight's default target Object3D isn't attached to the scene
          graph in R3F unless done explicitly, which silently leaves it
          aimed at the origin regardless of any position prop — these avoid
          that pitfall entirely. All blue-toned and pushed brighter/further
          than before so the podium visibly uplights the phone's lower body
          — the podium is now a dark navy that blends into the background,
          so this glow is what actually sells it as a light source next to
          the phone rather than just a dark shape it happens to float near. */}
      <pointLight position={[0, -0.7, 1.3]} intensity={2.2} distance={3.4} decay={2} color="#7ec4ea" />
      <pointLight position={[0.9, -0.95, 1.1]} intensity={1.1} distance={3} decay={2} color="#4fa8d5" />
      <pointLight position={[-0.9, -0.95, 1.1]} intensity={1.1} distance={3} decay={2} color="#4fa8d5" />

      <ContactShadows position={[0, -1.18, 0]} opacity={0.55} scale={4} blur={2.4} far={2} resolution={256} frames={1} color="#000000" />
    </Canvas>
  );
}
