"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { scrollProgress } from "./store";

/* ─── MATH HELPERS ────────────────────────────────────────────── */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const range = (p: number, lo: number, hi: number) => clamp((p - lo) / (hi - lo), 0, 1);
const easeOut3 = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOut4 = (t: number) => 1 - Math.pow(1 - t, 4);
const easeIn2  = (t: number) => t * t;
const easeIn3  = (t: number) => t * t * t;
const easeInOut3 = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* PRNG for deterministic particle placement */
function prng(n: number) {
  let s = (n * 1664525 + 1013904223) | 0;
  s = Math.imul(s, s ^ (s >> 16));
  return ((s >>> 0) / 0xffffffff);
}

/* ─── SMOOTH PROGRESS ────────────────────────────────────────────
   Runs inside the R3F render loop, exponentially smooths the raw
   scroll value so the scene always looks buttery even when the
   user scrolls fast.                                              */
function useLiveProgress() {
  const smooth = useRef(0);
  useFrame((_, delta) => {
    const raw = typeof scrollProgress.value === "number" && !isNaN(scrollProgress.value)
      ? scrollProgress.value : 0;
    smooth.current += (raw - smooth.current) * (1 - Math.exp(-delta * 5.5));
  });
  return smooth;
}

/* ─── SOFT DOT TEXTURE ───────────────────────────────────────────
   Single shared canvas texture for all point clouds.             */
