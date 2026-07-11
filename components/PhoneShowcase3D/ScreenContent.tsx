"use client";

import { useEffect, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { FEATURES } from "../FeatureShowcase/featuresData";
import { roundedRectShape } from "./geometry";

interface ScreenContentProps {
  activeIndex: number;
  z: number;
  /** Real screen dimensions/corner radius, in the same scene units as the
   *  phone body — passed down from PhoneModel so this mesh always traces
   *  the exact same outline as the screen glass beneath it, rather than an
   *  independently-guessed size that can drift out of alignment. */
  width: number;
  height: number;
  radius: number;
}

/** Crops (rather than stretches) a texture to fill a `shapeAspect`-ratio
 *  rectangle, the mesh equivalent of CSS `object-fit: cover`. Needed
 *  because ShapeGeometry's generated UVs span 0..1 across the shape's own
 *  bounding box regardless of the source image's own aspect ratio. */
function applyCoverUV(texture: THREE.Texture, shapeAspect: number) {
  const image = texture.image as { width: number; height: number } | undefined;
  if (!image || !image.width || !image.height) return;
  const imageAspect = image.width / image.height;
  texture.matrixAutoUpdate = false;
  if (imageAspect > shapeAspect) {
    const scale = shapeAspect / imageAspect;
    texture.repeat.set(scale, 1);
    texture.offset.set((1 - scale) / 2, 0);
  } else {
    const scale = imageAspect / shapeAspect;
    texture.repeat.set(1, scale);
    texture.offset.set(0, (1 - scale) / 2);
  }
  texture.updateMatrix();
}

// Each PhoneModel instance now represents exactly one fixed feature for its
// whole lifetime (PhoneShowcase3D.tsx mounts/unmounts a whole new instance
// per carousel slot instead of swapping content on a single persistent
// phone), so this only ever needs to load and show its own one texture —
// no in-place crossfade, no rotation-based facing fade, both of which only
// existed to support the old single-persistent-phone model.
export default function ScreenContent({ activeIndex, z, width, height, radius }: ScreenContentProps) {
  // Wrapped in an array — react-hooks/immutability forbids mutating a
  // hook's own return value directly, but not properties reached by
  // iterating an array the hook returned; matches the identical workaround
  // already established in BookModel.tsx's useBakedCoverTextures.
  const [texture] = useTexture([FEATURES[activeIndex].screenImage]);

  const geometry = useMemo(() => {
    const geo = new THREE.ShapeGeometry(roundedRectShape(width, height, radius), 24);
    // ShapeGeometry's built-in UVs are just the raw local vertex x/y (three.js
    // pushes `vertex.x, vertex.y` verbatim, not normalized) — since this
    // shape is centered on the origin, that leaves half its UVs negative,
    // which the texture's default ClampToEdge wrap collapses into a smeared
    // single-pixel edge instead of showing the image. Remap to the shape's
    // own bounding box so UV (0,0)..(1,1) actually spans the full rect.
    const uv = geo.getAttribute("uv");
    const halfW = width / 2;
    const halfH = height / 2;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (uv.getX(i) + halfW) / width, (uv.getY(i) + halfH) / height);
    }
    uv.needsUpdate = true;
    return geo;
  }, [width, height, radius]);

  useEffect(() => {
    [texture].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      applyCoverUV(t, width / height);
    });
  }, [texture, width, height]);

  return (
    <mesh geometry={geometry} position={[0, 0, z]}>
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}
