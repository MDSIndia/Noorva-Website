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
  const Icon = feature.icon;

  return (
    <Html transform distanceFactor={1.35} position={[0, 0, z]} style={{ pointerEvents: "none" }}>
      <div ref={wrapRef} className="flex flex-col items-center gap-4" style={{ width: 260 }}>
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full border backdrop-blur-xl"
          style={{
            borderColor: `color-mix(in srgb, ${feature.accent} 45%, transparent)`,
            background: "rgba(255,255,255,0.04)",
            boxShadow: `0 0 30px color-mix(in srgb, ${feature.accent} 35%, transparent)`,
          }}
        >
          <Icon className="h-7 w-7" style={{ color: feature.accent }} strokeWidth={1.5} />
        </div>
        <span className="font-playfair text-2xl font-light text-white/95" style={{ letterSpacing: "0.02em" }}>
          {feature.title}
        </span>
      </div>
    </Html>
  );
}
