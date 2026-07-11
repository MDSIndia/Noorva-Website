"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PodiumProps {
  position?: [number, number, number];
}

// A tiered dark-metal disc stand the phone floats above — stacked cylinders
// shrinking toward the top (each one's own top radius pulled in slightly
// tighter than its base) read as concentric rings from above/the side, the
// same layered-podium silhouette a product-display stage uses to give a
// floating object something to visually "rest" near without actually
// touching it. Kept deliberately slim: Scene.tsx's camera here is a fixed
// (non-dynamic) framing tuned around the phone alone, leaving only about
// 0.1 world units of headroom below the phone's own lowest point before the
// view frustum's bottom edge — a taller stack would clip.
const TIER_SPECS = [
  { radiusBottom: 0.66, radiusTop: 0.6, height: 0.022 },
  { radiusBottom: 0.5, radiusTop: 0.44, height: 0.018 },
];

// Cumulative Y baked in once at module scope (TIER_SPECS is static) rather
// than accumulated with a mutable counter during render, which trips this
// repo's react-hooks/immutability rule the same way a stray .forEach
// mutation would.
let stackedY = 0;
const TIERS = TIER_SPECS.map((tier) => {
  const centerY = stackedY + tier.height / 2;
  stackedY += tier.height;
  return { ...tier, centerY };
});
const PODIUM_TOP_Y = stackedY;

const PODIUM_METAL = "#111114";

export default function Podium({ position = [0, -1.42, 0] }: PodiumProps) {
  const ringRef = useRef<THREE.Mesh>(null);

  // Slow breathing glow on the top accent ring — enough to read as "alive"
  // without competing with the phone's own scroll-driven rotation, which is
  // the thing that should actually draw the eye.
  useFrame((state) => {
    const ring = ringRef.current;
    if (!ring) return;
    const mat = ring.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.55 + Math.sin(state.clock.getElapsedTime() * 0.8) * 0.25;
  });

  const tierMeshes = TIERS.map((tier, i) => (
    <mesh key={i} position={[0, tier.centerY, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[tier.radiusTop, tier.radiusBottom, tier.height, 64]} />
      <meshPhysicalMaterial color={PODIUM_METAL} metalness={0.8} roughness={0.32} clearcoat={0.5} clearcoatRoughness={0.28} />
    </mesh>
  ));

  const topRadius = TIERS[TIERS.length - 1].radiusTop;

  return (
    <group position={position}>
      {tierMeshes}
      {/* Glowing accent seam at the top edge, echoing the site's own
          purple/warm accent motifs elsewhere (CinematicIntro's orbit ring,
          BookModel's medallion). */}
      <mesh ref={ringRef} position={[0, PODIUM_TOP_Y + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[topRadius * 0.72, topRadius * 0.8, 64]} />
        <meshBasicMaterial color="#7c5cfc" toneMapped={false} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
