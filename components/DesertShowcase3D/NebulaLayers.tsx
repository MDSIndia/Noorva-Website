"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { prng } from "./prng";
import { useGlowTexture } from "./bakedTextures";
import { FLIGHT_CURVE } from "./flightPath";

interface NebulaLayersProps {
  count: number;
}

// Pale silver/blue-white — barely-there wisps, not a colored backdrop.
// The old sci-fi version used saturated violet/cyan/magenta; the brief
// explicitly wants nebula "extremely subtle" and the environment
// monochrome, so this is desaturated and dimmed well below what would
// read as a deliberate color feature.
const NEBULA_COLORS = ["#c9d3ea", "#dbe2f2", "#b9c6e6"];

// Large soft additive sprites parked at fixed world positions scattered
// along the flight path (not following the camera, unlike StarField) —
// they pass by like real environmental features the camera flies past,
// rather than an ambient backdrop layer. Deterministic seeded placement
// (never Math.random() during render).
export default function NebulaLayers({ count }: NebulaLayersProps) {
  const texture = useGlowTexture();
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  const specs = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const t = 0.12 + prng(i * 11 + 1) * 0.76;
      const point = FLIGHT_CURVE.getPointAt(t);
      // Pushed much further out (was ±25) and given real depth jitter
      // (was pinned exactly to the curve's own z) — at the original tight
      // spread these sat close enough to the flight path that, combined
      // with AuroraRibbons doing the same thing, they filled most of the
      // frame and additively blended into one flat color wash instead of
      // reading as distinct, distant background features (confirmed via
      // screenshot). Distance-based opacity falloff below is the second
      // half of this fix — belt and suspenders against the flight path
      // ever passing close to one.
      const side = (prng(i * 11 + 2) - 0.5) * 180;
      const depthJitter = (prng(i * 11 + 6) - 0.5) * 90;
      // Kept close to the camera's own eye-level rather than high overhead
      // — CameraRig looks mostly level along the flight curve (only a
      // small continuous roll, no deliberate up/down pitch variation), so
      // anything placed much higher than a few units above camera height
      // sits above the top of frame and is essentially never actually
      // seen (confirmed via screenshot — the sky read as empty at the
      // original 12-38 unit offset).
      const up = 2 + prng(i * 11 + 3) * 9;
      const size = 28 + prng(i * 11 + 4) * 26;
      return {
        basePosition: [point.x + side, point.y + up, point.z + depthJitter] as [number, number, number],
        size,
        color: NEBULA_COLORS[i % NEBULA_COLORS.length],
        driftPhase: prng(i * 11 + 5) * Math.PI * 2,
        // Fixed per-instance roll so repeated uses of the same soft-blob
        // texture don't all read as the literal same shape.
        rotZ: prng(i * 11 + 7) * Math.PI * 2,
      };
    });
  }, [count]);

  useFrame(({ camera, clock }) => {
    specs.forEach((spec, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      mesh.quaternion.copy(camera.quaternion); // billboard toward the camera
      mesh.rotateZ(spec.rotZ);
      mesh.position.set(
        spec.basePosition[0],
        spec.basePosition[1] + Math.sin(clock.getElapsedTime() * 0.05 + spec.driftPhase) * 2,
        spec.basePosition[2]
      );
      // Fades out if the flight path ever happens to pass close to one —
      // these are meant to read as distant atmosphere, never a close,
      // frame-filling wash.
      const dist = mesh.position.distanceTo(camera.position);
      const falloff = THREE.MathUtils.smoothstep(dist, 20, 45);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.055 * falloff;
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
          position={spec.basePosition}
        >
          <planeGeometry args={[spec.size, spec.size]} />
          <meshBasicMaterial
            map={texture}
            color={spec.color}
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
