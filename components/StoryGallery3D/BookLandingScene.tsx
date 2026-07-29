"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import Scene from "./Scene";
import BookModel, { BOOK_D, BOOK_W, BOOK_H } from "./BookModel";

// The book's resting center height once landed, and the desk surface it
// sits on (offset down by half the book's own closed thickness so it reads
// as resting ON the desk, not embedded in or floating above it).
const REST_Y = 0;
const DESK_Y = REST_Y - BOOK_D / 2 - 0.02;
const FALL_START_Y = REST_Y + 3.6;
// The desk's top-surface footprint, and how thick its slab reads. A
// paper-thin plane only barely larger than the book (the original 8x6) has
// no visible edge, so from the establishing shot's fairly level angle its
// far boundary shows up as a stark straight line against the plain black
// void beyond it — nothing like an actual desk. Generously oversizing it
// pushes that boundary well outside both camera framings below so the
// surface recedes toward a natural perspective vanishing point instead;
// the added thickness gives it a visible front edge up close, the one cue
// that actually reads as "physical slab" rather than "floating sheet."
const DESK_W = 30;
const DESK_D = 30;
const DESK_THICKNESS = 0.28;
// Past vertical (-90°/-Math.PI/2), so the cover settles leaning back
// against where the pages would be rather than balancing exactly upright —
// reads as a book that's naturally come to rest open, not one frozen
// mid-swing.
const OPEN_ANGLE = -Math.PI * 0.68;

// Both cameras look at the same point (the book's own center, a touch
// above its true middle so the framing isn't overly bottom-heavy) — only
// the camera's own position moves between them, via a plain tween on
// camera.position with a lookAt() call each tick (see the timeline below).
const CAMERA_TARGET: [number, number, number] = [0, REST_Y + 0.1, 0];
// The establishing shot the fall itself plays out in front of — matches
// Scene's own `cameraPosition` prop below, kept as one shared constant so
// the two can't silently drift apart.
const CAMERA_ESTABLISH: [number, number, number] = [0, 1.3, 3.5];
// Steep-but-not-quite-vertical overhead framing the camera pushes into
// right before the cover opens — purely vertical would flatten the
// opening swing into an unreadable sliver (it happens in a plane the
// camera would then be staring straight down the edge of); this keeps
// enough of an angle for that motion to still read while unmistakably
// reading as "looking down at the book."
const CAMERA_TOP: [number, number, number] = [0, 2.75, 0.85];
// Matches Scene's own `fov` prop below — shared for the same reason as
// CAMERA_ESTABLISH above, and because fitScale() needs it too.
const BOOK_FOV = 34;

// The book's 8 corners once landed and lying flat. outer.rotation.x =
// -PI/2 maps its modeled width/height/thickness axes onto world X/-Z/Y (a
// point at modeled (0, BOOK_H/2, 0) — top edge — rotates to world
// (0, 0, -BOOK_H/2); modeled Z — thickness — rotates onto world +Y, which
// is why the closed cover ends up facing straight up off the desk). Kept
// at module scope, not recomputed per call — the flat pose never changes.
const BOOK_CORNERS: THREE.Vector3[] = (() => {
  const hw = BOOK_W / 2;
  const hh = BOOK_H / 2;
  const hd = BOOK_D / 2;
  const corners: THREE.Vector3[] = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        corners.push(new THREE.Vector3(sx * hw, sz * hd + REST_Y, -sy * hh));
      }
    }
  }
  return corners;
})();

// Scratch instances reused across calls (this only ever runs from the
// fall/open effect below, not a hot per-frame loop, but there's still no
// reason to allocate a fresh camera/vector on every call).
const fitScaleCamera = new THREE.PerspectiveCamera();
const fitScaleVec = new THREE.Vector3();