function makeSoftDotTexture(size = 64, r = 255, g = 255, b = 255) {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0,    `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.35, `rgba(${r},${g},${b},0.75)`);
  grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/* ─── SCENE FOG ──────────────────────────────────────────────────*/
function SceneFog({ live }: { live: React.MutableRefObject<number> }) {
  const fog = useRef<THREE.FogExp2>(null);
  const { scene } = useThree();

  useFrame(() => {
    if (!fog.current) return;
    const p = live.current;
    // Gentle cosmos fog; heavy entry fog for Earth portal
    const cosmosDensity = range(p, 0.38, 0.58) * 0.012;
    const entryDensity  = easeIn3(range(p, 0.83, 0.95)) * 0.14;
    fog.current.density = cosmosDensity + entryDensity;

    const portalT = range(p, 0.88, 1.0);
    fog.current.color.setRGB(
      lerp(0,     0.03, portalT),
      lerp(0.001, 0.02, portalT),
      lerp(0.015, 0.08, portalT)
    );
  });

  return <fogExp2 ref={fog} attach="fog" args={[0x000005, 0]} />;
}

/* ─── CAMERA RIG ─────────────────────────────────────────────────
   Phase 0–0.46 : static, gentle breathing sway around origin
   Phase 0.46–0.82: fly forward through the cosmos toward Earth
   Phase 0.82–0.96: slam into Earth (rapid Z advance)             */
function CameraRig({ live }: { live: React.MutableRefObject<number> }) {
  useFrame(({ camera, clock }) => {
    const p = live.current;
    const t = clock.getElapsedTime();

    // Subtle drift — always present
    const dx = Math.sin(t * 0.09) * 0.18;
    const dy = Math.cos(t * 0.07) * 0.10;

    // Travel toward Earth
    const travelT = easeInOut3(range(p, 0.46, 0.82));
    // Final plunge into Earth
    const plungeT = easeIn3(range(p, 0.82, 0.97));

    const travelZ = lerp(8, -28, travelT);
    const plungeZ = lerp(travelZ, 5, plungeT);

    camera.position.set(
      dx * (1 - plungeT * 0.8),
      dy * (1 - plungeT * 0.8),
      lerp(travelZ, plungeZ, plungeT > 0 ? 1 : 0)
    );

    const lookTarget = new THREE.Vector3(dx * 0.04, dy * 0.04, -24);
    camera.lookAt(lookTarget);
  });
  return null;
}

/* ─── AMBIENT STAR DUST (very far background) ────────────────────
   Faint static star field, always rendered once cosmos phase hits */
function StarField({ live }: { live: React.MutableRefObject<number> }) {
  const COUNT = 6000;
  const ref   = useRef<THREE.Points>(null);
  const mat   = useRef<THREE.PointsMaterial>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3]     = (prng(i * 3 + 0) - 0.5) * 360;
      arr[i * 3 + 1] = (prng(i * 3 + 1) - 0.5) * 360;
      arr[i * 3 + 2] = (prng(i * 3 + 2) - 0.5) * 360 - 80;
    }
    return arr;
  }, []);

  const tex = useMemo(() => makeSoftDotTexture(32), []);

  useFrame(() => {
    const p = live.current;
    const fadeIn  = easeOut3(range(p, 0.28, 0.52));
    const fadeOut = easeIn2(range(p, 0.78, 0.92));
    const op = fadeIn * (1 - fadeOut) * 0.85;
    if (ref.current)  ref.current.visible = op > 0.005;
    if (mat.current)  mat.current.opacity = op;
  });

  if (!tex) return null;
  return (
    <points ref={ref} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        size={0.22}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        map={tex}
        alphaTest={0.004}
        sizeAttenuation
      >
        <color attach="color" args={[1.1, 1.2, 2.0]} />
      </pointsMaterial>
    </points>
  );
}

/* ─── NEBULA CLOUDS ──────────────────────────────────────────────*/
function NebulaClouds({ live }: { live: React.MutableRefObject<number> }) {
  const COUNT = 10;
  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  const textures = useMemo(() => {
    if (typeof document === "undefined") return [];
    const palettes: [string, string][] = [
      ["rgba(40,15,130,0.45)",  "rgba(20,8,70,0.25)"],
      ["rgba(10,30,110,0.42)",  "rgba(5,18,65,0.22)"],
      ["rgba(90,10,60,0.38)",   "rgba(50,6,35,0.20)"],
      ["rgba(10,60,100,0.40)",  "rgba(5,32,60,0.22)"],
      ["rgba(55,8,100,0.42)",   "rgba(28,5,55,0.22)"],
    ];
    return Array.from({ length: COUNT }, (_, i) => {
      const [c1, c2] = palettes[i % palettes.length];
      const cv = document.createElement("canvas");
      cv.width = cv.height = 512;
      const ctx = cv.getContext("2d")!;
      for (let b = 0; b < 7; b++) {
        const bx = 128 + Math.cos(b * 1.7 + i) * 120;
        const by = 128 + Math.sin(b * 1.3 + i * 0.8) * 100;
        const br = 80 + b * 20;
        const gc = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        gc.addColorStop(0, b % 2 === 0 ? c1 : c2);
        gc.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gc;
        ctx.fillRect(0, 0, 512, 512);
      }
      const tex = new THREE.CanvasTexture(cv);
      return tex;
    });
  }, []);

  const configs = useMemo(() => [
    { x: -42, y:  12, z: -60, s: 32 },
    { x:  38, y:  -9, z: -68, s: 36 },
    { x: -18, y:  22, z: -75, s: 28 },
    { x:  54, y:   6, z: -52, s: 34 },
    { x: -58, y:  -6, z: -85, s: 40 },
    { x:  22, y: -20, z: -78, s: 26 },
    { x: -32, y:  16, z: -95, s: 44 },
    { x:  12, y: -28, z: -54, s: 24 },
    { x: -10, y:  30, z: -110, s: 48 },
    { x:  60, y:  18, z: -62, s: 30 },
  ], []);

  useFrame(({ clock }) => {
    const p   = live.current;
    const t   = clock.getElapsedTime();
    const fadeIn  = easeOut3(range(p, 0.30, 0.52));
    const fadeOut = easeIn2(range(p, 0.60, 0.76));
    const op  = fadeIn * (1 - fadeOut) * 0.70;

    meshes.current.forEach((m, i) => {
      if (!m) return;
      m.visible = op > 0.004;
      if (m.visible) {
        (m.material as THREE.MeshBasicMaterial).opacity = op;
        m.position.x = configs[i].x + Math.sin(t * 0.06 + i * 0.9) * 1.0;
        m.position.z = configs[i].z + live.current * 55;
      }
    });
  });

  if (textures.length === 0) return null;
  return (
    <>
      {configs.map((cfg, i) => (
        <mesh
          key={i}
          ref={el => { meshes.current[i] = el; }}
          position={[cfg.x, cfg.y, cfg.z]}
          visible={false}
        >
          <planeGeometry args={[cfg.s, cfg.s]} />
          <meshBasicMaterial
            map={textures[i]}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

/* ─── GLOWING STAR ───────────────────────────────────────────────
   Phase 0.0 → 0.12 : fade in (tiny dim dot)
   Phase 0.12 → 0.22: grow + brighten with pulsing
   Phase 0.22 → 0.26: compress / implode (charging energy)
   Phase 0.26 → 0.42: EXPLOSION — rapidly expands to nothing      */
function GlowingStar({ live }: { live: React.MutableRefObject<number> }) {
  const coreRef  = useRef<THREE.Mesh>(null);
  const midRef   = useRef<THREE.Mesh>(null);
  const haloRef  = useRef<THREE.Mesh>(null);
  const coreMat  = useRef<THREE.MeshBasicMaterial>(null);
  const midMat   = useRef<THREE.MeshBasicMaterial>(null);
  const haloMat  = useRef<THREE.MeshBasicMaterial>(null);
  const rayRefs  = useRef<(THREE.Mesh | null)[]>([]);
  const rayMats  = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  // Soft circular texture for halo and mid glows
  const haloTex = useMemo(() => makeSoftDotTexture(128), []);

  useFrame(({ clock }) => {
    const p = live.current;
    const t = clock.getElapsedTime();

    const appearT   = easeOut4(range(p, 0.0, 0.18));
    const growT     = easeOut3(range(p, 0.08, 0.22));
    const chargeT   = easeIn3(range(p, 0.22, 0.265));  // implode before explode
    const explodeT  = easeOut4(range(p, 0.265, 0.42));

    const alive = p < 0.46;

    /* CORE */
    if (coreRef.current && coreMat.current) {
      coreRef.current.visible = alive;
      if (alive) {
        const pulse = 1 + Math.sin(t * 9.1) * 0.10 + Math.sin(t * 14.7) * 0.05;
        const baseScale = appearT * lerp(0.4, 5.2, growT) * lerp(1, 0.35, chargeT) * pulse;
        const scale = explodeT > 0 ? lerp(baseScale, 28, explodeT) : baseScale;
        coreRef.current.scale.setScalar(Math.max(0.001, scale));

        const baseOp = lerp(0.3, 1.0, appearT);
        coreMat.current.opacity = clamp(
          explodeT > 0 ? lerp(baseOp, 0, Math.min(1, explodeT * 1.5)) : baseOp,
          0, 1
        );
      }
    }

    /* MID GLOW */
    if (midRef.current && midMat.current) {
      midRef.current.visible = alive;
      if (alive) {
        const pulse = 1 + Math.sin(t * 5.3 + 1.1) * 0.16;
        const baseScale = appearT * lerp(2.2, 1.2, chargeT) * pulse;
        const scale = explodeT > 0 ? lerp(baseScale, 42, explodeT) : baseScale;
        midRef.current.scale.setScalar(Math.max(0.001, scale));
        midMat.current.opacity = clamp(
          explodeT > 0 ? lerp(0.55, 0, explodeT) : appearT * 0.55,
          0, 1
        );
      }
    }

    /* OUTER HALO */
    if (haloRef.current && haloMat.current) {
      haloRef.current.visible = alive;
      if (alive) {
        const pulse = 1 + Math.sin(t * 2.8 + 2.4) * 0.22;
        const baseScale = appearT * lerp(6.0, 2.5, chargeT) * pulse;
        const scale = explodeT > 0 ? lerp(baseScale, 90, explodeT) : baseScale;
        haloRef.current.scale.setScalar(Math.max(0.001, scale));
        haloMat.current.opacity = clamp(
          explodeT > 0 ? lerp(0.22, 0, explodeT) : appearT * 0.22,
          0, 1
        );
      }
    }

    /* LIGHT RAYS */
    rayRefs.current.forEach((r, i) => {
      const mat = rayMats.current[i];
      if (!r || !mat || i > 3) return;
      r.visible = alive;
      if (alive) {
        const onExplode = explodeT > 0 ? lerp(1, 0, Math.min(1, explodeT * 2.2)) : 1;
        const onCharge  = lerp(1, 0.25, chargeT);
        
        // Natural anamorphic flare sizing
        const baseLength = i === 0 ? 32 : (i === 1 ? 12 : 6); 
        const thickness  = i === 0 ? 0.35 : 0.15;
        
        const scaleX = lerp(0.01, baseLength, growT * onCharge) * onExplode;
        r.scale.set(Math.max(0.001, scaleX), thickness, 1);
        
        const angles = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4];
        r.rotation.z = angles[i] + t * 0.015;
        
        mat.opacity = appearT * (i === 0 ? 0.85 : 0.45) * onExplode;
      }
    });
  });

  if (!haloTex) return null;
  return (
    <group position={[0, 0, -14]}>
      {/* Outer halo — large soft disk */}
      <mesh ref={haloRef} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={haloMat}
          map={haloTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        >
          <color attach="color" args={[0.5, 0.8, 3.0]} />
        </meshBasicMaterial>
      </mesh>

      {/* Mid glow */}
      <mesh ref={midRef} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={midMat}
          map={haloTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        >
          <color attach="color" args={[2.5, 2.8, 6.0]} />
        </meshBasicMaterial>
      </mesh>

      {/* Core bright point */}
      <mesh ref={coreRef} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={coreMat}
          map={haloTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        >
          <color attach="color" args={[12, 10, 7]} />
        </meshBasicMaterial>
      </mesh>

      {/* Lens rays (natural optical flare) */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          ref={el => { rayRefs.current[i] = el; }}
          visible={false}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={el => { rayMats.current[i] = el; }}
            map={haloTex}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          >
            <color attach="color" args={[3.5, 4.5, 9.0]} />
          </meshBasicMaterial>
        </mesh>
      ))}
    </group>
  );
}

/* ─── SHOCKWAVE RINGS ────────────────────────────────────────────
   Two concentric rings radiate outward as the star explodes.     */
function ShockwaveRings({ live }: { live: React.MutableRefObject<number> }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const offsets = [0, 0.024, 0.052]; // staggered ring delays

  useFrame(() => {
    const p = live.current;
    const visible = p > 0.255 && p < 0.48;

    refs.current.forEach((r, i) => {
      const mat = mats.current[i];
      if (!r || !mat) return;
      r.visible = visible;
      if (visible) {
        const t = easeOut4(range(p, 0.26 + offsets[i], 0.44 + offsets[i]));
        r.scale.setScalar(lerp(0.05, 55 - i * 8, t));
        mat.opacity = lerp(1, 0, t) * (1 - i * 0.2);
      }
    });
  });

  return (
    <group position={[0, 0, -14]}>
      {offsets.map((_, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }} visible={false}>
          <ringGeometry args={[1.0, 1.12 - i * 0.02, 96]} />
          <meshBasicMaterial
            ref={el => { mats.current[i] = el; }}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            side={THREE.DoubleSide}
          >
            <color attach="color" args={i === 0 ? [6, 4.5, 1.5] : [2, 3.5, 7]} />
          </meshBasicMaterial>
        </mesh>
      ))}
    </group>
  );
}

/* ─── EXPLOSION BURST PARTICLES ──────────────────────────────────
   The star literally shatters into particles that then become the
   background starfield / cosmos. Three layers:
   • burstFast  — shoot outward quickly (explosion feel)
   • burstSlow  — drift more gently  (stardust feel)
   • cosmosRing — orbital disk that forms the galaxy             */
function ExplosionParticles({ live }: { live: React.MutableRefObject<number> }) {
  const FAST  = 2200;
  const SLOW  = 1800;
  const DISK  = 4000;
  const BG    = 5500;

  const dotTex = useMemo(() => makeSoftDotTexture(64), []);

  /* Fast burst — outward sphere */
  const { fastOrigin, fastTarget } = useMemo(() => {
    const origin = new Float32Array(FAST * 3);
    const target = new Float32Array(FAST * 3);
    for (let i = 0; i < FAST; i++) {
      origin[i * 3]     = (prng(i * 9 + 0) - 0.5) * 0.2;
      origin[i * 3 + 1] = (prng(i * 9 + 1) - 0.5) * 0.2;
      origin[i * 3 + 2] = (prng(i * 9 + 2) - 0.5) * 0.2;
      const phi   = Math.acos(2 * prng(i * 9 + 3) - 1);
      const theta = prng(i * 9 + 4) * Math.PI * 2;
      const r     = 28 + prng(i * 9 + 5) * 65;
      target[i * 3]     = Math.sin(phi) * Math.cos(theta) * r;
      target[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      target[i * 3 + 2] = Math.cos(phi) * r;
    }
    return { fastOrigin: origin, fastTarget: target };
  }, []);

  /* Slow drift — smaller sphere, stays visible longer */
  const { slowOrigin, slowTarget } = useMemo(() => {
    const origin = new Float32Array(SLOW * 3);
    const target = new Float32Array(SLOW * 3);
    for (let i = 0; i < SLOW; i++) {
      origin[i * 3]     = (prng(i * 7 + 100) - 0.5) * 0.3;
      origin[i * 3 + 1] = (prng(i * 7 + 101) - 0.5) * 0.3;
      origin[i * 3 + 2] = (prng(i * 7 + 102) - 0.5) * 0.3;
      const phi   = Math.acos(2 * prng(i * 7 + 103) - 1);
      const theta = prng(i * 7 + 104) * Math.PI * 2;
      const r     = 15 + prng(i * 7 + 105) * 45;
      target[i * 3]     = Math.sin(phi) * Math.cos(theta) * r;
      target[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.5;
      target[i * 3 + 2] = Math.cos(phi) * r;
    }
    return { slowOrigin: origin, slowTarget: target };
  }, []);

  /* Galaxy disk  */
  const diskPositions = useMemo(() => {
    const arr = new Float32Array(DISK * 3);
    for (let i = 0; i < DISK; i++) {
      const radius = 18 + prng(i * 5 + 0) * 80;
      const theta  = prng(i * 5 + 1) * Math.PI * 2;
      const twist  = theta + radius * 0.012;
      arr[i * 3]     = Math.cos(twist) * radius;
      arr[i * 3 + 1] = (prng(i * 5 + 2) - 0.5) * radius * 0.25;
      arr[i * 3 + 2] = Math.sin(twist) * radius - 22;
    }
    return arr;
  }, []);

  /* Deep background star field */
  const bgPositions = useMemo(() => {
    const arr = new Float32Array(BG * 3);
    for (let i = 0; i < BG; i++) {
      arr[i * 3]     = (prng(i * 3 + 0) - 0.5) * 300;
      arr[i * 3 + 1] = (prng(i * 3 + 1) - 0.5) * 300;
      arr[i * 3 + 2] = (prng(i * 3 + 2) - 0.5) * 300 - 70;
    }
    return arr;
  }, []);

  const fastRef = useRef<THREE.Points>(null);
  const fastMat = useRef<THREE.PointsMaterial>(null);
  const slowRef = useRef<THREE.Points>(null);
  const slowMat = useRef<THREE.PointsMaterial>(null);
  const diskRef = useRef<THREE.Points>(null);
  const diskMat = useRef<THREE.PointsMaterial>(null);
  const bgRef   = useRef<THREE.Points>(null);
  const bgMat   = useRef<THREE.PointsMaterial>(null);

  useFrame(() => {
    const p = live.current;

    /* Fast burst */
    const fastT    = easeOut4(range(p, 0.24, 0.58));
    const fastFI   = easeOut3(range(p, 0.24, 0.40));
    const fastFO   = easeIn2(range(p, 0.48, 0.66));
    const fastOp   = clamp(fastFI * (1 - fastFO), 0, 1);

    if (fastRef.current && fastMat.current) {
      const attr = fastRef.current.geometry.attributes.position;
      const arr  = attr.array as Float32Array;
      for (let i = 0; i < FAST; i++) {
        arr[i * 3]     = lerp(fastOrigin[i * 3],     fastTarget[i * 3],     fastT);
        arr[i * 3 + 1] = lerp(fastOrigin[i * 3 + 1], fastTarget[i * 3 + 1], fastT);
        arr[i * 3 + 2] = lerp(fastOrigin[i * 3 + 2], fastTarget[i * 3 + 2], fastT);
      }
      attr.needsUpdate   = true;
      fastMat.current.opacity = fastOp;
      fastRef.current.visible = fastOp > 0.008;
    }

    /* Slow drift */
    const slowT  = easeInOut3(range(p, 0.28, 0.65));
    const slowFI = easeOut3(range(p, 0.28, 0.46));
    const slowFO = easeIn2(range(p, 0.56, 0.72));
    const slowOp = clamp(slowFI * (1 - slowFO), 0, 1) * 0.85;

    if (slowRef.current && slowMat.current) {
      const attr = slowRef.current.geometry.attributes.position;
      const arr  = attr.array as Float32Array;
      for (let i = 0; i < SLOW; i++) {
        arr[i * 3]     = lerp(slowOrigin[i * 3],     slowTarget[i * 3],     slowT);
        arr[i * 3 + 1] = lerp(slowOrigin[i * 3 + 1], slowTarget[i * 3 + 1], slowT);
        arr[i * 3 + 2] = lerp(slowOrigin[i * 3 + 2], slowTarget[i * 3 + 2], slowT);
      }
      attr.needsUpdate = true;
      slowMat.current.opacity = slowOp;
      slowRef.current.visible = slowOp > 0.008;
    }

    /* Galaxy disk */
    const diskFI = easeOut3(range(p, 0.34, 0.58));
    const diskFO = easeIn2(range(p, 0.65, 0.80));
    const diskOp = diskFI * (1 - diskFO) * 0.78;
    if (diskRef.current && diskMat.current) {
      diskRef.current.rotation.y = p * 0.30;
      diskRef.current.position.z = lerp(0, 58, easeInOut3(range(p, 0.48, 0.74)));
      diskMat.current.opacity    = diskOp;
      diskRef.current.visible    = diskOp > 0.008;
    }

    /* BG stars */
    const bgFI = easeOut3(range(p, 0.30, 0.55));
    const bgFO = easeIn2(range(p, 0.72, 0.88));
    const bgOp = bgFI * (1 - bgFO) * 0.92;
    if (bgRef.current && bgMat.current) {
      bgRef.current.position.z = lerp(0, 68, easeInOut3(range(p, 0.48, 0.74)));
      bgMat.current.opacity    = bgOp;
      bgRef.current.visible    = bgOp > 0.008;
    }
  });

  if (!dotTex) return null;

  return (
    <>
      {/* Fast burst particles */}
      <points ref={fastRef} visible={false} position={[0, 0, -20]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(fastOrigin), 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={fastMat}
          size={0.85}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          map={dotTex}
          alphaTest={0.005}
          sizeAttenuation
        >
          <color attach="color" args={[4, 3.5, 6]} />
        </pointsMaterial>
      </points>

      {/* Slow drift particles */}
      <points ref={slowRef} visible={false} position={[0, 0, -20]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(slowOrigin), 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={slowMat}
          size={0.55}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          map={dotTex}
          alphaTest={0.005}
          sizeAttenuation
        >
          <color attach="color" args={[2, 2.8, 5.5]} />
        </pointsMaterial>
      </points>

      {/* Galaxy disk */}
      <points ref={diskRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[diskPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={diskMat}
          size={0.40}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          map={dotTex}
          alphaTest={0.005}
          sizeAttenuation
        >
          <color attach="color" args={[1.4, 1.9, 3.6]} />
        </pointsMaterial>
      </points>

      {/* Deep background stars */}
      <points ref={bgRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bgPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={bgMat}
          size={0.16}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          map={dotTex}
          alphaTest={0.005}
          sizeAttenuation
        >
          <color attach="color" args={[1.0, 1.1, 1.9]} />
        </pointsMaterial>
      </points>
    </>
  );
}

/* ─── SPACE BACKDROP GLOW ────────────────────────────────────────
   Large flat plane behind everything with a radial glow that
   represents the galaxy core / deep-space ambience.              */
function SpaceBackdrop({ live }: { live: React.MutableRefObject<number> }) {
  // The user requested a black background, so we disable the blue space backdrop glow.
  return null;
}

/* ─── EARTH ──────────────────────────────────────────────────────
   Phase 0.58–0.82: approach (zoom in from far)
   Phase 0.82–0.97: enter (scale up → engulfs camera)            */
function Earth({ live }: { live: React.MutableRefObject<number> }) {
  const group  = useRef<THREE.Group>(null);
  const atmoMat = useRef<THREE.MeshBasicMaterial>(null);

  const earthTex = useTexture("/earth.png");

  /* Atmospheric glow texture */
  const atmoTex = useMemo(() => makeSoftDotTexture(256, 100, 180, 255), []);

  useFrame(() => {
    const p = live.current;
    const approachT = easeOut4(range(p, 0.58, 0.83));
    const enterT    = easeIn3(range(p, 0.83, 0.97));
    const vis = p > 0.55 && p < 0.99;

    if (group.current) {
      group.current.visible = vis;
      if (vis) {
        group.current.rotation.y += 0.0006;
        const zApproach = lerp(-95, -13, approachT);
        const zEnter    = lerp(zApproach, 7, enterT);
        group.current.position.z = zEnter;

        const sApproach = lerp(0.25, 8.8, approachT);
        const sEnter    = lerp(sApproach, 100, enterT);
        group.current.scale.setScalar(sEnter);

        // Slight drift so Earth isn't centered — more cinematic
        group.current.position.x = lerp(2.5, 0, approachT);
        group.current.position.y = lerp(-1.0, 0, approachT);
      }
    }

    if (atmoMat.current) {
      atmoMat.current.opacity = lerp(0, 0.92, approachT) * lerp(1, 0, enterT * 1.3);
    }
  });

  if (!earthTex) return null;
  return (
    <group ref={group} visible={false}>
      {/* Earth sphere */}
      <mesh>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial
          map={earthTex}
          roughness={0.65}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Inner core light to illuminate the inside of the Earth */}
      <pointLight intensity={4.0} color="#ffffff" distance={0} decay={1} />

      {/* Atmospheric glow (back-face sphere slightly larger) */}
      <mesh>
        <sphereGeometry args={[1.08, 48, 48]} />
        <meshBasicMaterial
          ref={atmoMat}
          transparent
          opacity={0}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        >
          <color attach="color" args={[0.25, 0.75, 2.8]} />
        </meshBasicMaterial>
      </mesh>

      {/* City-light inner glow on night side */}
      <mesh>
        <sphereGeometry args={[1.02, 32, 32]} />
        <meshBasicMaterial
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        >
          <color attach="color" args={[1.0, 0.9, 0.5]} />
        </meshBasicMaterial>
      </mesh>

      {/* Lighting */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[8, 4, 10]} intensity={2.8} color="#ffeedd" />
      <directionalLight position={[-5, 2, -8]} intensity={0.4} color="#4488ff" />
    </group>
  );
}

/* ─── SCENE ASSEMBLY ─────────────────────────────────────────────*/
function Scene() {
  const live = useLiveProgress();

  return (
    <>
      <SceneFog live={live} />
      <CameraRig live={live} />
      <SpaceBackdrop live={live} />
      <NebulaClouds live={live} />
      <StarField live={live} />
      <GlowingStar live={live} />
      <ShockwaveRings live={live} />
      <ExplosionParticles live={live} />
      <Suspense fallback={null}>
        <Earth live={live} />
      </Suspense>
    </>
  );
}

/* ─── EXPORTED CANVAS ────────────────────────────────────────────*/
export default function CosmicCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 2000 }}
      style={{ background: "transparent", position: "absolute", inset: 0 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      dpr={[1, 1.8]}
    >
      <Scene />
    </Canvas>
  );
}
