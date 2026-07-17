"use client";

import { useMemo, useRef } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { desertFlightProgress } from "../../store";
import { FEATURES, ACCENT_HEX } from "../../FeatureShowcase/featuresData";
import { presence } from "../sceneVisibility";
import { featureAnchor } from "../flightPath";

extend({ MeshLineGeometry, MeshLineMaterial });

const FEATURE_INDEX = 2; // Planner
// The one small per-feature accent touch in the 3D scene — just each
// stake's small flag, not the cable or the environment.
const ACCENT = ACCENT_HEX[FEATURES[FEATURE_INDEX].accent] ?? "#e8b478";
const ANCHOR = featureAnchor(FEATURE_INDEX, 2.6, 0);

// A handful of waypoint nodes forming a rising path — "a plan you'll
// actually follow" reads more literally as a route with real waypoints
// than an abstract fully-connected graph would.
const NODES: [number, number, number][] = [
  [-2.4, 0.3, 0.4],
  [-1.1, 1.0, -0.6],
  [0.3, 1.6, 0.5],
  [1.7, 1.2, -0.4],
  [2.6, 2.1, 0.3],
];
const STAKE_HEIGHT = 0.55;

interface PlannerConstructProps {
  // Mobile tier (qualityTier.ts's simplifiedConstructs) keeps the stakes
  // and cable but holds the signal-pulse dash pattern still rather than
  // animating it — one less thing constantly repainting on lower-end
  // hardware.
  animated: boolean;
}

// Physical survey stakes connected by a taut cable — a literal route
// staked out on the surface, replacing the old sci-fi neon dashed-line
// map. WebGL line width is effectively fixed at ~1px on most GPUs
// regardless of the `linewidth` material parameter, so this still uses
// meshline (extend()'d above) for real ribbon-width cable geometry; the
// material itself is now a matte metal gray rather than glowing, with
// only a small bright "signal" dash traveling along it as the one
// animated accent.
export default function PlannerConstruct({ animated }: PlannerConstructProps) {
  const groupRef = useRef<THREE.Group>(null);
  const stakeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const flagRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lineMatRefs = useRef<(InstanceType<typeof MeshLineMaterial> | null)[]>([]);
  const { size } = useThree();
  const resolution = useMemo(() => new THREE.Vector2(size.width, size.height), [size]);

  // meshline's own .d.ts types MeshLineGeometry.points as strictly
  // `Float32Array | number[]` (the looser Vector3[]-accepting union is only
  // declared on the setPoints() method, not the property), so segments are
  // built as flat Float32Array pairs to satisfy that rather than fighting it.
  const segments = useMemo(() => {
    const pts: Float32Array[] = [];
    for (let i = 0; i < NODES.length - 1; i++) {
      pts.push(new Float32Array([...NODES[i], ...NODES[i + 1]]));
    }
    return pts;
  }, []);

  useFrame(() => {
    const p = presence(FEATURE_INDEX, desertFlightProgress.value);
    const group = groupRef.current;
    if (group) {
      group.visible = p > 0.01;
      group.position.copy(ANCHOR);
      group.scale.setScalar(THREE.MathUtils.lerp(0.82, 1, p));
    }

    stakeRefs.current.forEach((mesh) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = p;
    });
    flagRefs.current.forEach((mesh) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = p * 0.95;
    });
    lineMatRefs.current.forEach((mat, i) => {
      if (!mat) return;
      mat.opacity = p * 0.7;
      if (!animated) return;
      // A small bright dash traveling along the cable — a signal/status
      // pulse, not the old wide glowing energy dash. Each segment offset
      // slightly so it reads as moving along the whole route.
      mat.dashOffset -= 0.005 + i * 0.0003;
    });
  });

  return (
    <group ref={groupRef}>
      {/* Cable connecting the waypoints, with a small traveling signal dash. */}
      {segments.map((points, i) => (
        <mesh key={i}>
          <meshLineGeometry points={points} />
          <meshLineMaterial
            ref={(el) => {
              lineMatRefs.current[i] = el;
            }}
            args={[{ resolution }]}
            color="#8a8c92"
            lineWidth={0.028}
            transparent
            opacity={0}
            sizeAttenuation={1}
            dashArray={0.16}
            dashRatio={0.86}
            useDash={1}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Survey stakes with a small flag pennant at each waypoint. */}
      {NODES.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh
            position={[0, STAKE_HEIGHT / 2, 0]}
            ref={(el) => {
              stakeRefs.current[i] = el;
            }}
          >
            <cylinderGeometry args={[0.014, 0.02, STAKE_HEIGHT, 6]} />
            <meshStandardMaterial color="#9a9ba0" roughness={0.5} metalness={0.5} transparent opacity={0} />
          </mesh>
          <mesh
            position={[0.055, STAKE_HEIGHT * 0.82, 0]}
            rotation={[0, Math.PI / 2, 0]}
            ref={(el) => {
              flagRefs.current[i] = el;
            }}
          >
            <planeGeometry args={[0.11, 0.075]} />
            <meshBasicMaterial color={ACCENT} transparent opacity={0} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
