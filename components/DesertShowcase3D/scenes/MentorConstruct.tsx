"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { desertFlightProgress } from "../../store";
import { FEATURES, ACCENT_HEX } from "../../FeatureShowcase/featuresData";
import { presence } from "../sceneVisibility";
import { featureAnchor } from "../flightPath";
import { useGlowTexture } from "../bakedTextures";

const FEATURE_INDEX = 1; // Mentor
// The one small per-feature accent touch in the 3D scene (see
// GuideConstruct.tsx's own note) — used only for the faint ground glow
// pool beneath the monolith, never the monolith's own material.
const ACCENT = ACCENT_HEX[FEATURES[FEATURE_INDEX].accent] ?? "#7c5cfc";
const ANCHOR = featureAnchor(FEATURE_INDEX, -2.4, 0);
// Roughly the famous 1 : 4 : 9 monolith proportions.
const SLAB_WIDTH = 0.62;
const SLAB_HEIGHT = 2.75;
const SLAB_DEPTH = 0.16;

// A dark, perfectly rectangular monolith — a restrained, high-concept
// stand-in for "a guiding presence," replacing the old sci-fi neon
// pillar. Reads through silhouette and real directional-light shading
// (a low-roughness, slightly reflective material) rather than any glow
// effects of its own; the only light near it is a faint ground pool at
// its base.
export default function MentorConstruct() {
  const groupRef = useRef<THREE.Group>(null);
  const slabMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const glowTexture = useGlowTexture();

  useFrame(({ clock }) => {
    const p = presence(FEATURE_INDEX, desertFlightProgress.value);
    const group = groupRef.current;
    if (group) {
      group.visible = p > 0.01;
      group.position.copy(ANCHOR);
      group.scale.setScalar(THREE.MathUtils.lerp(0.85, 1, p));
    }
    if (slabMatRef.current) slabMatRef.current.opacity = p;
    if (glowMatRef.current) {
      const breathe = 0.5 + Math.sin(clock.getElapsedTime() * 0.4) * 0.15;
      glowMatRef.current.opacity = p * breathe * 0.35;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, SLAB_HEIGHT / 2, 0]}>
        <boxGeometry args={[SLAB_WIDTH, SLAB_HEIGHT, SLAB_DEPTH]} />
        <meshStandardMaterial ref={slabMatRef} color="#0c0c0e" roughness={0.28} metalness={0.55} transparent opacity={0} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 2.4]} />
        <meshBasicMaterial
          ref={glowMatRef}
          map={glowTexture}
          color={ACCENT}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
