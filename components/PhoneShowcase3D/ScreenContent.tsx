"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { phoneShowRotation } from "../store";
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

export default function ScreenContent({ activeIndex, z, width, height, radius }: ScreenContentProps) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  // Separate from the material itself so gsap can tween a plain object and
  // useFrame below paints it every frame, combined with the rotation-based
  // facing fade — matches the crossfade envelope pattern used elsewhere in
  // this scene (see PhoneModel's pulse/entrance refs).
  const crossfade = useRef({ opacity: 1 });
  const isFirstRun = useRef(true);

  const textures = useTexture(useMemo(() => FEATURES.map((f) => f.screenImage), []));

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
    const shapeAspect = width / height;
    textures.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      applyCoverUV(texture, shapeAspect);
    });
  }, [textures, width, height]);

  // Premium dissolve on every feature change — skipped on mount.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    gsap.fromTo(crossfade.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power3.out" });
  }, [activeIndex]);

  // Faded by hand instead of relying on backface culling: once the phone's
  // rotation carries the screen past 90°, this mesh would otherwise still
  // be visible (mirrored) through the back.
  useFrame(() => {
    const mat = materialRef.current;
    if (!mat) return;
    const rad = THREE.MathUtils.degToRad(phoneShowRotation.value);
    const facing = Math.max(0, Math.cos(rad));
    mat.opacity = facing * crossfade.current.opacity;
  });

  return (
    <mesh geometry={geometry} position={[0, 0, z]}>
      <meshBasicMaterial ref={materialRef} map={textures[activeIndex]} transparent toneMapped={false} />
    </mesh>
  );
}