/** How much to scale the book down so all 8 of its landed corners stay
 *  within `fov`'s frame at the given aspect ratio (1 if it already fits).
 *  Both CAMERA_ESTABLISH and CAMERA_TOP were tuned by eye against a
 *  landscape aspect ratio and don't automatically stay in frame at
 *  narrower ones — CAMERA_TOP's steep overhead angle in particular
 *  overflows vertically even at 16:10 (that axis turns out to be
 *  aspect-*independent*, a straight FOV/distance shortfall, not something
 *  narrowing the viewport alone caused), and both poses' horizontal
 *  framing narrows further still on portrait/mobile aspects — on a phone
 *  viewport the two compound into the book and its desk badly overflowing
 *  top and bottom. A fixed or mobile-only-conditional scale can't track
 *  that correctly across every breakpoint; this recomputes the exact
 *  figure from the real projection math for whatever aspect the visitor's
 *  screen actually is. */
function fitScale(cameraPos: [number, number, number], lookAt: [number, number, number], aspect: number, fov: number, margin = 0.05): number {
  fitScaleCamera.fov = fov;
  fitScaleCamera.aspect = aspect;
  fitScaleCamera.near = 0.1;
  fitScaleCamera.far = 100;
  fitScaleCamera.position.set(...cameraPos);
  fitScaleCamera.lookAt(...lookAt);
  fitScaleCamera.updateMatrixWorld(true);
  fitScaleCamera.updateProjectionMatrix();

  let worst = 0;
  for (const corner of BOOK_CORNERS) {
    fitScaleVec.copy(corner).project(fitScaleCamera);
    worst = Math.max(worst, Math.abs(fitScaleVec.x), Math.abs(fitScaleVec.y));
  }
  return Math.min(1, 1 / (worst * (1 + margin)));
}

/** Procedural wood-grain texture for the desk the book lands on — a canvas
 *  gradient plus wavy grain lines and a few plank seams, generated inline
 *  rather than an image asset so this stays a single self-contained repo
 *  change (matches BookModel.tsx's own usePaperEdgeTexture/
 *  useHingeGrooveTexture precedent for the same reason). */
function useDeskWoodTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const w = 512;
    const h = 512;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Brighter, more saturated oak/chestnut browns than the previous pass
    // (was #7a4f2c / #8f6238 / #6b4526) — still reads warm-but-muted next
    // to the fog and low lighting here, short of an unmistakably "brown
    // wood desk" read; these push further into a clearer, lighter brown so
    // the tone survives that same dim lighting.
    const base = ctx.createLinearGradient(0, 0, w, 0);
    base.addColorStop(0, "#9c6a3c");
    base.addColorStop(0.5, "#b17c46");
    base.addColorStop(1, "#8a5a32");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 46; i++) {
      const y0 = (i / 46) * h + Math.sin(i * 12.9) * 6;
      ctx.strokeStyle = `rgba(74,46,22,${0.1 + (i % 5) * 0.04})`;
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(0, y0);
      for (let x = 0; x <= w; x += 32) {
        ctx.lineTo(x, y0 + Math.sin(x * 0.02 + i) * 4);
      }
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(74,46,22,0.3)";
    ctx.lineWidth = 2;
    for (let p = 1; p < 5; p++) {
      const x = (p / 5) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Grain density kept proportional to the original 1.4-tiles-over-8x6
    // plane now that the surface is DESK_W x DESK_D — otherwise the same
    // fixed tile count would stretch across the much larger area and read
    // as a blurry smear instead of grain.
    texture.repeat.set((1.4 / 8) * DESK_W, (1.4 / 6) * DESK_D);
    texture.colorSpace = THREE.SRGBColorSpace;
    // The establishing shot looks almost along the desk's own surface (a
    // near-grazing angle), which without this stretches the mip selection
    // hard in one UV direction and blurs the grain into a flat, washed-out
    // band right where the camera's looking — anisotropic filtering keeps
    // it resolved at exactly the shallow angles a flat "cover" plane like
    // this is always going to be viewed at.
    texture.anisotropy = 16;
    return texture;
  }, []);
}

// Walnut for the slab's underside/edges — only the top face shows the grain
// texture (a stretched copy of it on the thin edge faces would look wrong);
// this is what actually sells the "edge" cue the old flat plane had none of,
// visible on the front face nearest the establishing-shot camera. Lightened
// alongside the top face's own texture (was #3b2414, then #5c3a20) —
// matched-in-tone but still a shade darker than the top, reading as the
// same wood seen edge-on rather than a different, darker material.
const DESK_EDGE_COLOR = "#77502c";

