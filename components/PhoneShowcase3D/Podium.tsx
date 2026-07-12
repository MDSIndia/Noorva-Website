"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { phoneCarouselX } from "../store";
import { FEATURES, ACCENT_HEX } from "../FeatureShowcase/featuresData";

interface PodiumProps {
  position?: [number, number, number];
}

// A tiered/stepped stack — like a small staircase or wedding-cake plinth —
// rather than one solid flat puck. Each tier is a cylinder narrower than the
// one below it, so its top rim is exposed as a visible "step"; that exposed
// rim is where the glowing ring sits, so the light itself traces the actual
// step edges instead of floating disconnected on top of a flat surface.
const TIER_SPECS: { radius: number; height: number }[] = [
  { radius: 0.64, height: 0.075 },
  { radius: 0.48, height: 0.065 },
  { radius: 0.34, height: 0.06 },
];

// Cumulative Y baked once at module scope (immutable map + slice/reduce, not
// a mutable running counter inside a render-time .map — same reasoning as
// the lint-driven pattern this file used for its old TIERS constant before
// the puck rewrite: precompute stacked offsets outside the component).
const TIERS = TIER_SPECS.map((spec, i) => {
  const bottomY = TIER_SPECS.slice(0, i).reduce((sum, s) => sum + s.height, 0);
  return { ...spec, bottomY, topY: bottomY + spec.height };
});
const STACK_TOP_Y = TIERS[TIERS.length - 1].topY;
const BASE_RADIUS = TIERS[0].radius;

// Every glowing ring on the stack — the three exposed step edges (the rim of
// each tier, just inside its physical radius so the glow doesn't poke past
// the silhouette) plus one small inner ring on the topmost tier's own face,
// tight around the light column's base. All treated identically at
// render/animation time — one list rather than separate "rim" vs "landing
// ring" cases.
const RING_SPECS: { radius: number; y: number }[] = [
  ...TIERS.map((t) => ({ radius: t.radius * 0.98, y: t.topY })),
  { radius: TIERS[TIERS.length - 1].radius * 0.5, y: STACK_TOP_Y },
];

// Deep navy-blue rather than neutral near-black — matches the page's own
// dark starfield backdrop (CosmicBackground/CosmicCanvas) so the podium
// reads as part of the same dark environment instead of a separate gray
// object sitting on top of it. Fixed regardless of feature — it's the dark
// solid base the glow (which does change per feature, see below) sits on.
// Lightened from the original near-black (#0a0a12): against a black page
// background, that color had almost no contrast of its own — the steps'
// solid form only read at all via the glow bouncing off them, not as a
// distinct object. A touch more brightness plus stronger metal/clearcoat
// properties (see the tier material below) gives the risers their own
// specular highlights, so the stepped shape is visible even where the glow
// isn't hitting it directly.
const PODIUM_METAL = "#1a2036";
const DEFAULT_ACCENT = "#4fa8d5";

// A visible column of light rising from the top step up to the phone's own
// base — narrow at the source, flaring into a V as it climbs to meet and
// uplight the phone, rather than continuing on past it. Short enough to stay
// contained under the phone (it previously ran tall enough to poke out above
// the phone as a stray bright line against the dark backdrop); this is the
// actual "light coming from the podium" the point lights below only imply
// via reflected highlights, this mesh is the beam itself, rendered directly.
//
// Built from crossed flat planes rather than a cone: a cone's silhouette is a
// hard geometric edge no matter how the surface is textured (the "wedge"
// look this replaces), because at the silhouette the surface is edge-on to
// the camera regardless of alpha. A flat plane has no such edge — its alpha
// can be feathered to zero on every side, so the taper and softness are both
// baked directly into the texture below instead of fighting the geometry.
const BEAM_HEIGHT = 0.65;
const BEAM_PLANE_WIDTH = 1.7;
const BEAM_CORE_WIDTH = 1.05;

// Entrance slide: the podium starts off to the left and glides in to its
// resting x (from the `position` prop) as the section first mounts, timed
// to match PhoneModel.tsx's own mirrored slide-in from the right — same
// duration/easing constants (delta*1.1, easeOutCubic) so the two visibly
// converge toward center together rather than drifting in independently.
const ENTRANCE_X_OFFSET = -2.2;

