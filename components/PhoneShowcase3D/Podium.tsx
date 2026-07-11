"use client";

import { useMemo, useRef } from "react";
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
// touching it. PhoneModel.tsx now applies SHOWCASE_SCALE (0.85) to the whole
// phone specifically to free up real headroom here — this stack was
// previously squeezed to ~0.04 total height (barely a sliver, unreadable at
// the mobile canvas's short 40vh viewport) to dodge Scene.tsx's fixed-camera
// frustum edge; the phone shrink buys enough room for genuinely stepped,
// legible tiers instead.
const TIER_SPECS = [
  { radiusBottom: 0.62, radiusTop: 0.56, height: 0.05 },
  { radiusBottom: 0.46, radiusTop: 0.4, height: 0.042 },
  { radiusBottom: 0.32, radiusTop: 0.27, height: 0.034 },
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

// Base/mid tiers pushed to near-black — under Scene.tsx's strong key light
// and city environment map, anything short of genuinely near-zero luminance
// still catches enough specular reflection to read as mid-gray, which is
// what made two prior, less extreme dark values both still blend into the
// phone's own silver finish instead of contrasting against it. The crown
// tier is a real warm-gold metal (not just a thin ring on gray) so there's
// an unmistakable two-material story: a dark stage the phone rests above,
// topped with a distinct gold-and-amethyst crown — same dual-accent
// pairing as CinematicIntro's medallion, but as actual surfaces instead of
// two thin outline rings that read as barely-there at this render size.
const PODIUM_METAL = "#050408";
const PODIUM_CAP = "#8a6a3a";
const TRIM_GOLD = "#e8b478";
const GLOW_COLOR = "#7c5cfc";

// Radial-gradient canvas texture for the ground glow — the disc is viewed at
// a shallow, near-edge-on angle from Scene.tsx's camera, so a flat solid
// color with a hard circular edge foreshortens into a stark, hard-edged bar
// across the whole frame instead of a soft glow puddle. Feathering the alpha
// out to zero at the rim keeps it reading as a glow at any angle, matching
// the CanvasTexture + SSR-guard pattern already used in BookModel.tsx.
function useGlowTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(124,92,252,1)");
    gradient.addColorStop(0.45, "rgba(124,92,252,0.5)");
    gradient.addColorStop(1, "rgba(124,92,252,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

export default function Podium({ position = [0, -1.42, 0] }: PodiumProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const glowTexture = useGlowTexture();

  // Slow breathing glow on the top accent ring and the soft halo beneath it
  // — enough to read as "alive" without competing with the phone's own
  // scroll-driven rotation, which is the thing that should actually draw
  // the eye.
  useFrame((state) => {
    const pulse = 0.55 + Math.sin(state.clock.getElapsedTime() * 0.8) * 0.25;
    const ring = ringRef.current;
    if (ring) (ring.material as THREE.MeshBasicMaterial).opacity = pulse;
    const halo = haloRef.current;
    if (halo) (halo.material as THREE.MeshBasicMaterial).opacity = pulse * 0.4;
  });

  const topRadius = TIERS[TIERS.length - 1].radiusTop;
  const baseRadius = TIERS[0].radiusBottom;

  return (
    <group position={position}>
      {/* Soft additive glow disc, flush with the ground — sells "light
          source" presence even at a glance, independent of how much the
          physical tier steps themselves catch the eye. Feathered via
          glowTexture rather than a flat color so it doesn't read as a
          hard-edged bar at this camera's shallow viewing angle. */}
      <mesh ref={haloRef} position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[baseRadius * 1.35, 48]} />
        <meshBasicMaterial
          color={GLOW_COLOR}
          map={glowTexture}
          toneMapped={false}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {TIERS.map((tier, i) => {
        const isCap = i === TIERS.length - 1;
        return (
          <mesh key={i} position={[0, tier.centerY, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[tier.radiusTop, tier.radiusBottom, tier.height, 64]} />
            <meshPhysicalMaterial
              color={isCap ? PODIUM_CAP : PODIUM_METAL}
              metalness={isCap ? 0.75 : 0.35}
              roughness={isCap ? 0.22 : 0.42}
              clearcoat={isCap ? 0.6 : 0.4}
              clearcoatRoughness={0.14}
              emissive={isCap ? PODIUM_CAP : undefined}
              emissiveIntensity={isCap ? 0.12 : 0}
            />
          </mesh>
        );
      })}

      {/* A bright gold trim seam at the lower two step edges — emissive so
          it reads as a lit accent line regardless of viewing/lighting
          angle, rather than depending on catching a specular reflection
          the way a plain metallic ring does. The topmost shoulder skips
          this trim; the gold crown tier and purple glow ring above it
          already carry that accent role. */}
      {TIERS.slice(0, -1).map((tier, i) => (
        <mesh key={`edge-${i}`} position={[0, tier.centerY + tier.height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[tier.radiusTop * 0.97, tier.radiusTop * 1.07, 48]} />
          <meshPhysicalMaterial
            color={TRIM_GOLD}
            emissive={TRIM_GOLD}
            emissiveIntensity={0.4}
            metalness={0.9}
            roughness={0.18}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Glowing amethyst crown ring, set into the gold cap like a jewel —
          the one hero accent, echoing the site's own purple/warm motifs
          elsewhere (CinematicIntro's orbit ring, BookModel's medallion). */}
      <mesh ref={ringRef} position={[0, PODIUM_TOP_Y + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[topRadius * 0.6, topRadius * 0.78, 64]} />
        <meshBasicMaterial color={GLOW_COLOR} toneMapped={false} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
