"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { roundedRectShape } from "../PhoneShowcase3D/geometry";

// Real-ish hardcover proportions, matching the baked textures' 1200x1780
// design aspect ratio so cover art maps 1:1 without stretching. The closed
// book (idle preview) always stays this portrait shape — it's the fullscreen
// reader (BookReader3D) that switches to a separate landscape variant on
// desktop viewports; see BookReader3D.tsx's own BOOK_W_LANDSCAPE/BOOK_H_LANDSCAPE.
export const BOOK_W = 1.2;
export const BOOK_H = 1.78;
export const BOOK_D = 0.14;
export const BOOK_R = 0.045; // cover corner radius
// Validated in the Phase 0a spike (app/debug-bevel, now removed): a real
// ExtrudeGeometry bevel on this shape's topology does NOT self-intersect at
// this radius-to-depth ratio, so the book's edges are genuinely rounded 3D
// geometry rather than the earlier CSS version's flat-strip approximation.
const BEVEL_R = 0.011;

const LEATHER_DARK = "#1a1108";
const PAGE_CREAM = "#e2c79b";
const SPINE_BAND_POSITIONS = [0.14, 0.32, 0.5, 0.68, 0.86]; // fraction of height, top-down

function useBakedCoverTextures(sources: [string, string]) {
  const textures = useTexture(sources);
  useEffect(() => {
    // .forEach over the array, not a direct mutation of the hook's own
    // return value — matches ScreenContent.tsx's identical, lint-clean
    // pattern (react-hooks/immutability flags mutating a hook's return
    // value directly, but not array elements reached via .forEach).
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
    });
  }, [textures]);
  return textures;
}

/** ShapeGeometry's built-in UVs are raw local vertex x/y, not normalized to
 *  0..1 (three.js pushes `vertex.x, vertex.y` verbatim) — see the identical
 *  fix in PhoneShowcase3D/ScreenContent.tsx. Remapped here to the shape's
 *  own bounding box so a texture actually spans the full face. */
function useNormalizedShapeGeometry(w: number, h: number, r: number) {
  return useMemo(() => {
    const geo = new THREE.ShapeGeometry(roundedRectShape(w, h, r), 24);
    const uv = geo.getAttribute("uv");
    const halfW = w / 2;
    const halfH = h / 2;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (uv.getX(i) + halfW) / w, (uv.getY(i) + halfH) / h);
    }
    uv.needsUpdate = true;
    return geo;
  }, [w, h, r]);
}

// Raised binding-cord bumps across the spine, matching the earlier CSS
// version's SPINE_BAND_POSITIONS bands. Extruded depth runs from local z=0
// to +depth, and with rotation [0, Math.PI/2, 0] that maps to WORLD +X —
// i.e. *inward*, back into the book's own body — not outward toward the
// camera. The previous version placed these barely past the spine surface
// and then extruded the rest of their depth straight into the solid body,
// so ~80% of each bump was buried and invisible. Using rotation
// -Math.PI/2 instead flips the extrude direction to WORLD -X (outward),
// and SPINE_X + SPINE_BUMP_EMBED anchors the bump's inward face slightly
// past the spine's own surface for a solid seam, with the rest of the
// depth standing genuinely proud of it.
const SPINE_BUMP_W = BOOK_D * 0.82;
const SPINE_BUMP_H = 0.085;
const SPINE_BUMP_PROTRUSION = 0.026;
const SPINE_BUMP_EMBED = 0.005;
const SPINE_X = -BOOK_W / 2 - 0.002;

function SpineBumps() {
  const geo = useMemo(() => {
    const shape = roundedRectShape(SPINE_BUMP_W, SPINE_BUMP_H, 0.024);
    return new THREE.ExtrudeGeometry(shape, {
      depth: SPINE_BUMP_PROTRUSION,
      bevelEnabled: true,
      bevelSize: 0.007,
      bevelThickness: 0.007,
      bevelSegments: 3,
      curveSegments: 10,
    });
  }, []);
  return (
    <>
      {SPINE_BAND_POSITIONS.map((f) => (
        <mesh key={f} geometry={geo} rotation={[0, -Math.PI / 2, 0]} position={[SPINE_X + SPINE_BUMP_EMBED, BOOK_H / 2 - f * BOOK_H, 0]} castShadow>
          <meshPhysicalMaterial color="#4a2f16" metalness={0.3} roughness={0.4} clearcoat={0.35} clearcoatRoughness={0.45} />
        </mesh>
      ))}
    </>
  );
}

export default function BookModel() {
  const [frontTex, backTex] = useBakedCoverTextures(["/story-3d/portrait/cover-front.png", "/story-3d/portrait/cover-back.png"]);

  const bodyGeometry = useMemo(() => {
    const shape = roundedRectShape(BOOK_W, BOOK_H, BOOK_R);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: BOOK_D,
      bevelEnabled: true,
      bevelSize: BEVEL_R,
      bevelThickness: BEVEL_R,
      bevelSegments: 4,
      curveSegments: 24,
    });
    geo.translate(0, 0, -BOOK_D / 2);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Slightly inset from the body's own edges so the flat cover art doesn't
  // overlap/z-fight the rounded bevel ring peeking out from underneath.
  const capGeometry = useNormalizedShapeGeometry(BOOK_W - BEVEL_R * 2.4, BOOK_H - BEVEL_R * 2.4, BOOK_R - BEVEL_R);
  const spineGeometry = useNormalizedShapeGeometry(BOOK_D - BEVEL_R * 2.4, BOOK_H - BEVEL_R * 2.4, 0.01);
  const foreEdgeGeometry = spineGeometry;

  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef}>
      {/* Body — the real rounded-bevel 3D shape; mostly hidden under the
          textured overlays below, visible only as the thin curved rim at
          the very perimeter, which is exactly the "flat corners" fix. */}
      <mesh geometry={bodyGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial color="#3a2a1a" metalness={0.25} roughness={0.5} />
      </mesh>

      {/* Front/back cover — positioned at depth/2 + the body's own bevelThickness,
          since ExtrudeGeometry's bevel pushes its flat cap face all the way out
          to `depth + bevelThickness`, not `depth` — placing these at a smaller
          offset buried them behind the body's own (untextured) cap face,
          which is exactly why the cover art wasn't showing. */}
      <mesh geometry={capGeometry} position={[0, 0, BOOK_D / 2 + BEVEL_R + 0.002]}>
        <meshPhysicalMaterial map={frontTex} metalness={0.1} roughness={0.55} clearcoat={0.25} clearcoatRoughness={0.6} />
      </mesh>
      <mesh geometry={capGeometry} rotation={[0, Math.PI, 0]} position={[0, 0, -BOOK_D / 2 - BEVEL_R - 0.002]}>
        <meshPhysicalMaterial map={backTex} metalness={0.1} roughness={0.55} clearcoat={0.25} clearcoatRoughness={0.6} />
      </mesh>

      {/* Spine — left edge, the hinge this cover opens from */}
      <mesh geometry={spineGeometry} rotation={[0, -Math.PI / 2, 0]} position={[-BOOK_W / 2 - 0.002, 0, 0]}>
        <meshPhysicalMaterial color={LEATHER_DARK} metalness={0.2} roughness={0.6} />
      </mesh>
      <SpineBumps />

      {/* Fore-edge — right edge, the stack of page ends */}
      <mesh geometry={foreEdgeGeometry} rotation={[0, Math.PI / 2, 0]} position={[BOOK_W / 2 + 0.002, 0, 0]}>
        <meshPhysicalMaterial color={PAGE_CREAM} metalness={0} roughness={0.85} />
      </mesh>
    </group>
  );
}
