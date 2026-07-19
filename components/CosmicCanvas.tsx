"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollProgress } from "./store";

/* ─── MATH HELPERS ────────────────────────────────────────────── */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const range = (p: number, lo: number, hi: number) => clamp((p - lo) / (hi - lo), 0, 1);
const easeOut3 = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOut4 = (t: number) => 1 - Math.pow(1 - t, 4);
const easeIn2  = (t: number) => t * t;

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

  useFrame(() => {
    if (!fog.current) return;
    const p = live.current;
    // Gentle cosmos fog
    const cosmosDensity = range(p, 0.08, 0.25) * 0.008;
    fog.current.density = cosmosDensity;
  });

  return <fogExp2 ref={fog} attach="fog" args={[0x000005, 0]} />;
}

/* ─── CAMERA RIG ─────────────────────────────────────────────────
   The camera stays put with a gentle, continuous breathing sway —
   there's no longer a destination (Earth) to travel toward, so it
   just holds a calm, steady frame around the star blast.          */
function CameraRig() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    const dx = Math.sin(t * 0.09) * 0.18;
    const dy = Math.cos(t * 0.07) * 0.10;

    camera.position.set(dx, dy, 8);
    camera.lookAt(dx * 0.04, dy * 0.04, -24);
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
    const fadeIn  = easeOut3(range(p, 0.08, 0.22));
    const fadeOut = easeIn2(range(p, 0.30, 0.45));
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

