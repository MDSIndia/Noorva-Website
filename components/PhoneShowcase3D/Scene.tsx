"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import PhoneModel from "./PhoneModel";
import Podium from "./Podium";

interface SceneProps {
  /** Which feature indices currently have a mounted phone — 1 entry when
   *  settled on a feature, 2 during a carousel transition (outgoing +
   *  incoming), driven by PhoneShowcase3D.tsx's scroll-scrubbed timeline. */
  renderIndices: number[];
  frameloop?: "always" | "never" | "demand";
}

export default function Scene({ renderIndices, frameloop = "always" }: SceneProps) {
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

      {renderIndices.map((idx) => (
        <PhoneModel key={idx} activeIndex={idx} />
      ))}

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
      {/* Podium.tsx now owns its own dedicated stage lighting internally
          (as children of its own group, positioned relative to it) so that
          lighting can be recolored per-frame to match whichever feature's
          accent is active/incoming — it needs a ref to each light to do
          that, which only works cleanly if Podium.tsx renders them itself
          rather than Scene.tsx holding them at arm's length. */}
      <Podium position={[0, -1.18, 0]} />

      <ContactShadows position={[0, -1.18, 0]} opacity={0.55} scale={4} blur={2.4} far={2} resolution={256} frames={1} color="#000000" />
    </Canvas>
  );
}
