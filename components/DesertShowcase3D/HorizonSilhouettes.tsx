"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMountainRidgeTexture } from "./bakedTextures";

interface HorizonSilhouettesProps {
  count: number;
}

// Neutral charcoal — was a near-black navy, which read as sci-fi void
// rather than distant rock silhouette; fog dims this further with
// distance regardless, so the exact base tone mostly sets how the
// silhouette looks up close through gaps in the haze.
const RIDGE_COLOR = "#1a1c21";
// How closely the ring of ridge planes follows the camera's own travel —
// near 1 means they feel essentially at the true horizon (the same
// technique StarField.tsx uses for its own far-distance follow, just
// pushed even closer to 1 here since a mountain range should barely
// appear to move at all as the camera flies past it).
const FOLLOW = 0.985;
const RADIUS = 78;

// A loose ring of large ridge-silhouette planes parked around a
// camera-following anchor (X/Z only — Y stays pinned near actual ground
// level, not the camera's own altitude, so the range reads as sitting on
// the terrain rather than floating at eye height). Distance from the
// anchor is tuned so the scene's own exponential fog dims these to a
// hazy, atmospheric silhouette rather than a crisp cutout — "the horizon
// should feel infinite" without needing literally infinite geometry.
export default function HorizonSilhouettes({ count }: HorizonSilhouettesProps) {
  const anchorRef = useRef<THREE.Group>(null);
  const textureA = useMountainRidgeTexture(11);
  const textureB = useMountainRidgeTexture(47);

  const specs = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + (i % 2) * 0.35;
      const width = 220 + (i % 3) * 40;
      const height = 60 + (i % 2) * 18;
      return { angle, width, height, useA: i % 2 === 0 };
    });
  }, [count]);

  useFrame(({ camera }) => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    anchor.position.set(camera.position.x * FOLLOW, -6, camera.position.z * FOLLOW);
  });

  if (!textureA || !textureB) return null;

  return (
    <group ref={anchorRef}>
      {specs.map((spec, i) => (
        <mesh
          key={i}
          position={[Math.sin(spec.angle) * RADIUS, spec.height * 0.3, Math.cos(spec.angle) * RADIUS]}
          rotation={[0, spec.angle, 0]}
        >
          <planeGeometry args={[spec.width, spec.height]} />
          <meshBasicMaterial
            map={spec.useA ? textureA : textureB}
            color={RIDGE_COLOR}
            transparent
            opacity={0.8}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
