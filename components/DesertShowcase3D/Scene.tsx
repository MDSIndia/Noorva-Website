"use client";

import { Canvas } from "@react-three/fiber";
import Terrain, { SUN_DIRECTION, SUN_COLOR } from "./Terrain";
import Sky from "./Sky";
import CameraRig from "./CameraRig";
import PostFX from "../PostFX";
import HorizonSilhouettes from "./HorizonSilhouettes";
import LunarProps from "./LunarProps";
import FloatingDust from "./FloatingDust";
import GuideConstruct from "./scenes/GuideConstruct";
import MentorConstruct from "./scenes/MentorConstruct";
import PlannerConstruct from "./scenes/PlannerConstruct";
import CompanionConstruct from "./scenes/CompanionConstruct";
import type { TierConfig } from "./qualityTier";

interface SceneProps {
  tier: TierConfig;
  reducedMotion: boolean;
  frameloop?: "always" | "never" | "demand";
}

export default function Scene({ tier, reducedMotion, frameloop = "always" }: SceneProps) {
  return (
    <Canvas
      frameloop={frameloop}
      // Wider fov and far plane than the old phone-showcase camera (fov 32,
      // far 100) — this camera is flying through a large open environment,
      // not framing a single product shot. CameraRig overrides
      // position/lookAt every frame starting on the very first frame; these
      // are just pre-mount fallback values.
      camera={{ position: [0, 1.6, 4], fov: 55, near: 0.1, far: 300 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, 1.8]}
    >
      {/* Space black, a hair cooler than pure black — hides the terrain
          plane's real far edge (SIZE=220 in Terrain.tsx) and every sky
          layer's own extent behind depth fog, rather than needing
          literally infinite geometry. Atmospheric-perspective fade to
          dark, not a colored haze. */}
      <fogExp2 attach="fog" args={["#050608", 0.014]} />

      {/* One strong "sun" (matches Terrain.tsx's own SUN_DIRECTION/COLOR
          constants, since the terrain is a raw ShaderMaterial and won't
          pick these up automatically), a low neutral ambient fill, and a
          faint cool-blue fill standing in for reflected space-light — no
          more saturated/purple lights washing the whole scene. */}
      <ambientLight intensity={0.45} color="#3a3f4d" />
      <directionalLight
        position={[SUN_DIRECTION.x * 20, SUN_DIRECTION.y * 20, SUN_DIRECTION.z * 20]}
        intensity={1.9}
        color={SUN_COLOR}
      />
      <directionalLight position={[-6, 3, -4]} intensity={0.22} color="#7d9bd6" />

      <CameraRig cameraRoll={tier.cameraRoll} reducedMotion={reducedMotion} />
      <Terrain segments={tier.terrainSegments} glintIntensity={tier.glintIntensity} />
      <Sky tier={tier} />
      <HorizonSilhouettes count={tier.mountainSilhouettes} />
      {tier.lunarPropCount > 0 && <LunarProps count={tier.lunarPropCount} />}
      {tier.dustCount > 0 && <FloatingDust count={tier.dustCount} />}

      {/* Each destination's own presence() check (sceneVisibility.ts)
          gates its visibility/opacity every frame — always mounted, not
          conditionally rendered by activeIndex, so a prop already
          mid-fade keeps animating smoothly through the transition
          instead of unmounting abruptly right as it starts fading. */}
      <GuideConstruct accentParticleCount={tier.guideAccentParticles} animated={!tier.simplifiedConstructs} />
      <MentorConstruct />
      <PlannerConstruct animated={!tier.simplifiedConstructs} />
      <CompanionConstruct dustParticleCount={tier.companionDustParticles} />

      {tier.bloom && <PostFX />}
    </Canvas>
  );
}
