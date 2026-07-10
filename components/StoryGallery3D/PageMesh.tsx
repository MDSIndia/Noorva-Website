"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "./CurlPageMaterial";

export interface PageAnim {
  /** 0 = resting flat, 1 = fully turned (edge-on/invisible past ~92deg). */
  progress: number;
  /** +1 = forward-turn hinge convention, -1 = backward-turn (mirrors the bend/rotation — see CurlPageMaterial). */
  direction: number;
  /** Crossfade opacity, separate from the geometric turn — lets the two-slot mechanic fade the destination page in independently. */
  opacity: number;
}

interface PageMeshProps {
  texture: THREE.Texture;
  width: number;
  height: number;
  /** Fraction (0-1] of width/height the actual page occupies — real book
   *  pages sit slightly recessed from the cover's top/bottom/fore-edge
   *  (the spine side stays flush, since that's where they're physically
   *  bound), giving a diary-like inset look instead of the page exactly
   *  filling the cover's own outline. Defaults to 1 (no inset). */
  inset?: number;
  /** Mutated by GSAP elsewhere (see StoryGallerySection.tsx) and read here every frame — kept out of React state/props since it updates continuously during a turn. */
  animRef: React.RefObject<PageAnim>;
}

/** A single book page/cover face — flat at rest, curling via CurlPageMaterial
 *  mid-turn. Positioned so its spine-side edge sits at world x=-width/2 (the
 *  book's true spine, using the FULL width/height regardless of inset) —
 *  only the geometry's own size shrinks toward `inset`, so the page stays
 *  bound flush at the spine while gaining a margin on the other three
 *  edges. */
export default function PageMesh({ texture, width, height, inset = 1, animRef }: PageMeshProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pageWidth = width * inset;
  const pageHeight = height * inset;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(pageWidth, pageHeight, 48, 2);
    geo.translate(pageWidth / 2, 0, 0);
    return geo;
  }, [pageWidth, pageHeight]);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uMap.value = texture;
  }, [texture]);

  useFrame(() => {
    const mat = materialRef.current;
    const anim = animRef.current;
    if (!mat || !anim) return;
    mat.uniforms.uProgress.value = anim.progress;
    mat.uniforms.uDirection.value = anim.direction;
    mat.uniforms.uOpacity.value = anim.opacity;
  });

  return (
    <mesh geometry={geometry} position={[-width / 2, 0, 0]}>
      {/* FrontSide, not DoubleSide: once the page curls past edge-on, its
          back should simply vanish (backface-culled) rather than showing
          the same texture mirrored/upside-down through the "back" of the
          page — matches the confirmed scope (no real verso texture needed). */}
      <curlPageMaterial ref={materialRef} uMap={texture} uPageWidth={pageWidth} side={THREE.FrontSide} transparent />
    </mesh>
  );
}
