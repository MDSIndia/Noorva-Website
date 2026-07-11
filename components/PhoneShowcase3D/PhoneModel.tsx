"use client";

import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { phoneCarouselX } from "../store";
import { FEATURES, ACCENT_HEX } from "../FeatureShowcase/featuresData";
import ScreenContent from "./ScreenContent";
import { roundedRectShape } from "./geometry";

interface PhoneModelProps {
  /** Which feature this specific phone instance shows — fixed for its
   *  whole lifetime. A new feature means a whole new PhoneModel mounts
   *  (see PhoneShowcase3D.tsx's renderIndices), not this prop changing on
   *  an existing instance, so there's no in-place content swap to animate. */
  activeIndex: number;
}

// iPhone 16 Pro's real dimensions (149.6 x 71.5 x 8.25mm), normalized so the
// body height lands at 2.42 scene units — every other measurement below is
// derived from this same ratio rather than eyeballed.
const MM = 2.42 / 149.6;
const BODY_H = 149.6 * MM;
const BODY_W = 71.5 * MM;
const BODY_D = 8.25 * MM;
const BODY_R = 11.5 * MM; // corner radius — real iPhones round only the corners
const BEZEL = 2.2 * MM; // slim Pro-class bezel around the display
const SCREEN_W = BODY_W - BEZEL * 2;
const SCREEN_H = BODY_H - BEZEL * 2;
const SCREEN_R = 9.5 * MM;

// Natural Titanium — a bright brushed-silver finish, the lightest of the
// 16 Pro lineup, giving the 3-D model a premium silver look that pops
// against the dark site background.
const TITANIUM = "#b0b0b4";

// Scene.tsx's camera is fixed (not a dynamic fitTarget), so the whole phone
// is shrunk uniformly around its own center to free up real headroom below
// it for a properly-defined podium (Podium.tsx) instead of the sliver-thin
// stack that was previously the only thing that fit under the frustum edge.
// Deliberately generous margin here (not just barely enough) — real browser
// windows vary in effective viewport height (chrome/taskbar/zoom eat into
// it in ways a fixed test viewport doesn't capture), so the podium needs
// slack beyond the one-viewport check to stay clear of the frustum edge.
const SHOWCASE_SCALE = 0.8;

// Carousel spacing — how far apart (in world units) each feature's phone
// sits along the X axis. Reused as-is from the old single-phone entrance's
// own off-screen offset (2.6), which was already proven to clear this
// camera's frustum at every breakpoint, so a neighboring slot at exactly
// this distance is guaranteed off-screen rather than peeking into frame.
const SLOT_SPACING = 2.6;

// Mount entrance — every phone instance (not just the very first) eases in
// from this extra offset added on top of its own carousel position. For the
// very first phone this produces the classic "slides in from the right"
// reveal (carousel position is 0 at mount, so the offset alone carries it
// off-screen to start). For every later phone, its carousel position is
// already off-screen (it only ever mounts as the upcoming slot, one full
// SLOT_SPACING to the right) by the time this runs, so the extra offset
// just makes it briefly even further off-screen — invisible either way,
// and resolved back to its true carousel position well before a real
// scroll gesture brings it into view. Simpler than gating this per-instance.
const ENTRANCE_X_OFFSET = 2.6;

