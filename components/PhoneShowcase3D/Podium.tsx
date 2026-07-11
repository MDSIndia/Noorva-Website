"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { phoneCarouselX } from "../store";
import { FEATURES, ACCENT_HEX } from "../FeatureShowcase/featuresData";

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

// Deep navy-blue rather than neutral near-black — matches the page's own
// dark starfield backdrop (CosmicBackground/CosmicCanvas) so the podium
// reads as part of the same dark environment instead of a separate gray/gold
// object sitting on top of it. This stays fixed regardless of feature — it's
// the "dark stage" the glow (which does change per feature, see below) sits
// on top of, not the accent color itself.
const PODIUM_METAL = "#060a18";
const PODIUM_CAP = "#0f1c3a";
const DEFAULT_ACCENT = "#4fa8d5";

// A visible cone of light rising from the podium's crown up through/around
// the phone — narrow at the source, widening as it rises, like a stage
// spotlight shining upward. This is the actual "light coming from the
// podium" the point lights below only imply via reflected highlights; this
// mesh is the beam itself, rendered directly.
const BEAM_HEIGHT = 1.7;
const BEAM_RADIUS_BOTTOM = 0.1;
const BEAM_RADIUS_TOP = 0.52;

// Entrance slide: the podium starts off to the left and glides in to its
// resting x (from the `position` prop) as the section first mounts, timed
// to match PhoneModel.tsx's own mirrored slide-in from the right — same
// duration/easing constants (delta*1.1, easeOutCubic) so the two visibly
// converge toward center together rather than drifting in independently.
const ENTRANCE_X_OFFSET = -2.2;

// Podium's own stage lighting, positioned relative to its group (not the
// scene root) so it slides in together with the podium during the entrance
// and stays correctly placed regardless of the `position` prop. World-space
// equivalents these replaced: [0,-0.7,1.3], [0.9,-0.95,1.1], [-0.9,-0.95,1.1]
// at a podium position of [0,-1.18,0] — converted to local offsets here.
const PODIUM_LIGHTS = [
  { position: [0, 0.48, 1.3] as [number, number, number], intensity: 2.2, distance: 3.4 },
  { position: [0.9, 0.23, 1.1] as [number, number, number], intensity: 1.1, distance: 3 },
  { position: [-0.9, 0.23, 1.1] as [number, number, number], intensity: 1.1, distance: 3 },
];

// Radial-gradient canvas texture for the ground glow — the disc is viewed at
// a shallow, near-edge-on angle from Scene.tsx's camera, so a flat solid
// color with a hard circular edge foreshortens into a stark, hard-edged bar
// across the whole frame instead of a soft glow puddle. Feathering the alpha
// out to zero at the rim keeps it reading as a glow at any angle, matching
// the CanvasTexture + SSR-guard pattern already used in BookModel.tsx. Baked
// in neutral white (not a fixed hue) — this now gets tinted per-frame via
// the material's own `color`, which shifts to match whichever feature is
// active/incoming, so the texture itself has to stay color-neutral.
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
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.5)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

// Vertical-fade texture for the light beam — CylinderGeometry's default
// lateral-surface UVs run V from 0 at the bottom to 1 at the top (unlike
// ExtrudeGeometry's side walls, which needed the axis mapping worked out
// empirically for BookModel.tsx's paper-edge texture — this one's the
// documented, reliable default), so a canvas gradient bright at the bottom
// and fading to transparent at the top reads as a beam of light rising from
// the podium rather than a solid illuminated cone. Also baked in neutral
// white for the same per-frame tinting reason as the glow texture above.
function useBeamTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createLinearGradient(0, size, 0, 0);
    gradient.addColorStop(0, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.35)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 8, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