// Podium's own stage lighting, positioned relative to its group (not the
// scene root) so it slides in together with the podium during the entrance
// and stays correctly placed regardless of the `position` prop.
const PODIUM_LIGHTS = [
  { position: [0, 0.48, 1.3] as [number, number, number], intensity: 2.6, distance: 3.4 },
  { position: [0.9, 0.23, 1.1] as [number, number, number], intensity: 1.4, distance: 3 },
  { position: [-0.9, 0.23, 1.1] as [number, number, number], intensity: 1.4, distance: 3 },
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

// Beam texture: a soft tapered light-column shape baked directly as an alpha
// map, feathered on every side (unlike a flat linear gradient, which only
// fades vertically and leaves hard left/right edges). PlaneGeometry's default
// UVs are the reliable, documented case — v=0 at the plane's bottom edge, 1
// at the top — so this bakes: bright + narrow near v=0 (the podium end) and
// dimmer + wide near v=1 (the phone end), with the width's edges feathered
// via a smooth (not hard-cutoff) falloff at every row. Computed pixel-by-
// pixel (ImageData) rather than via the Canvas gradient API since the taper
// width itself changes per row — not expressible as a single 1D gradient.
// Baked in neutral white for the same per-frame tinting reason as the other
// textures here.
function useBeamTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const width = 64;
    const height = 192;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const image = ctx.createImageData(width, height);
    const data = image.data;
    for (let j = 0; j < height; j++) {
      // Canvas rows run top(0)->bottom(height-1); CanvasTexture's default
      // flipY means row 0 (canvas top) lands at v=1 (plane top) and row
      // height-1 (canvas bottom) lands at v=0 (plane bottom) — so "v" here,
      // the fraction from the podium end, is the row measured from the
      // bottom of the canvas upward.
      const v = 1 - j / (height - 1);
      // A long bright plateau near the base — the glow stays strong most of
      // the way up rather than tapering out quickly. The core starts tight
      // and narrow at the podium (v=0) and flares out sharply toward the
      // phone (v=1), so the silhouette reads as a clean, deliberate "V"
      // rather than a soft blob that's already wide at its own source.
      const verticalAlpha = v < 0.6 ? THREE.MathUtils.lerp(1, 0.7, v / 0.6) : THREE.MathUtils.lerp(0.7, 0, (v - 0.6) / 0.4);
      // Fraction of the plane's own half-width the bright core reaches —
      // kept well under 1 at every v (never approaches the plane's actual
      // edge) so there's always room left for the edge envelope below to
      // finish fading it out before the flat plane's physical boundary. The
      // previous version let the gaussian tail get clipped by the plane's
      // hard edge before it reached zero — that clipped tail is exactly what
      // read as an artificial, flat "cut-out card" edge instead of a soft
      // natural glow.
      //
      // Ramped up over the first third of the height (not linearly across
      // the full v range) — the beam's actual visible portion is only the
      // short stretch between the podium and the phone's own base, with the
      // rest of its length hidden behind the phone's opaque body. Reaching
      // full width only near v=1 meant the visible sliver never got past the
      // still-narrow early part of the curve, reading as a thin ray instead
      // of something that spreads to the phone's full width where it
      // actually meets it.
      const widthT = Math.min(1, v / 0.32);
      const coreFraction = THREE.MathUtils.lerp(0.22, 0.82, widthT);
      for (let i = 0; i < width; i++) {
        // Normalized to the plane's own half-width (-1 at the left edge, 0
        // center, 1 at the right edge) rather than the raw -0.5..0.5 pixel
        // fraction, so the edge envelope below can reference "the actual
        // physical edge of the mesh" directly.
        const nx = (i / (width - 1) - 0.5) * 2;
        const d = Math.abs(nx) / coreFraction;
        // Gaussian-style falloff for the bright core — soft, diffuse center.
        const core = d >= 1 ? 0 : Math.exp(-d * d * 1.6);
        // Independent smoothstep that forces alpha all the way to exactly 0
        // by the time it reaches the plane's real edge (|nx| = 1), no matter
        // how wide the core gaussian's tail still is at that point — this is
        // what guarantees no visible hard boundary, at any v.
        const edgeT = THREE.MathUtils.clamp((Math.abs(nx) - 0.78) / (1 - 0.78), 0, 1);
        const edgeFade = 1 - edgeT * edgeT * (3 - 2 * edgeT);
        const horizontalAlpha = core * edgeFade;
        const alpha = Math.max(0, Math.min(1, verticalAlpha * horizontalAlpha));
        const idx = (j * width + i) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = Math.round(alpha * 255);
      }
    }
    ctx.putImageData(image, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

// Soft halo band behind each ring — same trusted radial-gradient +
// circleGeometry technique as the ground halo above (CircleGeometry's UV is
// a standard planar projection, unlike RingGeometry's own UV mapping which
// isn't a clean 0..1 radial fraction and would be a riskier bet here). A
// multi-stop gradient bright in a mid-radius band, transparent at both the
// center and the rim, gives each thin neon ring a soft bloom halo around it.
function useRingGlowTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.55, "rgba(255,255,255,0)");
    gradient.addColorStop(0.68, "rgba(255,255,255,0.55)");
    gradient.addColorStop(0.78, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.9, "rgba(255,255,255,0.3)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

export default function Podium({ position = [0, -1.42, 0] }: PodiumProps) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const beamRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ringGlowRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);
  const entranceRef = useRef(0); // 0..1, eases up once on mount — never resets
  // Reused every frame rather than allocated fresh — avoids a per-frame
  // THREE.Color garbage-collection churn for what's otherwise a cheap lerp.
  const accentColor = useRef(new THREE.Color(DEFAULT_ACCENT));
  const scratchA = useRef(new THREE.Color());
  const scratchB = useRef(new THREE.Color());
  const glowTexture = useGlowTexture();
  const beamTexture = useBeamTexture();
  const ringGlowTexture = useRingGlowTexture();

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

    // Slow breathing glow on the step-edge rings and the soft halo beneath
    // them — enough to read as "alive" without competing with the phone's
    // own carousel slide, which is the thing that should actually draw the
    // eye.
    const pulse = 0.55 + Math.sin(state.clock.getElapsedTime() * 0.8) * 0.25;
    // The crisp neon line itself stays bright and saturated (small breathing
    // range) — the halo behind it (below) is what carries most of the pulse,
    // matching how a real glowing ring's core stays lit while its bloom
    // visibly breathes.
    const ringLineOpacity = 0.75 + Math.sin(state.clock.getElapsedTime() * 0.8) * 0.15;
    ringRefs.current.forEach((mesh) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = ringLineOpacity;
      mat.color.copy(accentColor.current);
    });
    ringGlowRefs.current.forEach((mesh) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = pulse * 0.85;
      mat.color.copy(accentColor.current);
    });
    const halo = haloRef.current;
    if (halo) {
      const mat = halo.material as THREE.MeshBasicMaterial;
      mat.opacity = pulse * 0.4;
      mat.color.copy(accentColor.current);
    }
    beamRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      // The narrower inner-core set (i>=4, see JSX) reads brighter/hotter
      // than the wider outer soft set, layered together for a bright center
      // fading into a softer glow — rather than one flat-opacity beam. Each
      // set is now 4 planes rather than 2 (see JSX), and they all overlap
      // near the central axis, so per-plane opacity is lower than before to
      // keep the additive stack from blowing out to solid white there.
      mat.opacity = i < 4 ? 0.32 + pulse * 0.15 : 0.5 + pulse * 0.2;
      mat.color.copy(accentColor.current);
    });
    lightRefs.current.forEach((light) => {
      if (light) light.color.copy(accentColor.current);
    });
  });

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
          physical stack itself catches the eye. Feathered via glowTexture
          rather than a flat color so it doesn't read as a hard-edged bar at
          this camera's shallow viewing angle. */}
      <mesh ref={haloRef} position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[BASE_RADIUS * 1.35, 48]} />
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

      {/* The stepped stack itself — each tier a dark cylinder narrower than
          the one beneath it, so its top rim stays exposed as a visible
          step. */}
      {TIERS.map((tier, i) => (
        <mesh key={i} position={[0, tier.bottomY + tier.height / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[tier.radius, tier.radius, tier.height, 64]} />
          <meshPhysicalMaterial color={PODIUM_METAL} metalness={0.6} roughness={0.32} clearcoat={0.6} clearcoatRoughness={0.18} />
        </mesh>
      ))}

      {/* Glowing rings — one per exposed step edge, plus one small ring tight
          around the beam's base on the top step — tinted to the active
          feature's accent, like runway lights tracing the stairway's own
          edges. Each ring is two layered meshes: a soft additive halo disc
          (the bloom) sitting just beneath a crisp thin line (the neon core)
          — a flat ring line alone reads as a hard outline, not a glowing
          light source. */}
      {RING_SPECS.map((ring, i) => {
        const outer = ring.radius;
        const inner = outer * 0.92;
        const glowRadius = outer * 1.28;
        return (
          <group key={i}>
            <mesh
              ref={(el) => {
                ringGlowRefs.current[i] = el;
              }}
              position={[0, ring.y + 0.0015, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <circleGeometry args={[glowRadius, 48]} />
              <meshBasicMaterial
                color={DEFAULT_ACCENT}
                map={ringGlowTexture}
                toneMapped={false}
                transparent
                opacity={0.6}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            <mesh
              ref={(el) => {
                ringRefs.current[i] = el;
              }}
              position={[0, ring.y + 0.003, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[inner, outer, 64]} />
              <meshBasicMaterial color={DEFAULT_ACCENT} toneMapped={false} transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          </group>
        );
      })}

      {/* The light beam itself — rises from the top step up past the phone,
          bright and narrow at the source, fading and widening as it goes.
          Four planes per layer (at 45° increments — 8 "blades" total once
          each plane's opposite face is counted) rather than just two crossed
          at 90°, so the column reads as a round, soft volumetric shaft from
          any viewing angle instead of a flat two-plane cross whose edges
          become visible as a hard cutout at some camera angles; a wider,
          softer outer set plus a narrower, brighter inner-core set layered
          together for a bright center fading into a gentler glow. Additive +
          no depth-write so it blends into whatever is behind it (the
          phone's own body, the starfield) rather than occluding it. */}
      {[BEAM_PLANE_WIDTH, BEAM_CORE_WIDTH].map((width, layer) =>
        [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((rotationY, side) => {
          const i = layer * 4 + side;
          return (
            <mesh
              key={i}
              ref={(el) => {
                beamRefs.current[i] = el;
              }}
              position={[0, STACK_TOP_Y + BEAM_HEIGHT / 2, 0]}
              rotation={[0, rotationY, 0]}
            >
              <planeGeometry args={[width, BEAM_HEIGHT]} />
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
          );
        }),
      )}
    </group>
  );
}
