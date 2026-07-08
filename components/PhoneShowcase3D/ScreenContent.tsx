"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { phoneShowRotation } from "../store";
import { FEATURES } from "../FeatureShowcase/featuresData";

interface ScreenContentProps {
  activeIndex: number;
  z: number;
}

export default function ScreenContent({ activeIndex, z }: ScreenContentProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // Separate from the DOM style itself — drei's Html re-renders this div on
  // every prop change, so animating a plain object (and painting it in
  // useFrame below) survives that instead of fighting a fresh element.
  const crossfade = useRef({ opacity: 1, y: 0, blur: 0 });
  const isFirstRun = useRef(true);

  // Premium dissolve on every feature change — skipped on mount.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    gsap.fromTo(
      crossfade.current,
      { opacity: 0, y: 10, blur: 6 },
      { opacity: 1, y: 0, blur: 0, duration: 0.7, ease: "power3.out" }
    );
  }, [activeIndex]);

  // drei's Html `transform` mode positions this DOM node with a real CSS
  // matrix3d matching the phone's 3D rotation, but doesn't hide it once
  // that rotation carries it past 90deg — left alone, the screen label is
  // still readable (mirrored) through the back of the phone. Faded here by
  // hand instead of via backface-visibility, which doesn't take effect
  // through drei's transform pipeline.
  useFrame(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rad = THREE.MathUtils.degToRad(phoneShowRotation.value);
    const facing = Math.max(0, Math.cos(rad));
    const c = crossfade.current;
    el.style.opacity = String(facing * c.opacity);
    el.style.transform = `translateY(${c.y}px)`;
    el.style.filter = `blur(${c.blur}px)`;
  });

  const feature = FEATURES[activeIndex];

  // Real iPhone 16 Pro screen aspect (SCREEN_W/SCREEN_H in PhoneModel.tsx),
  // so the mockup fills the display edge-to-edge instead of floating at an
  // arbitrary size — width chosen empirically against the phone's actual
  // on-screen scale at this scene's distanceFactor.
  return (
    <Html transform distanceFactor={1.35} position={[0, 0, z]} style={{ pointerEvents: "none" }}>
      <div
        ref={wrapRef}
        className="overflow-hidden"
        style={{ width: 330, aspectRatio: "1085.6 / 2349.1", borderRadius: "13%/6%" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed set of public/features assets rendered inside drei's Html, next/image's runtime sizing doesn't apply here */}
        <img
          src={feature.screenImage}
          alt={`${feature.title} app screen`}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>
    </Html>
  );
}
