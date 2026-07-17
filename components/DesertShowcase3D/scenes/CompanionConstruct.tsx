"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { desertFlightProgress } from "../../store";
import { FEATURES, ACCENT_HEX } from "../../FeatureShowcase/featuresData";
import { presence } from "../sceneVisibility";
import { featureAnchor } from "../flightPath";
import { prng } from "../prng";

interface CompanionConstructProps {
  dustParticleCount: number;
}

const FEATURE_INDEX = 3; // Companion
// The one small per-feature accent touch in the 3D scene — just the
// rover's own indicator light, not the environment.
const ACCENT = ACCENT_HEX[FEATURES[FEATURE_INDEX].accent] ?? "#e8b478";
const ANCHOR = featureAnchor(FEATURE_INDEX, -2.4, 0);

const WHEEL_POSITIONS: [number, number][] = [
  [0.22, 0.13],
  [0.22, -0.13],
  [-0.22, 0.13],
  [-0.22, -0.13],
];

// A small rover/equipment companion — boxy chassis, a tilted solar
// panel, a slim antenna, one soft indicator light, and a few dust motes
// settling near its wheels. Replaces the old sci-fi particle-dissolving
// human figure: "a companion machine," literally present on the
// surface rather than an abstract holographic form.
export default function CompanionConstruct({ dustParticleCount }: CompanionConstructProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const panelMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const wheelMatRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const antennaMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const dustRef = useRef<THREE.Points>(null);
  const dustMatRef = useRef<THREE.PointsMaterial>(null);

  const dustOrigins = useMemo(() => {
    const arr = new Float32Array(dustParticleCount * 3);
    for (let i = 0; i < dustParticleCount; i++) {
      const wheel = WHEEL_POSITIONS[i % WHEEL_POSITIONS.length];
      arr[i * 3] = wheel[0] + (prng(i * 9 + 1) - 0.5) * 0.25;
      arr[i * 3 + 1] = 0.02 + prng(i * 9 + 2) * 0.18;
      arr[i * 3 + 2] = wheel[1] + (prng(i * 9 + 3) - 0.5) * 0.25;
    }
    return arr;
  }, [dustParticleCount]);
  const dustPhases = useMemo(() => {
    const arr = new Float32Array(dustParticleCount);
    for (let i = 0; i < dustParticleCount; i++) arr[i] = prng(i * 9 + 4) * Math.PI * 2;
    return arr;
  }, [dustParticleCount]);

  useFrame(({ clock }) => {
    const p = presence(FEATURE_INDEX, desertFlightProgress.value);
    const group = groupRef.current;
    if (group) {
      group.visible = p > 0.01;
      group.position.copy(ANCHOR);
      group.scale.setScalar(THREE.MathUtils.lerp(0.85, 1, p));
    }

    if (bodyMatRef.current) bodyMatRef.current.opacity = p;
    if (panelMatRef.current) panelMatRef.current.opacity = p;
    if (antennaMatRef.current) antennaMatRef.current.opacity = p;
    wheelMatRefs.current.forEach((mat) => {
      if (mat) mat.opacity = p;
    });

    const elapsed = clock.getElapsedTime();
    const blink = 0.6 + Math.sin(elapsed * 1.1) * 0.4;
    if (lightMatRef.current) lightMatRef.current.opacity = p;
    if (lightRef.current) lightRef.current.intensity = p * blink * 0.8;

    const dust = dustRef.current;
    if (dust) {
      const attr = dust.geometry.attributes.position;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < dustParticleCount; i++) {
        const phase = dustPhases[i];
        // A slow settle-and-drift rather than a real kicked-up puff —
        // "occasional dust lifted by invisible motion... almost
        // unnoticeable," not an active dust cloud.
        arr[i * 3 + 1] = dustOrigins[i * 3 + 1] + Math.sin(elapsed * 0.25 + phase) * 0.05 + 0.03;
        arr[i * 3] = dustOrigins[i * 3] + Math.sin(elapsed * 0.18 + phase * 1.3) * 0.04;
        arr[i * 3 + 2] = dustOrigins[i * 3 + 2] + Math.cos(elapsed * 0.2 + phase) * 0.04;
      }
      attr.needsUpdate = true;
    }
    if (dustMatRef.current) dustMatRef.current.opacity = p * 0.35;
  });

  return (
    <group ref={groupRef}>
      {/* Chassis. */}
      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[0.4, 0.18, 0.28]} />
        <meshStandardMaterial ref={bodyMatRef} color="#c7c8cc" roughness={0.55} metalness={0.3} transparent opacity={0} />
      </mesh>

      {/* Tilted solar panel. */}
      <mesh position={[0, 0.36, 0]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.34, 0.015, 0.2]} />
        <meshStandardMaterial ref={panelMatRef} color="#23262e" roughness={0.3} metalness={0.6} transparent opacity={0} />
      </mesh>

      {/* Antenna with one soft indicator light. */}
      <mesh position={[0.12, 0.5, -0.08]}>
        <cylinderGeometry args={[0.006, 0.008, 0.36, 6]} />
        <meshStandardMaterial ref={antennaMatRef} color="#8a8c92" roughness={0.4} metalness={0.6} transparent opacity={0} />
      </mesh>
      <mesh position={[0.12, 0.69, -0.08]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial ref={lightMatRef} color={ACCENT} transparent opacity={0} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} position={[0.12, 0.69, -0.08]} color={ACCENT} intensity={0} distance={1.4} decay={2} />

      {/* Wheels. */}
      {WHEEL_POSITIONS.map(([x, z], i) => (
        <mesh
          key={i}
          position={[x, 0.09, z]}
          rotation={[Math.PI / 2, 0, 0]}
          ref={(el) => {
            wheelMatRefs.current[i] = (el?.material as THREE.MeshStandardMaterial) ?? null;
          }}
        >
          <cylinderGeometry args={[0.09, 0.09, 0.05, 12]} />
          <meshStandardMaterial color="#2a2a2c" roughness={0.9} metalness={0.1} transparent opacity={0} />
        </mesh>
      ))}

      {/* Dust motes settling near the wheels. */}
      {dustParticleCount > 0 && (
        <points ref={dustRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[new Float32Array(dustOrigins), 3]} />
          </bufferGeometry>
          <pointsMaterial
            ref={dustMatRef}
            size={0.035}
            color="#d6d0c6"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  );
}
