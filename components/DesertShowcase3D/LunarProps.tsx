"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { prng } from "./prng";
import { FLIGHT_CURVE } from "./flightPath";

interface LunarPropsProps {
  count: number;
}

type PropKind = "rocks" | "crater" | "beacon";

interface RockSpec {
  offset: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}

interface PropSpec {
  kind: PropKind;
  position: [number, number, number];
  rocks: RockSpec[];
  craterRadius: number;
  beaconPhase: number;
}

const ROCK_COLORS = ["#65666b", "#54555a", "#76777f"];
const ROCKS_PER_CLUSTER = 4;

// Sparse foreground dressing scattered just off the flight path — a mix
// of matte rock clusters (the majority), occasional shallow crater
// decals, and rare small beacons, per the brief's "small moon rocks,
// craters, tiny glowing beacons... keep sparse, never clutter." Replaces
// the old sci-fi CrystalClusters.tsx this file used to be: rocks now use
// meshStandardMaterial so they're genuinely lit by Scene.tsx's
// directional sun instead of glowing on their own.
export default function LunarProps({ count }: LunarPropsProps) {
  const beaconLightRefs = useRef<(THREE.PointLight | null)[]>([]);

  const specs = useMemo<PropSpec[]>(() => {
    return Array.from({ length: count }).map((_, i) => {
      const t = 0.08 + prng(i * 23 + 1) * 0.86;
      const point = FLIGHT_CURVE.getPointAt(t);
      const side = (prng(i * 23 + 2) < 0.5 ? -1 : 1) * (12 + prng(i * 23 + 3) * 26);
      // Terrain.tsx's ground sits at roughly world y = -1.6..-1.3 (mesh
      // base -1.6 plus small noise/crater displacement) — -1.0 keeps
      // these reading as grounded without risking clipping under the
      // surface at a crater dip.
      const position: [number, number, number] = [point.x + side, -1.0, point.z];

      const roll = prng(i * 23 + 4);
      const kind: PropKind = roll < 0.62 ? "rocks" : roll < 0.87 ? "crater" : "beacon";

      const rocks: RockSpec[] = Array.from({ length: ROCKS_PER_CLUSTER }).map((_, ri) => {
        const a = (ri / ROCKS_PER_CLUSTER) * Math.PI * 2 + prng(i * 23 + ri * 5 + 10) * 1.4;
        const r = prng(i * 23 + ri * 5 + 11) * 1.1;
        const baseScale = 0.22 + prng(i * 23 + ri * 5 + 12) * 0.4;
        return {
          offset: [Math.cos(a) * r, baseScale * 0.4, Math.sin(a) * r],
          scale: [
            baseScale * (0.8 + prng(i * 23 + ri * 5 + 13) * 0.5),
            baseScale * (0.7 + prng(i * 23 + ri * 5 + 14) * 0.5),
            baseScale * (0.8 + prng(i * 23 + ri * 5 + 15) * 0.5),
          ],
          rotation: [
            prng(i * 23 + ri * 5 + 16) * Math.PI,
            prng(i * 23 + ri * 5 + 17) * Math.PI * 2,
            prng(i * 23 + ri * 5 + 18) * Math.PI,
          ],
        };
      });

      return {
        kind,
        position,
        rocks,
        craterRadius: 1.2 + prng(i * 23 + 20) * 1.6,
        beaconPhase: prng(i * 23 + 21) * Math.PI * 2,
      };
    });
  }, [count]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    beaconLightRefs.current.forEach((light, i) => {
      if (!light) return;
      light.intensity = 0.9 + Math.sin(elapsed * 1.4 + specs[i].beaconPhase) * 0.5;
    });
  });

  return (
    <>
      {specs.map((spec, i) => {
        if (spec.kind === "rocks") {
          return (
            <group key={i} position={spec.position}>
              {spec.rocks.map((rock, ri) => (
                <mesh key={ri} position={rock.offset} rotation={rock.rotation} scale={rock.scale}>
                  <icosahedronGeometry args={[1, 0]} />
                  <meshStandardMaterial color={ROCK_COLORS[(i + ri) % ROCK_COLORS.length]} roughness={1} metalness={0} />
                </mesh>
              ))}
            </group>
          );
        }
        if (spec.kind === "crater") {
          return (
            <mesh key={i} position={spec.position} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[spec.craterRadius, 24]} />
              <meshStandardMaterial color="#141416" roughness={1} metalness={0} transparent opacity={0.5} />
            </mesh>
          );
        }
        // Rare tiny beacon — a slim mast with one soft indicator light,
        // the only place besides the DOM caption chrome where the soft-
        // purple branding accent shows up in the 3D scene.
        return (
          <group key={i} position={spec.position}>
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.025, 0.035, 1.1, 6]} />
              <meshStandardMaterial color="#3a3b40" roughness={0.6} metalness={0.4} />
            </mesh>
            <mesh position={[0, 1.12, 0]}>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshBasicMaterial color="#c9b8ff" toneMapped={false} />
            </mesh>
            <pointLight
              ref={(el) => {
                beaconLightRefs.current[i] = el;
              }}
              position={[0, 1.12, 0]}
              color="#8b7cf0"
              intensity={1}
              distance={2.4}
              decay={2}
            />
          </group>
        );
      })}
    </>
  );
}
