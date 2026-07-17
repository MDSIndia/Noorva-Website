"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { desertFlightProgress } from "../../store";
import { FEATURES, ACCENT_HEX } from "../../FeatureShowcase/featuresData";
import { presence } from "../sceneVisibility";
import { featureAnchor } from "../flightPath";
import { prng } from "../prng";
import { useGlowTexture } from "../bakedTextures";

interface GuideConstructProps {
  accentParticleCount: number;
  animated: boolean;
}

const FEATURE_INDEX = 0; // Guide
// Kept as the one small per-feature accent touch in the 3D scene (the
// terrain/sky/props otherwise stay strictly monochrome) — mirrors the
// DOM caption's own icon-ring/progress-dot accent so the destination and
// its caption read as one synced identity, "guiding the way" here quite
// literally via the light color.
const ACCENT = ACCENT_HEX[FEATURES[FEATURE_INDEX].accent] ?? "#4fa8d5";
const ANCHOR = featureAnchor(FEATURE_INDEX, 2.6, 0);
const MAST_HEIGHT = 3.4;

// A slender landing beacon rising from the surface — "shows the way,"
// replacing the old sci-fi glowing floating word. A tapered mast, one
// thin ring accent, a small pad at its base, and one soft pulsing light
// at the top with a few dust motes drifting near it.
export default function GuideConstruct({ accentParticleCount, animated }: GuideConstructProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mastMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const padMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const lightMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const dustRef = useRef<THREE.Points>(null);
  const dustMatRef = useRef<THREE.PointsMaterial>(null);
  const glowTexture = useGlowTexture();

  const dustOrigins = useMemo(() => {
    const arr = new Float32Array(accentParticleCount * 3);
    for (let i = 0; i < accentParticleCount; i++) {
      const a = prng(i * 7 + 1) * Math.PI * 2;
      const r = 0.3 + prng(i * 7 + 2) * 0.9;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = MAST_HEIGHT + 0.2 + prng(i * 7 + 3) * 0.8;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, [accentParticleCount]);
  const dustPhases = useMemo(() => {
    const arr = new Float32Array(accentParticleCount);
    for (let i = 0; i < accentParticleCount; i++) arr[i] = prng(i * 7 + 4) * Math.PI * 2;
    return arr;
  }, [accentParticleCount]);

  useFrame(({ clock, camera }) => {
    const p = presence(FEATURE_INDEX, desertFlightProgress.value);
    const group = groupRef.current;
    if (group) {
      group.visible = p > 0.01;
      group.position.copy(ANCHOR);
      group.scale.setScalar(THREE.MathUtils.lerp(0.85, 1, p));
    }

    if (mastMatRef.current) mastMatRef.current.opacity = p;
    if (padMatRef.current) padMatRef.current.opacity = p * 0.85;
    if (ringMatRef.current) ringMatRef.current.opacity = p * 0.6;

    const elapsed = clock.getElapsedTime();
    const pulse = 0.75 + Math.sin(elapsed * 1.6) * 0.25;
    if (lightRef.current) lightRef.current.intensity = p * pulse * 1.6;
    if (lightMatRef.current) lightMatRef.current.opacity = p;
    if (haloRef.current) haloRef.current.quaternion.copy(camera.quaternion); // billboard toward the camera
    if (haloMatRef.current) haloMatRef.current.opacity = p * pulse * 0.6;

    const dust = dustRef.current;
    if (dust && animated) {
      const attr = dust.geometry.attributes.position;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < accentParticleCount; i++) {
        const phase = dustPhases[i];
        arr[i * 3] = dustOrigins[i * 3] + Math.sin(elapsed * 0.3 + phase) * 0.25;
        arr[i * 3 + 1] = dustOrigins[i * 3 + 1] + Math.sin(elapsed * 0.22 + phase * 1.4) * 0.2;
        arr[i * 3 + 2] = dustOrigins[i * 3 + 2] + Math.cos(elapsed * 0.28 + phase) * 0.25;
      }
      attr.needsUpdate = true;
    }
    if (dustMatRef.current) dustMatRef.current.opacity = p * 0.5;
  });

  return (
    <group ref={groupRef}>
      {/* Landing pad. */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 32]} />
        <meshStandardMaterial ref={padMatRef} color="#4a4c52" roughness={0.85} metalness={0.1} transparent opacity={0} />
      </mesh>

      {/* Tapered mast. */}
      <mesh position={[0, MAST_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.07, MAST_HEIGHT, 8]} />
        <meshStandardMaterial ref={mastMatRef} color="#8a8c92" roughness={0.35} metalness={0.7} transparent opacity={0} />
      </mesh>

      {/* Thin ring accent partway up. */}
      <mesh position={[0, MAST_HEIGHT * 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.19, 24]} />
        <meshBasicMaterial ref={ringMatRef} color={ACCENT} transparent opacity={0} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Soft pulsing beacon light at the top. */}
      <mesh position={[0, MAST_HEIGHT, 0]}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshBasicMaterial ref={lightMatRef} color={ACCENT} transparent opacity={0} toneMapped={false} />
      </mesh>
      <mesh ref={haloRef} position={[0, MAST_HEIGHT, 0]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial
          ref={haloMatRef}
          map={glowTexture}
          color={ACCENT}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, MAST_HEIGHT, 0]} color={ACCENT} intensity={0} distance={3.5} decay={2} />

      {/* A few dust motes drifting near the light. */}
      {accentParticleCount > 0 && (
        <points ref={dustRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[new Float32Array(dustOrigins), 3]} />
          </bufferGeometry>
          <pointsMaterial
            ref={dustMatRef}
            size={0.045}
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
