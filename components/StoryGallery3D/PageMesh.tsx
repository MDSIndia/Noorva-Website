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
  /** Mutated by GSAP elsewhere (see StoryGallerySection.tsx) and read here every frame — kept out of React state/props since it updates continuously during a turn. */
  animRef: React.RefObject<PageAnim>;
}

/** A single book page/cover face — flat at rest, curling via CurlPageMaterial
 *  mid-turn. Positioned so its spine-side edge sits at local x=0 in its own
 *  geometry and at world x=-width/2 once mounted, matching BookModel's own
 *  spine-at-left / fore-edge-at-right convention. */
export default function PageMesh({ texture, width, height, animRef }: PageMeshProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height, 48, 2);
    geo.translate(width / 2, 0, 0);
    return geo;
  }, [width, height]);

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
      {/* eslint-disable-next-line react/no-unknown-property -- uMap/uPageWidth/etc. are CurlPageMaterial's own shaderMaterial uniforms, not DOM attributes */}
      <curlPageMaterial ref={materialRef} uMap={texture} uPageWidth={width} side={THREE.FrontSide} transparent />
    </mesh>
  );
}
