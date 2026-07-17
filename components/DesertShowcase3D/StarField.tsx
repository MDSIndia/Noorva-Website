"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { prng } from "./prng";
import { useSoftDotTexture } from "./bakedTextures";

interface StarFieldProps {
  count: number;
  milkyWay: boolean;
}

const RADIUS = 140;
// How closely the starfield follows the camera's own travel — near 1
// means the stars feel essentially infinitely distant (barely any
// parallax, matching how real distant stars behave), while still drifting
// just enough to not read as a flat painted backdrop. Adapted from
// CosmicCanvas.tsx's StarField technique (seeded Points + baked soft-dot
// texture), but that one never needed to move at all (its camera holds
// still) — this one wraps the whole group in a partial camera-follow so
// an endless-feeling sky works across a long flythrough without needing
// an enormous or continuously-regenerated point set.
const FOLLOW = 0.94;
// A slow constant turn on top of the camera-follow above — real stars
// don't drift with your walking, but the sky does turn, if imperceptibly
// slowly; this is what the brief's "very slow star movement" reads as
// without breaking the "distant, barely-parallaxing" feel.
const SKY_ROTATION_SPEED = 0.0025;

const MILKY_WAY_DIR = new THREE.Vector3(1, 0.35, 0.6).normalize();
const MILKY_WAY_UP = new THREE.Vector3(0, 1, 0);
const MILKY_WAY_WIDTH_AXIS = new THREE.Vector3().crossVectors(MILKY_WAY_DIR, MILKY_WAY_UP).normalize();
const MILKY_WAY_THICKNESS_AXIS = new THREE.Vector3().crossVectors(MILKY_WAY_DIR, MILKY_WAY_WIDTH_AXIS).normalize();

export default function StarField({ count, milkyWay }: StarFieldProps) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const milkyMatRef = useRef<THREE.PointsMaterial>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (prng(i * 3 + 0) - 0.5) * RADIUS * 2;
      arr[i * 3 + 1] = (prng(i * 3 + 1) - 0.5) * RADIUS * 1.2 + 20;
      arr[i * 3 + 2] = (prng(i * 3 + 2) - 0.5) * RADIUS * 2;
    }
    return arr;
  }, [count]);

  // A denser, band-shaped cloud of faint points along a fixed diagonal
  // across the sky — not a physically accurate Milky Way, just enough of
  // a concentrated hazy swath to read as one at a glance. `across` is
  // biased toward the band's centerline (power curve on a signed random)
  // so it thins out at the edges instead of having a hard boundary.
  const milkyWayCount = Math.round(count * 0.6);
  const milkyWayPositions = useMemo(() => {
    if (!milkyWay) return null;
    const arr = new Float32Array(milkyWayCount * 3);
    const along = new THREE.Vector3();
    const across = new THREE.Vector3();
    const thickness = new THREE.Vector3();
    const p = new THREE.Vector3();
    for (let i = 0; i < milkyWayCount; i++) {
      const alongT = (prng(i * 11 + 1) - 0.5) * RADIUS * 2.4;
      const acrossRaw = prng(i * 11 + 2) - 0.5;
      const acrossT = Math.sign(acrossRaw) * Math.pow(Math.abs(acrossRaw) * 2, 1.8) * RADIUS * 0.28;
      const thicknessT = (prng(i * 11 + 3) - 0.5) * RADIUS * 0.1;
      along.copy(MILKY_WAY_DIR).multiplyScalar(alongT);
      across.copy(MILKY_WAY_WIDTH_AXIS).multiplyScalar(acrossT);
      thickness.copy(MILKY_WAY_THICKNESS_AXIS).multiplyScalar(thicknessT);
      p.copy(along).add(across).add(thickness);
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y + 20;
      arr[i * 3 + 2] = p.z;
    }
    return arr;
  }, [milkyWay, milkyWayCount]);

  const texture = useSoftDotTexture(32);

  useFrame(({ camera, clock }) => {
    const group = groupRef.current;
    if (!group) return;
    group.position.copy(camera.position).multiplyScalar(FOLLOW);
    group.rotation.y = clock.getElapsedTime() * SKY_ROTATION_SPEED;
    if (matRef.current) {
      matRef.current.opacity = 0.75 + Math.sin(clock.getElapsedTime() * 0.3) * 0.08;
    }
    if (milkyMatRef.current) {
      milkyMatRef.current.opacity = 0.16 + Math.sin(clock.getElapsedTime() * 0.15) * 0.03;
    }
  });

  if (!texture) return null;

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={matRef}
          size={0.42}
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          map={texture}
          alphaTest={0.004}
          sizeAttenuation
        >
          {/* Neutral silver-white — barely a whisper of cool blue, not
              the saturated blue tint the old sci-fi sky used. */}
          <color attach="color" args={[0.96, 0.97, 1.02]} />
        </pointsMaterial>
      </points>
      {milkyWayPositions && (
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[milkyWayPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            ref={milkyMatRef}
            size={0.28}
            transparent
            opacity={0.16}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            map={texture}
            alphaTest={0.004}
            sizeAttenuation
          >
            <color attach="color" args={[0.85, 0.88, 1.0]} />
          </pointsMaterial>
        </points>
      )}
    </group>
  );
}
