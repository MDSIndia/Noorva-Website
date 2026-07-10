"use client";

import { useEffect, useState } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import Scene from "./Scene";
import PageMesh, { type PageAnim } from "./PageMesh";
import { BOOK_W as PORTRAIT_W, BOOK_H as PORTRAIT_H } from "./BookModel";

// The closed book (idle preview, BookModel.tsx) always stays portrait —
// only the fullscreen reader switches shape, landscape on desktop viewports
// and portrait on narrow/mobile ones, matching each baked texture set's own
// design aspect so cover/page art maps 1:1 without stretching.
const LANDSCAPE_W = 1.78;
const LANDSCAPE_H = 1.1;

// Tailwind's own `md:` breakpoint (768px) — matches the desktop/mobile split
// already used elsewhere in this section (e.g. the preview wrapper's own
// h-[...] md:h-[...] sizing in StoryGallerySection.tsx).
const DESKTOP_QUERY = "(min-width: 768px)";

// How much of the full cover width/height the turning page actually
// occupies — a real book's pages sit recessed a little from the cover's
// top/bottom/fore-edge (bound flush only at the spine), giving a diary-like
// inset rather than the page exactly filling the cover's own outline.
const PAGE_INSET = 0.93;

// Index 0 = cover, 1..N = chapters — same ordering as storyChapters plus the
// cover, mirroring TOTAL_PAGES in StoryGallerySection.tsx.
const PORTRAIT_PAGE_SOURCES = [
  "/story-3d/portrait/cover-front.png",
  "/story-3d/portrait/page-1.png",
  "/story-3d/portrait/page-2.png",
  "/story-3d/portrait/page-3.png",
  "/story-3d/portrait/page-4.png",
  "/story-3d/portrait/page-5.png",
  "/story-3d/portrait/page-6.png",
  "/story-3d/portrait/page-7.png",
  "/story-3d/portrait/page-8.png",
];
const LANDSCAPE_PAGE_SOURCES = [
  "/story-3d/landscape/cover-front.png",
  "/story-3d/landscape/page-1.png",
  "/story-3d/landscape/page-2.png",
  "/story-3d/landscape/page-3.png",
  "/story-3d/landscape/page-4.png",
  "/story-3d/landscape/page-5.png",
  "/story-3d/landscape/page-6.png",
  "/story-3d/landscape/page-7.png",
  "/story-3d/landscape/page-8.png",
];

/** Reads the current desktop/mobile breakpoint reactively, so resizing the
 *  window (e.g. rotating a tablet, or a desktop window dragged narrow)
 *  actually swaps the reader's orientation rather than freezing whatever was
 *  true at mount. Lazily initialized off matchMedia directly (not a
 *  null-then-effect dance) since this component only ever mounts
 *  client-side, after a user click — never part of the server-rendered HTML,
 *  so there's no hydration-mismatch risk to guard against. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mql.matches);
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

interface BookReaderPagesProps {
  underIndex: number;
  overIndex: number;
  underAnimRef: React.RefObject<PageAnim>;
  overAnimRef: React.RefObject<PageAnim>;
  isDesktop: boolean;
}

function BookReaderPages({ underIndex, overIndex, underAnimRef, overAnimRef, isDesktop }: BookReaderPagesProps) {
  const textures = useTexture(isDesktop ? LANDSCAPE_PAGE_SOURCES : PORTRAIT_PAGE_SOURCES);
  useEffect(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
    });
  }, [textures]);

  const width = isDesktop ? LANDSCAPE_W : PORTRAIT_W;
  const height = isDesktop ? LANDSCAPE_H : PORTRAIT_H;

  return (
    <>
      <PageMesh texture={textures[underIndex]} width={width} height={height} inset={PAGE_INSET} animRef={underAnimRef} />
      <PageMesh texture={textures[overIndex]} width={width} height={height} inset={PAGE_INSET} animRef={overAnimRef} />
    </>
  );
}

interface BookReader3DProps extends Omit<BookReaderPagesProps, "isDesktop"> {
  frameloop?: "always" | "never" | "demand";
  /** Fires once R3F has created its WebGL context and measured its
   *  container — see Scene.tsx's own doc comment. StoryGallerySection.tsx
   *  uses this as the signal that it's now safe to apply the preview-to-
   *  fullscreen zoom's CSS transform without racing R3F's own internal size
   *  measurement. */
  onReady?: () => void;
}

/** The fullscreen page-turning reader — two PageMesh slots (see PageMesh.tsx),
 *  `under` always resting flat showing the destination page (revealed as
 *  `over` curls away), `over` showing whichever page is mid-turn. Mirrors
 *  the exact under/over convention StoryGallerySection.tsx already used for
 *  the CSS version, just re-targeted at WebGL meshes instead of DOM nodes. */
export default function BookReader3D({ underIndex, overIndex, underAnimRef, overAnimRef, frameloop = "always", onReady }: BookReader3DProps) {
  const isDesktop = useIsDesktop();
  const width = isDesktop ? LANDSCAPE_W : PORTRAIT_W;
  const height = isDesktop ? LANDSCAPE_H : PORTRAIT_H;

  return (
    <Scene
      frameloop={frameloop}
      // A low floor, not the operating distance — CameraFit takes
      // Math.max(cameraZ, ...dynamically-computed fit distances). Kept well
      // below either variant's actual required distance so the dynamic fit
      // always governs (see the identical comment in BookPreview3D.tsx for
      // the bug this guards against: a floor tuned for one aspect silently
      // overriding a smaller correct distance for another).
      cameraZ={1.2}
      fov={28}
      dpr={[1, 1.5]}
      // Keeps the book's full width AND height inside frame regardless of
      // viewport shape, and re-fits automatically when width/height switch
      // between the portrait/landscape variants.
      fitTarget={{ width, height, margin: 0.08 }}
      onReady={onReady}
    >
      <BookReaderPages underIndex={underIndex} overIndex={overIndex} underAnimRef={underAnimRef} overAnimRef={overAnimRef} isDesktop={isDesktop} />
    </Scene>
  );
}
