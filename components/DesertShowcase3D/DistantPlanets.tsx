"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { prng } from "./prng";

interface DistantPlanetsProps {
  count: number;
}

// Real lit spheres, not flat gradient sprites — a `meshStandardMaterial`
// picks up Scene.tsx's actual directional "sun" + ambient lights for
// free, so each planet shows a genuine day/night terminator from
// whatever angle the camera approaches it at, rather than a baked
// texture that would only look right face-on. Muted, desaturated planet
// tones (dusty tan, cool slate-blue) — distant bodies, not a focal
// point.
const PLANET_COLORS = ["#8a7c68", "#6b7688"];
const FOLLOW = 0.992;

export default function DistantPlanets({ count }: DistantPlanetsProps) {
  const anchorRef = useRef<THREE.Group>(null);

  const specs = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = prng(i * 29 + 1) * Math.PI * 2;
      const radius = 120 + prng(i * 29 + 2) * 60;
      const height = 10 + prng(i * 29 + 3) * 40;
      return {
        position: [Math.sin(angle) * radius, height, Math.cos(angle) * radius] as [number, number, number],
        size: 5 + prng(i * 29 + 4) * 6,
        color: PLANET_COLORS[i % PLANET_COLORS.length],
      };
    });
  }, [count]);

  useFrame(({ camera }) => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    anchor.position.set(camera.position.x * FOLLOW, camera.position.y * FOLLOW, camera.position.z * FOLLOW);
  });

  return (
    <group ref={anchorRef}>
      {specs.map((spec, i) => (
        <mesh key={i} position={spec.position}>
          <sphereGeometry args={[spec.size, 24, 24]} />
          <meshStandardMaterial color={spec.color} roughness={1} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}
