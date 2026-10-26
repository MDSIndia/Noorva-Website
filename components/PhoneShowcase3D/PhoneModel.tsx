"use client";

// Restored from the earlier PhoneShowcase3D build (git: a29b728^). Same
// iPhone-proportioned titanium body, back glass, triple-camera island and
// Dynamic Island — but self-animating (a gentle sway with a periodic full
// turn to show off the back) instead of scroll-driven, and with the Noorva
// chat on its screen instead of a feature image.

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import ChatScreen from "./ChatScreen";
import { roundedRectShape } from "./geometry";

// iPhone 16 Pro's real dimensions (149.6 x 71.5 x 8.25mm), normalized so the
// body height lands at 2.42 scene units.
const MM = 2.42 / 149.6;
const BODY_H = 149.6 * MM;
const BODY_W = 71.5 * MM;
const BODY_D = 8.25 * MM;
const BODY_R = 11.5 * MM;
const BEZEL = 2.2 * MM;
const SCREEN_W = BODY_W - BEZEL * 2;
const SCREEN_H = BODY_H - BEZEL * 2;
const SCREEN_R = 9.5 * MM;

const TITANIUM = "#b0b0b4";
const SCALE = 0.95;

const SWAY_AMPLITUDE = 0.22; // rad — front stays readable
const FLOAT_Y_AMPLITUDE = 0.05;
const CYCLE_S = 10;
const DWELL_S = 7;
const TURN_S = CYCLE_S - DWELL_S;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function PhoneModel({ reducedMotion = false, screen = "chat" }: { reducedMotion?: boolean; screen?: "chat" | "video" }) {
  const groupRef = useRef<THREE.Group>(null);
  const entranceRef = useRef(0);

  const bodyGeometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(roundedRectShape(BODY_W, BODY_H, BODY_R), {
      depth: BODY_D,
      bevelEnabled: false,
      curveSegments: 24,
    });
    geo.translate(0, 0, -BODY_D / 2);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const screenGeometry = useMemo(() => new THREE.ShapeGeometry(roundedRectShape(SCREEN_W, SCREEN_H, SCREEN_R), 20), []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Clamp delta: the canvas can sit paused off-screen, and the first frame
    // after resuming reports the whole gap — unclamped it snaps the entrance.
    entranceRef.current = Math.min(1, entranceRef.current + Math.min(delta, 1 / 30) * 1.1);
    const entrance = 1 - Math.pow(1 - entranceRef.current, 3);

    const t = state.clock.getElapsedTime();
    let yaw = 0;
    if (!reducedMotion) {
      const p = t % CYCLE_S;
      const turn = p > DWELL_S ? easeInOutCubic((p - DWELL_S) / TURN_S) * Math.PI * 2 : 0;
      yaw = Math.sin(t * 0.7) * SWAY_AMPLITUDE + turn;
    }
    group.rotation.y = yaw;
    group.rotation.x = reducedMotion ? 0 : Math.sin(t * 0.5 + 1) * 0.03;

    group.position.y = (reducedMotion ? 0 : Math.sin(t * 0.5) * FLOAT_Y_AMPLITUDE) - (1 - entrance) * 0.3;
    group.scale.setScalar(THREE.MathUtils.lerp(0.82, 1, entrance) * SCALE);
  });

  // Triple-camera island: Ultra Wide + Wide stacked on the left, Telephoto
  // centered on the right, in a squircle housing with LiDAR and flash.
  const lensR = 4.5 * MM;
  const lensColX = 7.2 * MM;
  const lensColHalfY = 7.2 * MM;
  const lensTeleX = 5.3 * MM;
  const lensPositions: [number, number][] = [
    [lensColX, lensColHalfY],
    [lensColX, -lensColHalfY],
    [-lensTeleX, 0],
  ];
  const islandSize = 29 * MM;
  const islandCX = BODY_W / 2 - 5.0 * MM - islandSize / 2;
  const islandCY = BODY_H / 2 - 5.2 * MM - islandSize / 2;
  const islandZ = -BODY_D / 2 - 0.01;

  const islandGeometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(roundedRectShape(islandSize, islandSize, islandSize * 0.34), {
      depth: 0.026,
      bevelEnabled: false,
      curveSegments: 16,
    });
    geo.translate(0, 0, -0.026);
    return geo;
  }, [islandSize]);

  return (
    <group ref={groupRef}>
      <pointLight position={[0, 0, 1.4]} color="#00d4ff" distance={5} decay={2} intensity={1.4} />

      {/* Body / frame — polished titanium rail */}
      <mesh geometry={bodyGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial color={TITANIUM} metalness={0.95} roughness={0.18} reflectivity={0.8} />
      </mesh>

      {/* Back glass — satin, less glossy than the rail */}
      <mesh position={[0, 0, -BODY_D / 2 - 0.001]}>
        <shapeGeometry args={[roundedRectShape(BODY_W - 0.015, BODY_H - 0.015, BODY_R - 0.01), 20]} />
        <meshPhysicalMaterial color="#1c1c1e" metalness={0.15} roughness={0.62} clearcoat={0.15} clearcoatRoughness={0.6} />
      </mesh>

      <mesh geometry={islandGeometry} position={[islandCX, islandCY, islandZ]} castShadow>
        <meshPhysicalMaterial color="#141416" metalness={0.5} roughness={0.5} />
      </mesh>
      {lensPositions.map(([dx, dy], i) => (
        <group key={i} position={[islandCX + dx, islandCY + dy, islandZ - 0.03]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[lensR * 1.22, lensR * 1.22, 0.01, 32]} />
            <meshPhysicalMaterial color="#5a5a5e" metalness={0.95} roughness={0.22} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.004, 0]}>
            <cylinderGeometry args={[lensR, lensR, 0.012, 32]} />
            <meshPhysicalMaterial color="#0a0a0b" metalness={0.85} roughness={0.2} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.005, 0]}>
            <cylinderGeometry args={[lensR * 0.6, lensR * 0.6, 0.006, 32]} />
            <meshPhysicalMaterial color="#050506" metalness={0.9} roughness={0.05} clearcoat={1} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      <mesh position={[islandCX - 11 * MM, islandCY + 9 * MM, islandZ - 0.028]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[lensR * 0.55, lensR * 0.55, 0.008, 20]} />
        <meshPhysicalMaterial color="#8a8a8c" metalness={0.1} roughness={0.4} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[islandCX - 11 * MM, islandCY - 9 * MM, islandZ - 0.027]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[lensR * 0.4, lensR * 0.4, 0.007, 20]} />
        <meshPhysicalMaterial color="#3a3a2e" metalness={0.3} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Screen glass (shows through until the chat texture is ready) */}
      <mesh geometry={screenGeometry} position={[0, 0, BODY_D / 2 + 0.001]}>
        <meshPhysicalMaterial color="#0a0a0c" metalness={0} roughness={0.22} clearcoat={0.6} clearcoatRoughness={0.15} />
      </mesh>

      {/* Chat UI — between the glass (z +0.001) and the Dynamic Island (z +0.003) */}
      <ChatScreen variant={screen} z={BODY_D / 2 + 0.002} width={SCREEN_W} height={SCREEN_H} radius={SCREEN_R} />

      {/* Dynamic Island — a true stadium shape */}
      <mesh position={[0, SCREEN_H / 2 - 6.6 * MM, BODY_D / 2 + 0.003]}>
        <shapeGeometry args={[roundedRectShape(13.5 * MM, 3.8 * MM, 1.9 * MM), 20]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>
    </group>
  );
}
