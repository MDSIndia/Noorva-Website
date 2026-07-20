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

    const base = ctx.createLinearGradient(0, 0, w, 0);
    base.addColorStop(0, "#6b4324");
    base.addColorStop(0.5, "#7c4f2c");
    base.addColorStop(1, "#5e3a1f");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 46; i++) {
      const y0 = (i / 46) * h + Math.sin(i * 12.9) * 6;
      ctx.strokeStyle = `rgba(30,16,6,${0.05 + (i % 5) * 0.02})`;
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(0, y0);
      for (let x = 0; x <= w; x += 32) {
        ctx.lineTo(x, y0 + Math.sin(x * 0.02 + i) * 4);
      }
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(20,10,4,0.35)";
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
    return texture;
  }, []);
}

// Dark walnut for the slab's underside/edges — only the top face shows the
// grain texture (a stretched copy of it on the thin edge faces would look
// wrong); this is what actually sells the "edge" cue the old flat plane had
// none of, visible on the front face nearest the establishing-shot camera.
const DESK_EDGE_COLOR = "#3b2414";

function Desk() {
  const texture = useDeskWoodTexture();
  if (!texture) return null;
  return (
    <mesh position={[0, DESK_Y - DESK_THICKNESS / 2, 0]} receiveShadow>
      <boxGeometry args={[DESK_W, DESK_THICKNESS, DESK_D]} />
      <meshPhysicalMaterial attach="material-0" color={DESK_EDGE_COLOR} roughness={0.6} metalness={0.05} />
      <meshPhysicalMaterial attach="material-1" color={DESK_EDGE_COLOR} roughness={0.6} metalness={0.05} />
      <meshPhysicalMaterial attach="material-2" map={texture} roughness={0.55} metalness={0.05} clearcoat={0.15} clearcoatRoughness={0.5} />
      <meshPhysicalMaterial attach="material-3" color={DESK_EDGE_COLOR} roughness={0.6} metalness={0.05} />
      <meshPhysicalMaterial attach="material-4" color={DESK_EDGE_COLOR} roughness={0.6} metalness={0.05} />
      <meshPhysicalMaterial attach="material-5" color={DESK_EDGE_COLOR} roughness={0.6} metalness={0.05} />
    </mesh>
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
}: {
  active: boolean;
  outerGroupRef: React.RefObject<THREE.Group | null>;
  hingeGroupRef: React.RefObject<THREE.Group | null>;
  onOpenedRef: React.RefObject<() => void>;
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
    // last run. min() of the two poses' own fit scales, not a separate
    // scale per pose — using just one across the whole idle/fall/landed
    // sequence means there's no visible size pop between the fall ending
    // and the top-down framing beginning, at the minor cost of the book
    // being marginally smaller than strictly necessary during the fall on
    // wider screens (where CAMERA_ESTABLISH alone would already fit at 1).
    const aspect = size.width / size.height;
    const bookScale = Math.min(
      fitScale(CAMERA_ESTABLISH, CAMERA_TARGET, aspect, BOOK_FOV),
      fitScale(CAMERA_TOP, CAMERA_TARGET, aspect, BOOK_FOV)
    );

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
      gsap.set(outer.scale, { x: bookScale, y: bookScale, z: bookScale });
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
      // Landing thump — a quick squash-and-recover on the fall's own
      // vertical axis reads as impact weight better than the position/
      // rotation settle alone.
      .to(outer.scale, { y: bookScale * 0.88, duration: 0.09, ease: "power1.out" })
      .to(outer.scale, { y: bookScale, duration: 0.42, ease: "elastic.out(1,0.5)" })
      .to({}, { duration: 0.2 })
      // Camera pushes in from the establishing angle to a steep overhead
      // shot, framing the book like it's now sitting in front of the
      // reader ready to be opened — lookAt is re-applied every tick since
      // GSAP only knows how to tween camera.position's plain numbers, not
      // "keep this pointed at the book" on its own.
      .to(camera.position, {
        x: CAMERA_TOP[0],
        y: CAMERA_TOP[1],
        z: CAMERA_TOP[2],
        duration: 0.9,
        ease: "power2.inOut",
        onUpdate: () => camera.lookAt(...CAMERA_TARGET),
      })
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
      <Desk />
      <group ref={outerGroupRef}>
        <BookModel hingeGroupRef={hingeGroupRef} />
      </group>
      <FallOpenSequence active={active} outerGroupRef={outerGroupRef} hingeGroupRef={hingeGroupRef} onOpenedRef={onOpenedRef} />
    </Scene>
  );
}