function PhoneModel({ activeIndex }: PhoneModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const entranceRef = useRef(0); // 0..1, eases up once on mount — never resets

  // Flat-sided body: a rounded-rect face extruded to the phone's thickness —
  // RoundedBox's uniform rounding reads as a rounded pebble instead of the
  // slab-with-rounded-corners silhouette of an actual iPhone, which is most
  // of why the earlier version didn't land. Bevel deliberately left off:
  // ExtrudeGeometry's bevel algorithm self-intersects where this shape's
  // curved corners meet its straight edges, producing a visibly pinched
  // corner from some angles — the polished-edge look comes from the
  // material/lighting instead of actual bevel geometry.
  const bodyGeometry = useMemo(() => {
    const shape = roundedRectShape(BODY_W, BODY_H, BODY_R);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: BODY_D,
      bevelEnabled: false,
      curveSegments: 24,
    });
    geo.translate(0, 0, -BODY_D / 2);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const screenGeometry = useMemo(() => {
    const shape = roundedRectShape(SCREEN_W, SCREEN_H, SCREEN_R);
    return new THREE.ShapeGeometry(shape, 20);
  }, []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Mount entrance — plays once, over about a second, then never again.
    // Clamp delta here specifically: Scene.tsx's Canvas toggles frameloop
    // from "never" to "always" once the section scrolls into view, and the
    // very first frame after that switch reports a large delta (real
    // wall-clock time since the last render, while frameloop was paused) —
    // left unclamped, that one frame alone blows entranceRef straight to 1
    // and the whole entrance plays out as an instant snap instead of
    // animating.
    const entranceDelta = Math.min(delta, 1 / 30);
    entranceRef.current = Math.min(1, entranceRef.current + entranceDelta * 1.1);
    const entrance = 1 - Math.pow(1 - entranceRef.current, 3); // easeOutCubic

    // Carousel position: this instance's own fixed feature index minus the
    // continuously scroll-driven carousel value, scaled to world units.
    // Positive while this phone is still "upcoming" (off to the right),
    // zero once it's the fully-centered active one, negative once it's
    // become the "outgoing" phone sliding away to the left — the actual
    // "new phone from the right, old phone to the left" motion, driven by
    // the same single scrubbed value for every mounted phone at once.
    const carouselOffset = (activeIndex - phoneCarouselX.value) * SLOT_SPACING;

    // Always facing forward — no more scroll-driven spin. The carousel
    // slide is the whole transition now; a still-spinning phone on top of
    // that would look chaotic rather than like a clean product swap.
    group.rotation.y = 0;

    // Subtle idle float, always on, small enough to read as "alive"
    // without looking animated.
    const t = state.clock.getElapsedTime();
    group.position.y = Math.sin(t * 0.55) * 0.045 - (1 - entrance) * 0.35;
    group.position.x = carouselOffset + (1 - entrance) * ENTRANCE_X_OFFSET;

    const entranceScale = THREE.MathUtils.lerp(0.8, 1, entrance);
    group.scale.setScalar(entranceScale * SHOWCASE_SCALE);
  });

  const feature = FEATURES[activeIndex];
  const accentHex = ACCENT_HEX[feature.accent] ?? "#7c5cfc";

  // Triple-camera island, matched against real reference photos: Ultra Wide
  // (top-left) and Wide (bottom-left) stacked in a left column, Telephoto
  // centered on the right — not a symmetric triangle, which is what the
  // first pass got wrong — inside a heavily-rounded squircle housing, with
  // a LiDAR capsule and flash tucked into the remaining corners.
  const lensR = 4.5 * MM;
  // Lens centers must be spaced further apart than 2x the bezel-ring radius
  // (lensR * 1.22) or adjacent rings overlap into a single fused blob instead
  // of three distinct lenses — the bug the previous, tighter spacing had.
  // Signs here are flipped from what "top-left/bottom-left/right" would
  // naively suggest: the island itself sits correctly in the body's own
  // top-left corner, but at the rotation angle where the back fully faces
  // a fixed camera, the group's local +X reads as screen-left, not
  // screen-right — so a local +X column is what actually renders as the
  // real device's left-hand lens pair.
  const lensColX = 7.2 * MM;
  const lensColHalfY = 7.2 * MM;
  const lensTeleX = 5.3 * MM;
  const lensPositions: [number, number][] = [
    [lensColX, lensColHalfY], // ultra wide, top-left
    [lensColX, -lensColHalfY], // wide (main), bottom-left
    [-lensTeleX, 0], // telephoto, centered right
  ];
  const islandSize = 29 * MM; // sized to fit the lens triangle above with margin
  const islandCX = BODY_W / 2 - 5.0 * MM - islandSize / 2;
  const islandCY = BODY_H / 2 - 5.2 * MM - islandSize / 2;
  const islandZ = -BODY_D / 2 - 0.01;

  const islandGeometry = useMemo(() => {
    // Same bevel-artifact issue as the body — off for the same reason.
    const shape = roundedRectShape(islandSize, islandSize, islandSize * 0.34);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.026,
      bevelEnabled: false,
      curveSegments: 16,
    });
    geo.translate(0, 0, -0.026);
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <group ref={groupRef}>
      {/* Body / frame — polished titanium rail, catching a bright highlight
          as it turns rather than sitting flat and matte. */}
      <mesh geometry={bodyGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial color={TITANIUM} metalness={0.95} roughness={0.18} reflectivity={0.8} />
      </mesh>

      {/* Back glass panel — satin/frosted, distinctly less glossy than the
          polished rail around it. */}
      <mesh position={[0, 0, -BODY_D / 2 - 0.001]}>
        <shapeGeometry args={[roundedRectShape(BODY_W - 0.015, BODY_H - 0.015, BODY_R - 0.01), 20]} />
        <meshPhysicalMaterial color="#1c1c1e" metalness={0.15} roughness={0.62} clearcoat={0.15} clearcoatRoughness={0.6} />
      </mesh>

      {/* Camera island housing — a rounded squircle, not a boxy square */}
      <mesh geometry={islandGeometry} position={[islandCX, islandCY, islandZ]} castShadow>
        <meshPhysicalMaterial color="#141416" metalness={0.5} roughness={0.5} />
      </mesh>
      {lensPositions.map(([dx, dy], i) => (
        <group
          key={i}
          // islandGeometry's outward face sits at islandZ - 0.026 (its
          // extrude depth) — these need to clear that, not sit at the
          // island's mid-depth like before, or they're buried inside the
          // opaque housing block and invisible no matter how they're
          // oriented, which was the actual remaining bug.
          position={[islandCX + dx, islandCY + dy, islandZ - 0.03]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {/* cylinderGeometry extrudes along its local Y axis by default, so
              without this group's rotation these would present edge-on —
              thin curved slivers instead of round lenses. The -90°-about-X
              rotation turns that local Y axis to face outward along -Z (the
              island's own outward normal); +90° pointed them into the body
              instead, where they were backface-culled and invisible. */}
          {/* Raised chrome bezel ring — the bright rim visible around every
              lens in reference photos, even on the darkest finishes.
              side={THREE.DoubleSide} on all three: a single-sided material
              goes invisible if this group's outward-facing rotation sign
              ever ends up backwards for a given viewing side, which is
              exactly what happened here — cheaper to make the small lens
              discs immune to that than to keep re-deriving the sign. */}
          <mesh>
            <cylinderGeometry args={[lensR * 1.22, lensR * 1.22, 0.01, 32]} />
            <meshPhysicalMaterial color="#5a5a5e" metalness={0.95} roughness={0.22} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.004, 0]}>
            <cylinderGeometry args={[lensR, lensR, 0.012, 32]} />
            <meshPhysicalMaterial color="#0a0a0b" metalness={0.85} roughness={0.2} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.005, 0]}>
            <cylinderGeometry args={[lensR * 0.6, lensR * 0.6, 0.006, 32]} />
            <meshPhysicalMaterial color="#050506" metalness={0.9} roughness={0.05} clearcoat={1} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      {/* LiDAR scanner — the pale capsule near the top-right of the island */}
      <mesh
        position={[islandCX - 11 * MM, islandCY + 9 * MM, islandZ - 0.028]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[lensR * 0.55, lensR * 0.55, 0.008, 20]} />
        <meshPhysicalMaterial color="#8a8a8c" metalness={0.1} roughness={0.4} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* Flash + mic, the small dot near the bottom-right of the island */}
      <mesh
        position={[islandCX - 11 * MM, islandCY - 9 * MM, islandZ - 0.027]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[lensR * 0.4, lensR * 0.4, 0.007, 20]} />
        <meshPhysicalMaterial color="#3a3a2e" metalness={0.3} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Screen — dark glass with a faint accent-tinted glow, like the
          display is on and idling on a themed background. Rounded to match
          the body's own corner radius instead of a plain rectangle. */}
      <mesh geometry={screenGeometry} position={[0, 0, BODY_D / 2 + 0.001]}>
        <meshPhysicalMaterial
          color="#0a0a0c"
          metalness={0}
          roughness={0.22}
          clearcoat={0.6}
          clearcoatRoughness={0.15}
          emissive={new THREE.Color(accentHex)}
          emissiveIntensity={0.14}
        />
      </mesh>

      {/* Dynamic Island — a true pill/stadium shape (radius = half its own
          height), not a plain rectangle. A flat planeGeometry here read as
          a sharp-cornered black bar instead of the fully-rounded capsule
          on the real device. Sits closer to the top edge and wider than
          the first pass, which read as too small and too low. */}
      <mesh position={[0, SCREEN_H / 2 - 6.6 * MM, BODY_D / 2 + 0.003]}>
        <shapeGeometry args={[roundedRectShape(13.5 * MM, 3.8 * MM, 1.9 * MM), 20]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>

      {/* Sits between the screen glass (z +0.001) and the Dynamic Island
          (z +0.003) so the island still reads as a cutout punched through
          the image, matching the real device. */}
      <Suspense fallback={null}>
        <ScreenContent
          activeIndex={activeIndex}
          z={BODY_D / 2 + 0.002}
          width={SCREEN_W}
          height={SCREEN_H}
          radius={SCREEN_R}
        />
      </Suspense>
    </group>
  );
}

export default PhoneModel;
