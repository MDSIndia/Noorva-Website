"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { phoneShowRotation } from "../store";
import { FEATURES } from "../FeatureShowcase/featuresData";
import ScreenContent from "./ScreenContent";

export interface PhoneModelHandle {
  /** Quick decaying scale punch — played whenever the active feature changes. */
  pulse: () => void;
}

interface PhoneModelProps {
  activeIndex: number;
}

// CSS custom properties aren't resolvable inside WebGL materials — this
// mirrors the literal hex values from app/globals.css's :root block.
const ACCENT_HEX: Record<string, string> = {
  "var(--accent-1)": "#7c5cfc",
  "var(--accent-2)": "#4fa8d5",
  "var(--accent-warm)": "#e8b478",
};

// iPhone 16 Pro's real dimensions (149.6 x 71.5 x 8.25mm), normalized so the
// body height lands at 2.42 scene units — every other measurement below is
// derived from this same ratio rather than eyeballed.
const MM = 2.42 / 149.6;
const BODY_H = 149.6 * MM;
const BODY_W = 71.5 * MM;
const BODY_D = 8.25 * MM;
const BODY_R = 11.5 * MM; // corner radius — real iPhones round only the corners
const BEZEL = 2.2 * MM; // slim Pro-class bezel around the display
const SCREEN_W = BODY_W - BEZEL * 2;
const SCREEN_H = BODY_H - BEZEL * 2;
const SCREEN_R = 9.5 * MM;

// Black Titanium — the darkest of the 16 Pro finishes, matching the site's
// own near-black palette instead of the brighter titanium tones. Real
// titanium is a satin/brushed finish, not a glossy one — no clearcoat here.
const TITANIUM = "#2b2b2c";

/** A rectangle rounded only at its four corners — flat edges in between,
 *  unlike RoundedBox's uniformly-rounded "pill" silhouette. This is the
 *  actual shape of a modern iPhone's rail when viewed face-on. */
function roundedRectShape(w: number, h: number, r: number) {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  shape.closePath();
  return shape;
}

