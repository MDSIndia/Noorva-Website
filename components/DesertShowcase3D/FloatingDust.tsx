"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { prng } from "./prng";
import { useSoftDotTexture } from "./bakedTextures";

interface FloatingDustProps {
  count: number;
}

// A small radius, kept close around the camera — distinct from
// StarField.tsx's much larger, near-stationary field. These are meant to
// read as motes drifting near the viewer (real foreground parallax), not
// distant sky, so the follow fraction is lower (more relative motion as
// the camera flies) and the bubble is small enough that individual
// points are visibly passing by rather than a static backdrop.
const RADIUS = 16;
const FOLLOW = 0.88;

export default function FloatingDust({ count }: FloatingDustProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const texture = useSoftDotTexture(24);

  const origins = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (prng(i * 5 + 0) - 0.5) * RADIUS * 2;
      arr[i * 3 + 1] = (prng(i * 5 + 1) - 0.5) * RADIUS * 1.4;
      arr[i * 3 + 2] = (prng(i * 5 + 2) - 0.5) * RADIUS * 2;
    }
    return arr;
  }, [count]);
  const phases = useMemo(() => {
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i++) arr[i] = prng(i * 5 + 3) * Math.PI * 2;
    return arr;
  }, [count]);

  useFrame(({ camera, clock }) => {
    const group = groupRef.current;
    if (!group) return;
    group.position.set(camera.position.x * FOLLOW, camera.position.y * FOLLOW, camera.position.z * FOLLOW);

    const attr = pointsRef.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (attr) {
      const t = clock.getElapsedTime();
      const arr = attr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        const phase = phases[i];
        arr[i * 3] = origins[i * 3] + Math.sin(t * 0.15 + phase) * 0.6;
        arr[i * 3 + 1] = origins[i * 3 + 1] + Math.sin(t * 0.11 + phase * 1.7) * 0.5;
        arr[i * 3 + 2] = origins[i * 3 + 2] + Math.cos(t * 0.13 + phase) * 0.6;
      }
      attr.needsUpdate = true;
    }
    if (matRef.current) {
      matRef.current.opacity = 0.26 + Math.sin(clock.getElapsedTime() * 0.4) * 0.06;
    }
  });

  if (!texture) return null;

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(origins), 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={matRef}
          size={0.07}
          transparent
          opacity={0.26}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          map={texture}
          alphaTest={0.004}
          sizeAttenuation
          color="#d6d0c6"
        />
      </points>
    </group>
  );
}