export default function Podium({ position = [0, -1.42, 0] }: PodiumProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const capMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const trimRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);
  const entranceRef = useRef(0); // 0..1, eases up once on mount — never resets
  // Reused every frame rather than allocated fresh — avoids a per-frame
  // THREE.Color garbage-collection churn for what's otherwise a cheap lerp.
  const accentColor = useRef(new THREE.Color(DEFAULT_ACCENT));
  const scratchA = useRef(new THREE.Color());
  const scratchB = useRef(new THREE.Color());
  const glowTexture = useGlowTexture();
  const beamTexture = useBeamTexture();

  useFrame((state, delta) => {
    // Slide-in entrance, same easeOutCubic curve/duration as PhoneModel.tsx's
    // own so the two arrive at center together. Delta clamped for the same
    // reason as PhoneModel.tsx's own entrance: Scene.tsx's Canvas switches
    // frameloop from "never" to "always" right as the section scrolls into
    // view, and that first frame's delta (real wall-clock time since the
    // last render while paused) is otherwise large enough to jump straight
    // to entrance=1 in one step instead of animating.
    const entranceDelta = Math.min(delta, 1 / 30);
    entranceRef.current = Math.min(1, entranceRef.current + entranceDelta * 1.1);
    const entrance = 1 - Math.pow(1 - entranceRef.current, 3);
    const group = groupRef.current;
    if (group) {
      group.position.set(position[0] + (1 - entrance) * ENTRANCE_X_OFFSET, position[1], position[2]);
    }

    // Blend toward whichever feature's accent color is active/incoming,
    // reading the exact same continuous scroll-driven value PhoneModel.tsx
    // uses for its own carousel slide — the podium's glow shifts color in
    // sync with the phone transition instead of snapping at a different
    // moment or drifting out of sync with it.
    const p = THREE.MathUtils.clamp(phoneCarouselX.value, 0, FEATURES.length - 1);
    const idxA = Math.min(FEATURES.length - 1, Math.floor(p));
    const idxB = Math.min(FEATURES.length - 1, idxA + 1);
    const blend = p - idxA;
    scratchA.current.set(ACCENT_HEX[FEATURES[idxA].accent] ?? DEFAULT_ACCENT);
    scratchB.current.set(ACCENT_HEX[FEATURES[idxB].accent] ?? DEFAULT_ACCENT);
    accentColor.current.copy(scratchA.current).lerp(scratchB.current, blend);

    // Slow breathing glow on the top accent ring and the soft halo beneath
    // it — enough to read as "alive" without competing with the phone's own
    // carousel slide, which is the thing that should actually draw the eye.
    const pulse = 0.55 + Math.sin(state.clock.getElapsedTime() * 0.8) * 0.25;
    const ring = ringRef.current;
    if (ring) {
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = pulse;
      mat.color.copy(accentColor.current);
    }
    const halo = haloRef.current;
    if (halo) {
      const mat = halo.material as THREE.MeshBasicMaterial;
      mat.opacity = pulse * 0.4;
      mat.color.copy(accentColor.current);
    }
    const beam = beamRef.current;
    if (beam) {
      const mat = beam.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + pulse * 0.35;
      mat.color.copy(accentColor.current);
    }
    trimRefs.current.forEach((mesh) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      mat.color.copy(accentColor.current);
      mat.emissive.copy(accentColor.current);
    });
    if (capMaterialRef.current) {
      capMaterialRef.current.emissive.copy(accentColor.current);
    }
    lightRefs.current.forEach((light) => {
      if (light) light.color.copy(accentColor.current);
    });
  });

  const topRadius = TIERS[TIERS.length - 1].radiusTop;
  const baseRadius = TIERS[0].radiusBottom;

  return (
    // No declarative position prop — useFrame above drives it every frame
    // (starting from the entrance-offset x), matching PhoneModel.tsx's own
    // group so neither one flashes at its resting position for a frame
    // before the entrance animation takes over.
    <group ref={groupRef}>
      {PODIUM_LIGHTS.map((light, i) => (
        <pointLight
          key={i}
          ref={(el) => {
            lightRefs.current[i] = el;
          }}
          position={light.position}
          intensity={light.intensity}
          distance={light.distance}
          decay={2}
          color={DEFAULT_ACCENT}
        />
      ))}

      {/* Soft additive glow disc, flush with the ground — sells "light
          source" presence even at a glance, independent of how much the
          physical tier steps themselves catch the eye. Feathered via
          glowTexture rather than a flat color so it doesn't read as a
          hard-edged bar at this camera's shallow viewing angle. */}
      <mesh ref={haloRef} position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[baseRadius * 1.35, 48]} />
        <meshBasicMaterial
          color={DEFAULT_ACCENT}
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
              ref={isCap ? capMaterialRef : undefined}
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

      {/* A bright trim seam at the lower two step edges, tinted to the
          active feature's accent — emissive so it reads as a lit accent
          line regardless of viewing/lighting angle, rather than depending
          on catching a specular reflection the way a plain metallic ring
          does. The topmost shoulder skips this trim; the crown tier and
          glow ring above it already carry that accent role. */}
      {TIERS.slice(0, -1).map((tier, i) => (
        <mesh
          key={`edge-${i}`}
          ref={(el) => {
            trimRefs.current[i] = el;
          }}
          position={[0, tier.centerY + tier.height / 2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[tier.radiusTop * 0.97, tier.radiusTop * 1.07, 48]} />
          <meshPhysicalMaterial
            color={DEFAULT_ACCENT}
            emissive={DEFAULT_ACCENT}
            emissiveIntensity={0.4}
            metalness={0.9}
            roughness={0.18}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Glowing crown ring, set into the cap like a jewel, tinted to the
          active feature's accent — the one hero accent, matching the
          dark-blue podium that blends into the page's own starfield
          backdrop instead of standing apart from it. */}
      <mesh ref={ringRef} position={[0, PODIUM_TOP_Y + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[topRadius * 0.6, topRadius * 0.78, 64]} />
        <meshBasicMaterial color={DEFAULT_ACCENT} toneMapped={false} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* The light beam itself — rises from the crown up past the phone,
          bright and narrow at the source, fading and widening as it goes.
          Additive + no depth-write so it blends into whatever's behind it
          (the phone's own body, the starfield) rather than occluding it. */}
      <mesh ref={beamRef} position={[0, PODIUM_TOP_Y + BEAM_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[BEAM_RADIUS_TOP, BEAM_RADIUS_BOTTOM, BEAM_HEIGHT, 32, 1, true]} />
        <meshBasicMaterial
          color={DEFAULT_ACCENT}
          map={beamTexture}
          toneMapped={false}
          transparent
          opacity={0.6}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