const PhoneModel = forwardRef<PhoneModelHandle, PhoneModelProps>(function PhoneModel({ activeIndex }, ref) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseEnvelope = useRef(0); // 0..1, decays back to 0 after pulse() fires
  const entranceRef = useRef(0); // 0..1, eases up once on mount — never resets

  useImperativeHandle(ref, () => ({
    pulse: () => {
      pulseEnvelope.current = 1;
    },
  }));

  // Flat-sided body: a rounded-rect face extruded to the phone's thickness,
  // with a shallow bevel standing in for the polished chamfer along a real
  // titanium rail's edge — RoundedBox's uniform rounding reads as a rounded
  // pebble instead of the slab-with-rounded-corners silhouette of an actual
  // iPhone, which is most of why the earlier version didn't land.
  const bodyGeometry = useMemo(() => {
    const shape = roundedRectShape(BODY_W, BODY_H, BODY_R);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: BODY_D,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.012,
      bevelSegments: 4,
      curveSegments: 20,
    });
    geo.translate(0, 0, -BODY_D / 2);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const screenGeometry = useMemo(() => {
    const shape = roundedRectShape(SCREEN_W, SCREEN_H, SCREEN_R);
    return new THREE.ShapeGeometry(shape, 20);
  }, []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // "Roll in": the very first time this mounts, the phone spins the last
    // stretch into its correct scroll-driven angle instead of just being
    // present — plays once, over about a second, then never again.
    entranceRef.current = Math.min(1, entranceRef.current + delta * 1.1);
    const entrance = 1 - Math.pow(1 - entranceRef.current, 3); // easeOutCubic

    const targetDeg = phoneShowRotation.value;
    const entranceSpinDeg = (1 - entrance) * 130;
    group.rotation.y = THREE.MathUtils.degToRad(targetDeg + entranceSpinDeg);

    // Subtle idle float, layered on top of the scroll-driven rotation —
    // always on, small enough to read as "alive" without looking animated.
    const t = state.clock.getElapsedTime();
    group.position.y = Math.sin(t * 0.55) * 0.045 - (1 - entrance) * 0.35;

    // Decaying pulse: a quick, soft punch right after a feature change,
    // never a hard snap. Combined with the entrance's own scale-up.
    pulseEnvelope.current = Math.max(0, pulseEnvelope.current - delta * 2.2);
    const bump = Math.sin(pulseEnvelope.current * Math.PI) * 0.045;
    const entranceScale = THREE.MathUtils.lerp(0.8, 1, entrance);
    group.scale.setScalar(entranceScale + bump);
  });

  const feature = FEATURES[activeIndex];
  const accentHex = ACCENT_HEX[feature.accent] ?? "#7c5cfc";

  // Triple-camera island — Ultra Wide / Wide / Telephoto arranged in the
  // 16 Pro's diagonal layout, inside a single rounded-square housing.
  const islandCX = BODY_W / 2 - 9.2 * MM;
  const islandCY = BODY_H / 2 - 12.8 * MM;
  const islandZ = -BODY_D / 2 - 0.01;
  const lensR = 4.3 * MM;
  const lensPositions: [number, number][] = [
    [-3.9 * MM, 3.9 * MM],
    [3.9 * MM, 3.9 * MM],
    [-3.9 * MM, -3.9 * MM],
  ];

  return (
    <group ref={groupRef}>
      {/* Body / frame — satin titanium rail, matte rather than glossy. */}
      <mesh geometry={bodyGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial color={TITANIUM} metalness={0.88} roughness={0.52} reflectivity={0.4} />
      </mesh>

      {/* Back glass panel, satin-frosted rather than a glossy mirror */}
      <mesh position={[0, 0, -BODY_D / 2 - 0.001]}>
        <shapeGeometry args={[roundedRectShape(BODY_W - 0.015, BODY_H - 0.015, BODY_R - 0.01), 20]} />
        <meshPhysicalMaterial color="#19191b" metalness={0.2} roughness={0.5} clearcoat={0.25} clearcoatRoughness={0.5} />
      </mesh>

      {/* Camera island housing */}
      <mesh position={[islandCX, islandCY, islandZ]} castShadow>
        <boxGeometry args={[18.5 * MM, 18.5 * MM, 0.022]} />
        <meshPhysicalMaterial color="#131315" metalness={0.55} roughness={0.55} />
      </mesh>
      {lensPositions.map(([dx, dy], i) => (
        <group key={i} position={[islandCX + dx, islandCY + dy, islandZ - 0.013]}>
          <mesh>
            <cylinderGeometry args={[lensR, lensR, 0.013, 32]} />
            <meshPhysicalMaterial color="#0a0a0b" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, -0.009]}>
            <cylinderGeometry args={[lensR * 0.6, lensR * 0.6, 0.006, 32]} />
            <meshPhysicalMaterial color="#050506" metalness={0.9} roughness={0.05} clearcoat={1} />
          </mesh>
        </group>
      ))}
      {/* LiDAR, the fourth dot on the island */}
      <mesh position={[islandCX + 3.9 * MM, islandCY - 3.9 * MM, islandZ - 0.012]}>
        <cylinderGeometry args={[lensR * 0.45, lensR * 0.45, 0.008, 24]} />
        <meshPhysicalMaterial color="#0e0e10" metalness={0.4} roughness={0.45} />
      </mesh>

      {/* Screen — dark glass with a faint accent-tinted glow, like the
          display is on and idling on a themed background. Rounded to match
          the body's own corner radius instead of a plain rectangle. */}
      <mesh geometry={screenGeometry} position={[0, 0, BODY_D / 2 + 0.001]}>
        <meshPhysicalMaterial
          color="#0a0a0c"
          metalness={0}
          roughness={0.22}
          clearcoat={0.6}
          clearcoatRoughness={0.15}
          emissive={new THREE.Color(accentHex)}
          emissiveIntensity={0.14}
        />
      </mesh>

      {/* Dynamic Island */}
      <mesh position={[0, SCREEN_H / 2 - 8.2 * MM, BODY_D / 2 + 0.003]}>
        <planeGeometry args={[8.6 * MM, 2.6 * MM]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>

      <ScreenContent activeIndex={activeIndex} z={BODY_D / 2 + 0.01} />
    </group>
  );
});

export default PhoneModel;
