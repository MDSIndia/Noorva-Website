"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { roundedRectShape } from "../PhoneShowcase3D/geometry";

// Real-ish hardcover proportions, matching the baked cover textures' 1200x1780
// design aspect ratio so cover art maps 1:1 without stretching. This is the
// idle preview's own closed-book shape — the fullscreen reading experience
// is now StoryCinematic.tsx's DOM-based slide sequence, not a WebGL page-curl
// reader, so nothing else derives its own dimensions from this anymore.
export const BOOK_W = 1.2;
export const BOOK_H = 1.78;
export const BOOK_D = 0.32; // total closed thickness — two rigid boards sandwiching a recessed page block
export const BOOK_R = 0.045; // cover board corner radius — the page block itself uses a much sharper PAGE_R, below
// Validated in the Phase 0a spike (app/debug-bevel, now removed): a real
// ExtrudeGeometry bevel on this shape's topology does NOT self-intersect at
// this radius-to-size ratio, so the book's edges are genuinely rounded 3D
// geometry rather than a CSS/flat-strip approximation.
const BEVEL_R = 0.011;

const LEATHER_DARK = "#1a1108";
const PAGE_CREAM = "#e2c79b";
const SPINE_BAND_POSITIONS = [0.14, 0.32, 0.5, 0.68, 0.86]; // fraction of height, top-down

// A premium hardcover's actual cross-section: two genuinely thick rigid
// boards (not a flat texture cap standing in for "cover") sandwiching a
// distinctly smaller, recessed page block. The board oversails the page
// block on the fore-edge and top/bottom (the "square", in bookbinding
// terms) but stays flush at the spine, where the pages are actually bound.
const COVER_THICKNESS = 0.05; // each board's own real thickness
const COVER_OVERHANG = 0.034; // how far the board oversails the page block on 3 of its 4 edges
const PAGE_R = 0.014; // sharp compared to the board's own rounded BOOK_R — real page stacks don't get a soft bevel
const PAGE_D = BOOK_D - COVER_THICKNESS * 2;
const PAGE_W = BOOK_W - COVER_OVERHANG; // recessed only on the fore-edge — flush at the spine
const PAGE_H = BOOK_H - COVER_OVERHANG * 2; // recessed both top (head) and bottom (tail)

// The spine's own small outward ridge, genuinely connecting the two boards
// (rather than a flat decorative cap standing in front of one continuous
// body). Its own corner radius is deliberately conservative — SPINE_BUMP's
// r=0.024 at a similarly small cross-section is already proven safe
// elsewhere in this file; BOOK_R itself would be a much larger radius-to-
// size ratio here and risks the bevel self-intersection noted above.
const SPINE_THICKNESS = 0.024;
const SPINE_R = 0.024;

// A soft crease a short distance in from the spine, where the flexible
// hinge paper meets the rigid board on a real hardcover — never a hard
// mechanical edge right at the spine itself.
const HINGE_OFFSET = 0.11;
const HINGE_W = 0.05;