/* ─── GLOWING STAR ───────────────────────────────────────────────
   Phase 0.00 → 0.20 : star appears, grows, and EXPLODES all as ONE continuous motion
   Phase 0.00 → 0.28: shockwave rings radiate outward             */
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

    // appear, grow, and explode are ONE blended motion from the very start
    const glowBlastT = easeOut4(range(p, 0.00, 0.12));

    // The star grows to peak then explodes outward
    const growPhase = Math.min(1, glowBlastT * 2.5);     // grows faster
    const explodePhase = easeOut4(range(p, 0.045, 0.12)); // blast starts right after the first glow

    const alive = p < 0.18;

    /* CORE */
    if (coreRef.current && coreMat.current) {
      coreRef.current.visible = alive;
      if (alive) {
        const pulse = 1 + Math.sin(t * 9.1) * 0.10 + Math.sin(t * 14.7) * 0.05;
        const baseScale = glowBlastT * lerp(0.4, 5.2, growPhase) * growPhase * pulse;
        const scale = explodePhase > 0 ? lerp(baseScale, 28, explodePhase) : baseScale;
        coreRef.current.scale.setScalar(Math.max(0.001, scale));

        const baseOp = glowBlastT * 1.0;
        coreMat.current.opacity = clamp(
          explodePhase > 0 ? lerp(baseOp, 0, Math.min(1, explodePhase * 1.5)) : baseOp,
          0, 1
        );
      }
    }

    /* MID GLOW */
    if (midRef.current && midMat.current) {
      midRef.current.visible = alive;
      if (alive) {
        const pulse = 1 + Math.sin(t * 5.3 + 1.1) * 0.16;
        const baseScale = glowBlastT * lerp(2.2, 1.2, growPhase) * pulse;
        const scale = explodePhase > 0 ? lerp(baseScale, 42, explodePhase) : baseScale;
        midRef.current.scale.setScalar(Math.max(0.001, scale));
        midMat.current.opacity = clamp(
          explodePhase > 0 ? lerp(0.55, 0, explodePhase) : glowBlastT * 0.55,
          0, 1
        );
      }
    }

    /* OUTER HALO */
    if (haloRef.current && haloMat.current) {
      haloRef.current.visible = alive;
      if (alive) {
        const pulse = 1 + Math.sin(t * 2.8 + 2.4) * 0.22;
        const baseScale = glowBlastT * lerp(6.0, 2.5, growPhase) * pulse;
        const scale = explodePhase > 0 ? lerp(baseScale, 90, explodePhase) : baseScale;
        haloRef.current.scale.setScalar(Math.max(0.001, scale));
        haloMat.current.opacity = clamp(
          explodePhase > 0 ? lerp(0.22, 0, explodePhase) : glowBlastT * 0.22,
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
        const onExplode = explodePhase > 0 ? lerp(1, 0, Math.min(1, explodePhase * 2.2)) : 1;
        const baseLength = i === 0 ? 32 : (i === 1 ? 12 : 6);
        const thickness  = i === 0 ? 0.35 : 0.15;

        const scaleX = lerp(0.01, baseLength, Math.min(1, growPhase * 1.8)) * onExplode;
        r.scale.set(Math.max(0.001, scaleX), thickness, 1);

        const angles = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4];
        r.rotation.z = angles[i] + t * 0.015;

        mat.opacity = glowBlastT * (i === 0 ? 0.85 : 0.45) * onExplode;
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

/* ─── EXPLOSION PARTICLES ────────────────────────────────────────
   Particles burst from the star explosion, then fade out into calm. */
function ExplosionParticles({ live }: { live: React.MutableRefObject<number> }) {
  const FAST  = 3600;

  const dotTex = useMemo(() => makeSoftDotTexture(64), []);

  const { fastOrigin, fastTarget } = useMemo(() => {
    const origin = new Float32Array(FAST * 3);
    const target = new Float32Array(FAST * 3);
    for (let i = 0; i < FAST; i++) {
      origin[i * 3]     = (prng(i * 9 + 0) - 0.5) * 0.18;
      origin[i * 3 + 1] = (prng(i * 9 + 1) - 0.5) * 0.18;
      origin[i * 3 + 2] = (prng(i * 9 + 2) - 0.5) * 0.18;

      const phi   = Math.acos(2 * prng(i * 9 + 3) - 1);
      const theta = prng(i * 9 + 4) * Math.PI * 2;
      const r     = 18 + prng(i * 9 + 5) * 82;
      target[i * 3]     = Math.sin(phi) * Math.cos(theta) * r * 1.35;
      target[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.82;
      target[i * 3 + 2] = Math.cos(phi) * r * 0.45;
    }
    return { fastOrigin: origin, fastTarget: target };
  }, []);

  const fastRef = useRef<THREE.Points>(null);
  const fastMat = useRef<THREE.PointsMaterial>(null);

  useFrame(() => {
    const p = live.current;

    const fastT  = easeOut4(range(p, 0.065, 0.30));
    const fastFI = easeOut3(range(p, 0.058, 0.095));
    const fastFO = easeIn2(range(p, 0.25, 0.35));
    const fastOp = clamp(fastFI * (1 - fastFO), 0, 1);

    if (fastRef.current && fastMat.current) {
      const attr = fastRef.current.geometry.attributes.position;
      const arr  = attr.array as Float32Array;
      for (let i = 0; i < FAST; i++) {
        arr[i * 3]     = lerp(fastOrigin[i * 3],     fastTarget[i * 3],     fastT);
        arr[i * 3 + 1] = lerp(fastOrigin[i * 3 + 1], fastTarget[i * 3 + 1], fastT);
        arr[i * 3 + 2] = lerp(fastOrigin[i * 3 + 2], fastTarget[i * 3 + 2], fastT);
      }
      attr.needsUpdate = true;
      fastMat.current.opacity = fastOp * 1.15;
      fastRef.current.visible = fastOp > 0.008;
    }
  });

  if (!dotTex) return null;

  return (
    <>
      {/* Bright core burst from the starting glow */}
      <points ref={fastRef} visible={false} position={[0, 0, -14]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(fastOrigin), 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={fastMat}
          size={0.52}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          map={dotTex}
          alphaTest={0.005}
          sizeAttenuation
        >
          <color attach="color" args={[5.5, 5.5, 5.2]} />
        </pointsMaterial>
      </points>
    </>
  );
}

/* ─── SPACE BACKDROP GLOW ────────────────────────────────────────
   Large flat plane behind everything with a radial glow that
   represents the galaxy core / deep-space ambience.              */
function SpaceBackdrop() {
  // The user requested a black background, so we disable the blue space backdrop glow.
  return null;
}

/* ─── SCENE ASSEMBLY ─────────────────────────────────────────────
   Star appears, grows, and explodes into a calm resting star field —
   that resting state (reached by p ≈ 0.45) is what the page settles
   into as a static landing once the scroll-pin releases.          */
function Scene() {
  const live = useLiveProgress();

  return (
    <>
      <SceneFog live={live} />
      <CameraRig />
      <SpaceBackdrop />
      <StarField live={live} />
      <GlowingStar live={live} />
      <ExplosionParticles live={live} />
    </>
  );
}

/* ─── EXPORTED CANVAS ────────────────────────────────────────────*/
export default function CosmicCanvas({
  frameloop = "always",
}: {
  frameloop?: "always" | "never" | "demand";
}) {
  return (
    <Canvas
      frameloop={frameloop}
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
