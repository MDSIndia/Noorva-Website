"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Scene from "./Scene";
import BookModel, { BOOK_W, BOOK_H } from "./BookModel";

function SpinningBook({ spinRef }: { spinRef: React.RefObject<boolean> }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current && spinRef.current) ref.current.rotation.y += delta * 0.35;
  });
  return (
    <group ref={ref}>
      <BookModel />
    </group>
  );
}

/** The small idly-rotating book shown before it's opened — a real WebGL
 *  mesh (see BookModel.tsx) instead of the earlier CSS-3D-transform box, so
 *  its edges are genuinely rounded rather than a flat-strip approximation. */
export default function BookPreview3D() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  // A ref, not state — only ever read inside useFrame, so there's no need
  // to trigger a re-render (and a plain useEffect setState would anyway,
  // since matchMedia isn't available during SSR and can't be read at
  // initial-state time without a hydration mismatch). Matches
  // CosmicBackground.tsx's existing prefers-reduced-motion convention — a
  // continuous 360deg auto-spin is exactly the kind of motion that setting
  // exists to opt out of.
  const spinRef = useRef(true);

  useEffect(() => {
    spinRef.current = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "200px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="h-full w-full">
      <Scene 
        frameloop={inView ? "always" : "never"}
        // A low floor, not the operating distance — CameraFit takes
        // Math.max(cameraZ, ...dynamically-computed fit distances), so this
        // only matters as a fallback for a degenerate near-zero fitTarget.
        // 3.4 was the old fixed (no-fitTarget) distance tuned for the
        // portrait book; left in place after adding fitTarget below, it was
        // now LARGER than the landscape book's actual required distance and
        // silently won that Math.max, pushing the camera too far back and
        // rendering the book far smaller than the fit's own margin intended.
        cameraZ={1.2}
        fov={30}
        // The book is now landscape (wider than tall) while its preview
        // wrapper's own aspect ratio only approximates that — fitTarget
        // recomputes the camera distance every frame instead of relying on
        // a fixed cameraZ/fov tuned for one exact aspect, matching the
        // fullscreen reader's own CameraFit usage.
        fitTarget={{ width: BOOK_W, height: BOOK_H, margin: 0.14 }}
      >
        <SpinningBook spinRef={spinRef} />
      </Scene>
    </div>
  );
}