function useBakedCoverTextures(sources: [string, string]) {
  const textures = useTexture(sources);
  useEffect(() => {
    // .forEach over the array, not a direct mutation of the hook's own
    // return value — matches ScreenContent.tsx's identical, lint-clean
    // pattern (react-hooks/immutability flags mutating a hook's return
    // value directly, but not array elements reached via .forEach).
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      // Without this, the cover reads fine face-on but the smaller text
      // (eyebrow, chapter count) dissolves into an illegible blur the
      // instant the book turns to an oblique angle — default texture
      // filtering only samples along the screen-space minor axis, and a
      // cover viewed edge-on has one axis compressed far more than the
      // other. Anisotropic filtering samples along the actual view
      // direction instead, which is exactly the case a constantly-
      // rotating book preview hits on every single frame.
      t.anisotropy = 16;
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

/** Evenly-spaced page-edge lines — each one the gap between individual
 *  sheets in the page block, not a single smooth cream slab. Two earlier
 *  attempts missed in opposite directions: randomized column alpha plus
 *  heavier bands read as coarse, irregular ribbing at this texture's scale;
 *  a plain fine hairline pattern was too high-frequency for the page
 *  block's actual on-screen size and got mipmapped away to nearly nothing.
 *  This draws a grid (lines both ways) so it reads clearly regardless of
 *  which local axis ends up mapped to which UV channel on a given face,
 *  with a low repeat count and bold contrast so individual lines survive
 *  minification instead of dissolving into a flat wash. Guarded for SSR the
 *  same way CosmicCanvas.tsx's own canvas-texture helper is, since this
 *  component isn't wrapped in a client-only dynamic import. */
function usePaperEdgeTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = PAGE_CREAM;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "rgba(110,82,48,0.55)";
    const step = 8;
    for (let i = 0; i < size; i += step) {
      ctx.fillRect(0, i, size, 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // ExtrudeGeometry's default side-wall UVs use the shape's own raw local
    // units (not 0..1-normalized) as U/V — empirically (not just per the
    // spec) confirmed via a diagnostic render that content varying along the
    // texture's own V axis reads as VERTICAL lines on the fore-edge (U maps
    // to the page block's height instead, the opposite of the naive
    // assumption), so the line pattern varies along canvas-Y and only V
    // gets a real repeat count.
    texture.repeat.set(1, 10);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

/** The soft dark crease where a real hardcover's flexible hinge paper meets
 *  the rigid board, a short distance in from the spine — not a hard
 *  mechanical line right at the spine edge itself. */
function useHingeGrooveTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const w = 64;
    const h = 8;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.5, "rgba(0,0,0,0.5)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

// Raised binding-cord bumps across the spine, matching the earlier CSS
// version's SPINE_BAND_POSITIONS bands. Extruded depth runs from local z=0
// to +depth, and with rotation [0, Math.PI/2, 0] that maps to WORLD +X —
// i.e. *inward*, back into the book's own body — not outward toward the
// camera. Using rotation -Math.PI/2 instead flips the extrude direction to
// WORLD -X (outward), and SPINE_X + SPINE_BUMP_EMBED anchors the bump's
// inward face slightly past the spine body's own outer surface for a solid
// seam, with the rest of the depth standing genuinely proud of it.
const SPINE_BUMP_W = BOOK_D * 0.82;
const SPINE_BUMP_H = 0.085;
const SPINE_BUMP_PROTRUSION = 0.026;
const SPINE_BUMP_EMBED = 0.005;
const SPINE_X = -BOOK_W / 2 - SPINE_THICKNESS - 0.002;

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

function HingeGroove() {
  const texture = useHingeGrooveTexture();
  const x = -BOOK_W / 2 + HINGE_OFFSET;
  const h = BOOK_H * 0.92;
  if (!texture) return null;
  return (
    <>
      <mesh position={[x, 0, BOOK_D / 2 + 0.003]}>
        <planeGeometry args={[HINGE_W, h]} />
        <meshBasicMaterial map={texture} transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]} position={[x, 0, -BOOK_D / 2 - 0.003]}>
        <planeGeometry args={[HINGE_W, h]} />
        <meshBasicMaterial map={texture} transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </>
  );
}

export default function BookModel() {
  const [frontTex, backTex] = useBakedCoverTextures(["/story-3d/portrait/cover-front.png", "/story-3d/portrait/cover-back.png"]);
  const paperEdgeTexture = usePaperEdgeTexture();

  // Page block — a real recessed volume (not a flat inset cap standing in
  // for one), sharp-cornered (PAGE_R, not BOOK_R), flush only at the spine
  // (x=-BOOK_W/2, where it's actually bound) and recessed on the fore-edge
  // plus both top and bottom by COVER_OVERHANG. No bevel: real page stacks
  // have a hard edge, unlike the board's own softened corner.
  const coreGeometry = useMemo(() => {
    const shape = roundedRectShape(PAGE_W, PAGE_H, PAGE_R);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: PAGE_D, bevelEnabled: false, curveSegments: 16 });
    geo.translate(-(BOOK_W - PAGE_W) / 2, 0, -PAGE_D / 2);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Front/back boards — genuinely separate rigid volumes, each
  // COVER_THICKNESS deep, sandwiching the (shorter) page block between them
  // rather than one continuous body with a flat texture cap standing in for
  // "cover". Bevel naturally pushes each board's inner cap slightly past
  // the core's own boundary (see the front/back cover-art comment below for
  // the identical, already-proven offset math), sealing the seam with no
  // visible gap.
  const frontBoardGeometry = useMemo(() => {
    const shape = roundedRectShape(BOOK_W, BOOK_H, BOOK_R);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: COVER_THICKNESS,
      bevelEnabled: true,
      bevelSize: BEVEL_R,
      bevelThickness: BEVEL_R,
      bevelSegments: 4,
      curveSegments: 24,
    });
    geo.translate(0, 0, PAGE_D / 2);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const backBoardGeometry = useMemo(() => {
    const shape = roundedRectShape(BOOK_W, BOOK_H, BOOK_R);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: COVER_THICKNESS,
      bevelEnabled: true,
      bevelSize: BEVEL_R,
      bevelThickness: BEVEL_R,
      bevelSegments: 4,
      curveSegments: 24,
    });
    geo.translate(0, 0, -PAGE_D / 2 - COVER_THICKNESS);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Spine — a real connecting volume (not a flat decorative cap) spanning
  // the full BOOK_D so it actually bridges the front and back boards, with
  // its own slight outward ridge matching a real bound hardcover's rounded
  // spine.
  const spineBodyGeometry = useMemo(() => {
    const shape = roundedRectShape(BOOK_D, BOOK_H, SPINE_R);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: SPINE_THICKNESS,
      bevelEnabled: true,
      bevelSize: BEVEL_R,
      bevelThickness: BEVEL_R,
      bevelSegments: 4,
      curveSegments: 16,
    });
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Slightly inset from the boards' own edges so the flat cover art doesn't
  // overlap/z-fight the rounded bevel ring peeking out from underneath.
  const capGeometry = useNormalizedShapeGeometry(BOOK_W - BEVEL_R * 2.4, BOOK_H - BEVEL_R * 2.4, BOOK_R - BEVEL_R);

  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef}>
      {/* Page block — recessed, sharp-cornered, its rim textured with thin
          evenly-spaced hairlines rather than a flat cream slab. Its flat
          caps sit hidden inside the boards and are never visible, so one
          material for the whole geometry is enough. */}
      <mesh geometry={coreGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial color={PAGE_CREAM} map={paperEdgeTexture} metalness={0} roughness={0.88} />
      </mesh>

      {/* Front/back boards — genuinely thick rigid covers, visible mostly
          as the curved bevel rim at the very perimeter once the textured
          art overlays (below) sit on top of their outer faces. */}
      <mesh geometry={frontBoardGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial color="#3a2a1a" metalness={0.25} roughness={0.5} />
      </mesh>
      <mesh geometry={backBoardGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial color="#3a2a1a" metalness={0.25} roughness={0.5} />
      </mesh>

      {/* Front/back cover art — positioned at depth/2 + the board's own
          bevelThickness, since ExtrudeGeometry's bevel pushes its flat cap
          face all the way out to `depth + bevelThickness`, not `depth` —
          placing these at a smaller offset buried them behind the board's
          own (untextured) cap face, which is exactly why the cover art
          wasn't showing. */}
      <mesh geometry={capGeometry} position={[0, 0, BOOK_D / 2 + BEVEL_R + 0.002]}>
        <meshPhysicalMaterial map={frontTex} metalness={0.1} roughness={0.55} clearcoat={0.25} clearcoatRoughness={0.6} />
      </mesh>
      <mesh geometry={capGeometry} rotation={[0, Math.PI, 0]} position={[0, 0, -BOOK_D / 2 - BEVEL_R - 0.002]}>
        <meshPhysicalMaterial map={backTex} metalness={0.1} roughness={0.55} clearcoat={0.25} clearcoatRoughness={0.6} />
      </mesh>

      {/* Spine — the real connecting volume, not a flat cap over an
          otherwise-continuous body (there is no continuous body anymore;
          the boards and page block are genuinely separate). */}
      <mesh geometry={spineBodyGeometry} rotation={[0, -Math.PI / 2, 0]} position={[-BOOK_W / 2, 0, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color={LEATHER_DARK} metalness={0.2} roughness={0.6} />
      </mesh>
      <SpineBumps />
      <HingeGroove />
    </group>
  );
}