function Desk() {
  const texture = useDeskWoodTexture();
  if (!texture) return null;
  return (
    <mesh position={[0, DESK_Y - DESK_THICKNESS / 2, 0]} receiveShadow>
      <boxGeometry args={[DESK_W, DESK_THICKNESS, DESK_D]} />
      <meshPhysicalMaterial attach="material-0" color={DESK_EDGE_COLOR} roughness={0.6} metalness={0.05} />
      <meshPhysicalMaterial attach="material-1" color={DESK_EDGE_COLOR} roughness={0.6} metalness={0.05} />
      <meshPhysicalMaterial attach="material-2" map={texture} roughness={0.8} metalness={0.05} envMapIntensity={0.5} />
      <meshPhysicalMaterial attach="material-3" color={DESK_EDGE_COLOR} roughness={0.6} metalness={0.05} />
      <meshPhysicalMaterial attach="material-4" color={DESK_EDGE_COLOR} roughness={0.6} metalness={0.05} />
      <meshPhysicalMaterial attach="material-5" color={DESK_EDGE_COLOR} roughness={0.6} metalness={0.05} />
    </mesh>
  );
}

/** Soft round point texture for the cosmos backdrop above the desk — same
 *  canvas-generated-texture approach as the wood grain above (and the dust
 *  puff below). A tiny bright core fading to transparent reads as a
 *  distant point of light once rendered through additive blending at
 *  point-sprite scale. */
function useStarTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(210,222,255,0.7)");
    gradient.addColorStop(1, "rgba(210,222,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

// Deterministic hash-based PRNG (not Math.random()) — component render/
// memo work is expected to be pure/idempotent (see CinematicIntro.tsx's own
// mulberry32 for the same reason), and a seeded index-based generator gives
// the same star scatter on every render without needing to stash it in
// state. Matches CosmicCanvas.tsx's own `prng` precedent.
function starPrng(n: number) {
  let s = (n * 1664525 + 1013904223) | 0;
  s = Math.imul(s, s ^ (s >> 16));
  return ((s >>> 0) / 0xffffffff);
}

// CAMERA_ESTABLISH's own basis vectors — placing stars by a plain world-
// space box (an earlier pass here) put almost all of them outside the
// establishing camera's actual view: it's tilted ~19° *below* horizontal
// (aimed at the desk) with only a 34° vertical FOV, so its frustum barely
// grazes true horizontal at its very top edge — nothing placed at a
// generic "up in the sky" world height was ever going to land in frame.
// Building star positions in this camera's own local (forward/right/up)
// space instead — as a small angular offset from where it's actually
// looking, not from world "up" — guarantees they land inside its frustum
// regardless of that tilt.
const ESTABLISH_FORWARD = new THREE.Vector3(...CAMERA_TARGET).sub(new THREE.Vector3(...CAMERA_ESTABLISH)).normalize();
const ESTABLISH_RIGHT = new THREE.Vector3().crossVectors(ESTABLISH_FORWARD, new THREE.Vector3(0, 1, 0)).normalize();
const ESTABLISH_UP = new THREE.Vector3().crossVectors(ESTABLISH_RIGHT, ESTABLISH_FORWARD).normalize();
const ESTABLISH_ORIGIN = new THREE.Vector3(...CAMERA_ESTABLISH);

// Scattered as a cone of directions around where the establishing camera is
// actually looking (see the basis vectors above), well behind the book, so
// they read as a night sky sitting behind the whole tabletop scene rather
// than floating in a part of world-space this shot never points at.
function useStarPositions(count: number, seed: number) {
  // `count`/`seed` are literals at each call site (never change across
  // renders), so this only ever needs to run once per instance, same as
  // this file's other useMemo(() => ..., []) texture/geometry hooks.
  return useMemo(() => {
    const arr = new Float32Array(count * 3);
    const dir = new THREE.Vector3();
    const pos = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const n = seed * 100000 + i;
      // Offsets from dead-center of frame, well inside BOOK_FOV's own
      // ±17° half-angle (and its ~±26° horizontal counterpart) so every
      // star lands comfortably inside the frustum, not right at its edge.
      // Biased upward (mostly positive elevation) since dead-center already
      // points at the book/desk — tilting up from there is what actually
      // reaches the emptier part of frame above it.
      const elevDeg = -4 + starPrng(n * 3 + 1) * 18;
      const azDeg = (starPrng(n * 3 + 2) - 0.5) * 44;
      const dist = 12 + starPrng(n * 3) * 55;
      const elev = THREE.MathUtils.degToRad(elevDeg);
      const az = THREE.MathUtils.degToRad(azDeg);

      dir.copy(ESTABLISH_FORWARD)
        .addScaledVector(ESTABLISH_UP, Math.tan(elev))
        .addScaledVector(ESTABLISH_RIGHT, Math.tan(az))
        .normalize();
      pos.copy(ESTABLISH_ORIGIN).addScaledVector(dir, dist);
      // Floor kept just above the desk surface — a steeply-down offset
      // combined with a short distance could otherwise place a star at or
      // below the desk's own height, where the opaque slab would hide it.
      pos.y = Math.max(pos.y, DESK_Y + 0.15);

      arr[i * 3] = pos.x;
      arr[i * 3 + 1] = pos.y;
      arr[i * 3 + 2] = pos.z;
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** A static starfield behind/above the desk — this scene's own "sky",
 *  otherwise just the plain fog-black void the desk recedes into. Two
 *  layers (many faint pinpricks + a handful of brighter, bigger ones) for
 *  depth, matching CosmicCanvas.tsx's own near/far star-field precedent.
 *  `fog={false}` on both materials is what actually makes these visible at
 *  the distance they need to sit — the desk's own <fog> below (tuned to
 *  swallow the desk's surface into black by ~10 units out) would otherwise
 *  wash these out to nothing long before they're far enough to look like a
 *  sky. Rendered once and left alone (no per-frame animation) — matches
 *  this scene's "demand" frameloop; it just needs to be in the scene graph
 *  the next time anything else (the fall, the idle pose) calls
 *  invalidate(), not to drive its own render-loop upkeep. */
function CosmosField() {
  const texture = useStarTexture();
  const farPositions = useStarPositions(1400, 1);
  const nearPositions = useStarPositions(90, 2);

  if (!texture) return null;

  return (
    <>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[farPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          size={0.09}
          transparent
          opacity={0.55}
          depthWrite={false}
          fog={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          sizeAttenuation
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nearPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          size={0.22}
          transparent
          opacity={0.85}
          depthWrite={false}
          fog={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          sizeAttenuation
        />
      </points>
    </>
  );
}

/** Soft circular puff, generated on canvas rather than an image asset —
 *  matches useDeskWoodTexture's own precedent above for the same reason.
 *  A single radial falloff (bright, dusty tan center fading to fully
 *  transparent) reads as a puff of disturbed dust once billboarded and
 *  faded in/out; a sharp-edged disc would read as a flat coin instead. */
function useDustPuffTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(216,190,148,0.9)");
    gradient.addColorStop(0.45, "rgba(190,160,118,0.45)");
    gradient.addColorStop(1, "rgba(190,160,118,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

const DUST_PUFF_COUNT = 80;
// The first slice of the pool is low, fast "kicked debris" puffs (small,
// quick, barely rising); the rest is a slower, taller lingering "haze"
// layer that builds after them — a real impact reads as a sharp initial
// kick with a softer cloud that keeps drifting up afterward, not one
// uniform burst of identical particles.
const DUST_GROUND_COUNT = 48;
// Roughly the flat book's own half-diagonal (BOOK_W/2, BOOK_H/2 — see
// BOOK_CORNERS) — puffs kick off just inside its footprint and drift out
// past its edges, reading as dust the book's own impact displaced rather
// than dust that happened to already be sitting out past its corners.
// Widened from 0.85 alongside the bigger pool so the extra puffs actually
// spread into a fuller cloud instead of just packing the same small area
// more densely.
const DUST_RING_RADIUS = 1.05;

/** Plays a burst of dust puffs radiating out from the book's landing point,
 *  triggered via `playRef.current()` — called from FallOpenSequence's own
 *  timeline (see the `.call()` at the fall's landing moment) rather than
 *  driven by its own prop, since the two need to fire on the exact same
 *  frame the fall timeline decides impact happens, not on a render cycle.
 *  Renders a fixed pool of THREE.Sprite puffs (billboarded automatically,
 *  no manual look-at math needed) that sit invisible (opacity 0) until
 *  played, then get re-triggered with fresh random directions/timing on
 *  every call — cheaper than mounting/unmounting a particle system per
 *  play, and this scene only ever needs one burst in flight at a time. */
function DustBurst({ playRef }: { playRef: React.RefObject<(() => void) | null> }) {
  const texture = useDustPuffTexture();
  const spritesRef = useRef<THREE.Sprite[]>([]);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    playRef.current = () => {
      const sprites = spritesRef.current;
      sprites.forEach((sprite, i) => {
        const mat = sprite.material as THREE.SpriteMaterial;
        const isGround = i < DUST_GROUND_COUNT;
        // Spread around the ring with generous jitter on both angle and
        // radius (not just a per-puff reach fraction) so a denser pool
        // still reads as an irregular scatter rather than a mechanically
        // even ring once there are this many of them.
        const angle = (i / sprites.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.9;
        const reach = DUST_RING_RADIUS * (isGround ? 0.55 + Math.random() * 0.55 : 0.4 + Math.random() * 0.75);
        const startFrac = 0.08 + Math.random() * 0.22;
        const startX = Math.cos(angle) * reach * startFrac;
        const startZ = Math.sin(angle) * reach * startFrac;
        const endX = Math.cos(angle) * reach;
        const endZ = Math.sin(angle) * reach;
        // Ground puffs barely lift off the desk; haze puffs climb well
        // above it — the split that actually reads as "kicked debris" vs.
        // "rising cloud" rather than just two sizes of the same motion.
        const rise = isGround ? DESK_Y + 0.03 + Math.random() * 0.1 : DESK_Y + 0.2 + Math.random() * 0.4;
        const dur = isGround ? 0.35 + Math.random() * 0.3 : 0.9 + Math.random() * 0.7;
        const finalScale = isGround ? 0.12 + Math.random() * 0.12 : 0.3 + Math.random() * 0.28;
        const peakOpacity = isGround ? 0.6 + Math.random() * 0.3 : 0.4 + Math.random() * 0.3;
        // Ground puffs fire almost instantly (a sharp kick); haze puffs
        // stagger in over the next moment, so the cloud keeps building
        // rather than appearing all at once with the initial impact.
        const delay = isGround ? Math.random() * 0.05 : Math.random() * 0.35;
        const spin = (Math.random() - 0.5) * (isGround ? 1.2 : 2.4);

        gsap.killTweensOf([sprite.position, sprite.scale, mat]);
        gsap.set(sprite.position, { x: startX, y: DESK_Y + 0.01, z: startZ });
        gsap.set(sprite.scale, { x: 0.02, y: 0.02, z: 1 });
        gsap.set(mat, { opacity: 0, rotation: 0 });

        const tl = gsap.timeline({ delay, onUpdate: invalidate });
        tl.to(mat, { opacity: peakOpacity, duration: dur * 0.25, ease: "power1.out" }, 0)
          .to(sprite.position, { x: endX, y: rise, z: endZ, duration: dur, ease: "power2.out" }, 0)
          .to(sprite.scale, { x: finalScale, y: finalScale, z: 1, duration: dur, ease: "power2.out" }, 0)
          .to(mat, { rotation: spin, duration: dur, ease: "power1.out" }, 0)
          .to(mat, { opacity: 0, duration: dur * 0.6, ease: "power1.in" }, dur * 0.4);
      });
    };
    return () => {
      playRef.current = null;
    };
  }, [invalidate, playRef]);

  if (!texture) return null;

  return (
    <>
      {Array.from({ length: DUST_PUFF_COUNT }).map((_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            if (el) spritesRef.current[i] = el;
          }}
          position={[0, DESK_Y, 0]}
          scale={[0.001, 0.001, 1]}
        >
          <spriteMaterial map={texture} transparent depthWrite={false} opacity={0} />
        </sprite>
      ))}
    </>
  );
}

/** Drives the fall/land/open GSAP timeline, re-running every time `active`
 *  flips false->true (BookLandingScene itself stays permanently mounted
 *  once warmed — see below — so this can't rely on a mount-once effect).
 *  Deliberately rendered *inside* <Scene>'s Canvas tree, as a sibling of
 *  the group refs it animates, rather than having BookLandingScene run
 *  this in a top-level useEffect — R3F mounts a Canvas's children through
 *  its own, separate reconciler root, so a plain useEffect in the OUTER
 *  component can fire before that inner root has actually attached its
 *  refs, reading `.current` as still null. A component that lives inside
 *  the Canvas tree gets its effects sequenced by that same reconciler
 *  after its sibling refs commit, exactly like Scene.tsx's own
 *  CameraFit/CameraLookAt. Renders nothing. */
function FallOpenSequence({
  active,
  outerGroupRef,
  hingeGroupRef,
  onOpenedRef,
  dustPlayRef,
}: {
  active: boolean;
  outerGroupRef: React.RefObject<THREE.Group | null>;
  hingeGroupRef: React.RefObject<THREE.Group | null>;
  onOpenedRef: React.RefObject<() => void>;
  dustPlayRef: React.RefObject<(() => void) | null>;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useEffect(() => {
    const outer = outerGroupRef.current;
    const hinge = hingeGroupRef.current;
    if (!outer || !hinge) return;

    // Recomputed on every play (not memoized) since it only needs to be
    // right at the moment the sequence actually starts/idles, and reads
    // `size` fresh each time in case the viewport was resized since the
    // last run.
    //
    // fitScale's BOOK_CORNERS assume the book's final FLAT resting pose —
    // its guarantee doesn't hold while the book is still tumbling at an
    // arbitrary angle mid-fall (a tilted flat object's corners can swing
    // much further from center on screen than the same object lying flat
    // does), so `estScale` — sized generously for the establishing camera's
    // own flat-pose framing — is only safe to use once the book has
    // actually landed flat. `fallScale`, the smaller shared min() of both
    // poses' fits, is what the idle/tumbling phase keeps using instead
    // (matches this scene's original, proven-safe sizing); the book then
    // grows from fallScale into the bigger estScale as part of the landing
    // thump below, and from there into topScale during the camera's pan to
    // the overhead shot.
    const aspect = size.width / size.height;
    const estScale = fitScale(CAMERA_ESTABLISH, CAMERA_TARGET, aspect, BOOK_FOV);
    const topScale = fitScale(CAMERA_TOP, CAMERA_TARGET, aspect, BOOK_FOV);
    const fallScale = Math.min(estScale, topScale);

    if (!active) {
      // Idle/closed pose — also the pre-fall starting pose, set eagerly
      // here (not deferred to the moment `active` flips true) so the very
      // first frame once the fall starts is already correct instead of
      // popping from whatever the last tween left behind. Camera included
      // — it ends each play at CAMERA_TOP, so a second open needs it put
      // back at the establishing shot, not left wherever the last one
      // finished.
      gsap.killTweensOf([outer.position, outer.rotation, outer.scale, hinge.rotation, camera.position]);
      gsap.set(outer.position, { x: 0, y: FALL_START_Y, z: 0 });
      gsap.set(outer.rotation, { x: -Math.PI / 2 + 0.5, y: 0.45, z: 0.35 });
      gsap.set(outer.scale, { x: fallScale, y: fallScale, z: fallScale });
      gsap.set(hinge.rotation, { y: 0 });
      gsap.set(camera.position, { x: CAMERA_ESTABLISH[0], y: CAMERA_ESTABLISH[1], z: CAMERA_ESTABLISH[2] });
      camera.lookAt(...CAMERA_TARGET);
      invalidate();
      return;
    }

    // No prefers-reduced-motion branch here — StoryGallerySection.tsx's
    // handleEnter never flips `active` true at all for that preference,
    // routing straight to the original plain FLIP-zoom instead. A falling/
    // tumbling book is exactly the motion that setting exists to avoid, so
    // "play it shorter" isn't the right accommodation; "don't play it" is.
    //
    // onUpdate here (timeline-level, fires every tick the WHOLE timeline is
    // playing) requests a fresh render each tick — Scene's frameloop is
    // "demand" for this scene (see the prop below for why), so nothing
    // would redraw otherwise; GSAP mutates the group refs directly, R3F
    // has no idea anything changed unless told to.
    const tl = gsap.timeline({ onUpdate: invalidate });
    tl.to(outer.position, { y: REST_Y, duration: 1.15, ease: "power2.in" }, 0)
      .to(outer.rotation, { x: -Math.PI / 2, y: 0, z: 0, duration: 1.15, ease: "power3.out" }, 0)
      // Impact — fires right as the fall's position/rotation tweens land,
      // kicking off the dust puffs in DustBurst below.
      .call(() => dustPlayRef.current?.(), [], 1.15)
      // Landing thump — a quick squash on the fall's own vertical axis
      // (still relative to fallScale, the size it's actually falling at)
      // reads as impact weight better than the position/rotation settle
      // alone; the recovery then grows the WHOLE book (x/y/z, not just the
      // squashed axis) from fallScale up to the bigger estScale, so it
      // settles into its more prominent resting size as part of the same
      // motion instead of just resuming its pre-fall size.
      .to(outer.scale, { y: fallScale * 0.88, duration: 0.09, ease: "power1.out" })
      .to(outer.scale, { x: estScale, y: estScale, z: estScale, duration: 0.42, ease: "elastic.out(1,0.5)" })
      .to({}, { duration: 0.2 })
      .addLabel("pan")
      // Camera pushes in from the establishing angle to a steep overhead
      // shot, framing the book like it's now sitting in front of the
      // reader ready to be opened — lookAt is re-applied every tick since
      // GSAP only knows how to tween camera.position's plain numbers, not
      // "keep this pointed at the book" on its own. The book's own scale
      // rides along on the same label/duration so it settles into
      // CAMERA_TOP's tighter frame exactly as the camera arrives there,
      // rather than popping straight to topScale.
      .to(camera.position, {
        x: CAMERA_TOP[0],
        y: CAMERA_TOP[1],
        z: CAMERA_TOP[2],
        duration: 0.9,
        ease: "power2.inOut",
        onUpdate: () => camera.lookAt(...CAMERA_TARGET),
      }, "pan")
      .to(outer.scale, { x: topScale, y: topScale, z: topScale, duration: 0.9, ease: "power2.inOut" }, "pan")
      .to({}, { duration: 0.15 })
      .to(hinge.rotation, {
        y: OPEN_ANGLE,
        duration: 0.95,
        ease: "power2.inOut",
        onUpdate: function () {
          if (this.progress() > 0.55) {
            onOpenedRef.current();
            // Fire once — onUpdate otherwise keeps calling this every
            // remaining frame of the same tween.
            this.eventCallback("onUpdate", null);
          }
        },
      });

    return () => {
      tl.kill();
    };
    // Ref objects are stable identities for this component's whole
    // lifetime, and both `camera` and `invalidate` are R3F's own stable
    // store accessors; only `active` is meant to re-trigger this. `size`
    // is read fresh each time this runs (not tracked reactively) — a
    // resize while the book is genuinely mid-animation isn't worth
    // guarding, and the idle pose recomputes it every time `active` drops
    // back to false anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return null;
}

interface BookLandingSceneProps {
  /** Toggled true to play the fall/land/open sequence, false to hold the
   *  idle closed pose. BookLandingScene stays mounted across many
   *  true<->false cycles (StoryGallerySection.tsx mounts it once the story
   *  section has been scrolled near, well before any click, precisely so
   *  its Canvas/Environment/textures are already warm by the time `active`
   *  first flips true — see the comment on FallOpenSequence for why a
   *  fresh Canvas per open was too slow to start). */
  active: boolean;
  /** Fires partway through the cover's open swing (~55%), not on full
   *  completion — that's the caller's cue to start crossfading in the
   *  fullscreen DOM reader while the cover is still visibly mid-motion, so
   *  the handoff reads as one continuous gesture instead of a dead
   *  pause-then-cut. */
  onOpened: () => void;
}

/** The cinematic "book drops onto the study desk and falls open" sequence
 *  that plays once between clicking the idle preview book and landing on
 *  the fullscreen reader (StoryCinematic.tsx) — see StoryGallerySection.tsx
 *  for how `onOpened` is wired into that handoff, and for the pre-warm
 *  mounting strategy this relies on. */
export default function BookLandingScene({ active, onOpened }: BookLandingSceneProps) {
  const outerGroupRef = useRef<THREE.Group>(null);
  const hingeGroupRef = useRef<THREE.Group>(null);
  // Ref, not a direct closure over the `onOpened` prop, so
  // FallOpenSequence's effect always calls whatever the latest render
  // passed, without needing that effect to depend on (and re-run for)
  // every render of the caller. Synced via its own effect rather than
  // assigned inline during render — mutating a ref's `.current` while
  // rendering is flagged by this repo's react-hooks/refs lint rule (render
  // can run without committing under React's concurrent scheduling, and a
  // ref write should only ever happen as a real side effect).
  const onOpenedRef = useRef(onOpened);
  useEffect(() => {
    onOpenedRef.current = onOpened;
  }, [onOpened]);
  // Assigned by DustBurst itself (see that component) — FallOpenSequence
  // calls it directly from its own timeline at the exact moment of impact,
  // the same ref-callback wiring used for onOpenedRef above and for the
  // same reason: it needs to fire on that timeline's own clock, not on a
  // render/prop cycle.
  const dustPlayRef = useRef<(() => void) | null>(null);

  return (
    <Scene
      // "demand", not "always" — this scene is mounted well before any
      // click (see the pre-warm mounting note above) specifically so its
      // Canvas/Environment/texture GPU work is already done by the time
      // `active` first flips true, but it still shouldn't burn a second
      // continuous render loop the whole time it's sitting there idle
      // (this page already has one permanently-spinning Canvas in
      // BookPreview3D's own idle preview). "demand" renders once on mount
      // (flushing that warm-up work to the GPU) and then only again when
      // explicitly told to — which is exactly what FallOpenSequence's
      // `invalidate()` calls do, every tick while the fall/open timeline
      // is actually playing. Two simultaneously-"always" canvases were
      // also the direct cause of an earlier bug here: enough main-thread
      // contention to stall a frame, and since this app disables GSAP's
      // lag-smoothing (SmoothScroll.tsx), a stall like that made the
      // fall/open timeline jump to its end in a single tick instead of
      // animating.
      frameloop="demand"
      cameraPosition={CAMERA_ESTABLISH}
      cameraLookAt={CAMERA_TARGET}
      fov={BOOK_FOV}
      contactShadowPosition={[0, DESK_Y + 0.002, 0]}
      contactShadowScale={6}
    >
      {/* The desk is oversized (30x30, see DESK_W/DESK_D above) specifically
          so its edge never enters frame — but with nothing at all fading
          the distance out, that leaves an endless, flat-lit plane with zero
          depth cues once the wood grain itself blurs out toward the
          establishing shot's shallow, near-grazing sightline: no vanishing
          point, no darkening, nothing to read as "table" rather than "wall
          of color." Fog matching the page's own near-black background
          recedes the far reaches into the same darkness the rest of the
          site already sits in, giving the eye an actual horizon instead of
          an infinite flat wash. */}
      <fog attach="fog" args={["#050505", 1.8, 10]} />
      <CosmosField />
      <Desk />
      <group ref={outerGroupRef}>
        <BookModel hingeGroupRef={hingeGroupRef} />
      </group>
      <DustBurst playRef={dustPlayRef} />
      <FallOpenSequence
        active={active}
        outerGroupRef={outerGroupRef}
        hingeGroupRef={hingeGroupRef}
        onOpenedRef={onOpenedRef}
        dustPlayRef={dustPlayRef}
      />
    </Scene>
  );
}
