"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { prng } from "./prng";

interface MeteorShowerProps {
  poolSize: number;
}

// Horizontal streak alpha map — a bright tapered tail fading to nothing at
// the trailing end.
function useStreakTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const w = 128;
    const h = 8;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.85, "rgba(255,255,255,0.9)");
    gradient.addColorStop(1, "rgba(255,255,255,1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

// Seconds per meteor's spawn -> travel -> reset loop, staggered per-
// instance via spec.delay. Longer than the old sci-fi version's 6s — the
// brief wants these rare and subtle, an occasional detail rather than an
// actual "shower."
const CYCLE = 15;

// A small object-pool of streak quads — deterministic seeded spawn timing
// (never Math.random() during render), each looping through its own
// travel arc positioned relative to the camera every frame, so meteors
// keep appearing regardless of how far the camera has flown without
// needing world-space bookkeeping.
export default function MeteorShower({ poolSize }: MeteorShowerProps) {
  const texture = useStreakTexture();
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  const specs = useMemo(() => {
    return Array.from({ length: poolSize }).map((_, i) => ({
      seedX: (prng(i * 5 + 1) - 0.5) * 90,
      seedY: 18 + prng(i * 5 + 2) * 20,
      seedZ: (prng(i * 5 + 3) - 0.5) * 90,
      dirX: -0.6 - prng(i * 5 + 4) * 0.6,
      delay: prng(i * 5 + 5) * CYCLE,
      length: 3 + prng(i * 5 + 6) * 4,
    }));
  }, [poolSize]);

  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    specs.forEach((spec, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const local = ((t + spec.delay) % CYCLE) / CYCLE;
      // Visible only in the first half of its cycle; parked the rest.
      const travel = local < 0.5 ? local * 2 : -1;
      if (travel < 0) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      mesh.position.set(
        camera.position.x + spec.seedX + spec.dirX * travel * 30,
        camera.position.y + spec.seedY - travel * 14,
        camera.position.z + spec.seedZ
      );
      mesh.quaternion.copy(camera.quaternion);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(travel * Math.PI) * 0.55;
    });
  });

  if (!texture) return null;

  return (
    <>
      {specs.map((spec, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          visible={false}
        >
          <planeGeometry args={[spec.length, 0.1]} />
          <meshBasicMaterial
            map={texture}
            color="#eef2fb"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
}
