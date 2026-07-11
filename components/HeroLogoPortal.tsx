"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

// Deterministic seeded PRNG (not Math.random) — this repo's react-hooks/purity
// lint rule forbids impure calls during render. Same hash function already
// used in CosmicCanvas.tsx.
function prng(n: number) {
  let s = (n * 1664525 + 1013904223) | 0;
  s = Math.imul(s, s ^ (s >> 16));
  return (s >>> 0) / 0xffffffff;
}

// Radial-glow + 4-point cross-spike, baked into one canvas texture — a real
// camera lens-flare silhouette (bright core + thin crossed spikes), not a
// plain blurred dot. Drawn once in near-white so each flare instance can
// tint it via material.color instead of needing a separate texture per hue.
function useFlareTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 128;
    const c = size / 2;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.35, "rgba(255,255,255,0.55)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
    const hBar = ctx.createLinearGradient(0, c, size, c);
    hBar.addColorStop(0, "rgba(255,255,255,0)");
    hBar.addColorStop(0.5, "rgba(255,255,255,0.9)");
    hBar.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hBar;
    ctx.fillRect(0, c - 1, size, 2);
    const vBar = ctx.createLinearGradient(c, 0, c, size);
    vBar.addColorStop(0, "rgba(255,255,255,0)");
    vBar.addColorStop(0.5, "rgba(255,255,255,0.9)");
    vBar.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = vBar;
    ctx.fillRect(c - 1, 0, 2, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

// Soft round glow (no spikes) — used behind the logo and as the base bloom,
// distinct from the flares' star shape.
function useGlowTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.4, "rgba(255,255,255,0.4)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

interface FlareSpec {
  radius: number;
  tilt: number; // radians, how much the orbit plane tips toward/away from camera
  planeRotation: number; // radians, orientation of the orbit ellipse in-plane
  speed: number; // rad/sec
  phase: number; // rad, starting angle
  size: number;
  color: string;
}

// Six orbiting lights on mismatched tilted orbits (not one flat ring) — this
// is the actual "lights that rotate like a flare around it" in true 3D:
// each swings toward and away from the camera on its own tilted plane, so
// they grow/shrink and pass in front of or behind the logo as they turn,
// which a flat CSS animation can't produce.
const FLARE_SPECS: FlareSpec[] = Array.from({ length: 6 }, (_, i) => ({
  radius: round3(0.85 + prng(i * 9 + 1) * 0.5),
  tilt: round3((prng(i * 9 + 2) - 0.5) * Math.PI * 0.7),
  planeRotation: round3(prng(i * 9 + 3) * Math.PI * 2),
  speed: round3(0.35 + prng(i * 9 + 4) * 0.55) * (i % 2 === 0 ? 1 : -1),
  phase: round3(prng(i * 9 + 5) * Math.PI * 2),
  size: round3(0.16 + prng(i * 9 + 6) * 0.22),
  color: ["#9fd8f5", "#c084fc", "#f0abfc", "#5eead4", "#7dd3fc", "#e0aaff"][i],
}));

// Rounded the same way as the (now-removed) DOM version's STARS did — kept
// here even though this data never touches an SSR'd style string, purely so
// FLARE_SPECS stays readable/debuggable with short numbers.
function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

function LogoPlane() {
  // Passed as a single-element array, not a bare string — react-hooks/
  // immutability forbids mutating a hook's own return value directly
  // (texture.colorSpace = ...), but not properties reached by iterating an
  // array the hook returned; matches the identical, already-lint-clean
  // workaround in BookModel.tsx's useBakedCoverTextures.
  const [texture] = useTexture(["/NoorvaLogo.png"]);
  const glowTexture = useGlowTexture();
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    [texture].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
    });
  }, [texture]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    group.position.y = Math.sin(state.clock.getElapsedTime() * 0.6) * 0.05;
  });

  // Real image is 350x317 — matching that aspect keeps the logo from
  // looking squashed/stretched on the plane.
  const aspect = 350 / 317;
  const width = 0.62;
  const height = width / aspect;

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshBasicMaterial
          map={glowTexture}
          color="#c084fc"
          transparent
          opacity={0.55}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Flare({ spec, texture }: { spec: FlareSpec; texture: THREE.Texture | null }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;
    const t = spec.phase + state.clock.getElapsedTime() * spec.speed;
    const bx = Math.cos(t);
    const by = Math.sin(t);
    // Rotate the unit circle in-plane, then tip it around the X axis so
    // part of the orbit swings toward the camera (+z) and part away (-z) —
    // the actual 3D depth motion, not a flat screen-space circle.
    const rx = bx * Math.cos(spec.planeRotation) - by * Math.sin(spec.planeRotation);
    const ry = bx * Math.sin(spec.planeRotation) + by * Math.cos(spec.planeRotation);
    const x = spec.radius * rx;
    const y = spec.radius * ry * Math.cos(spec.tilt);
    const z = spec.radius * ry * Math.sin(spec.tilt);
    mesh.position.set(x, y, z);

    // Nearer the camera (+z) reads bigger/brighter, farther (-z) smaller/
    // dimmer — perspective already does some of this, but exaggerating it
    // a bit sells the depth more clearly at this small a scale.
    const depth = THREE.MathUtils.clamp((z / (spec.radius || 1) + 1) / 2, 0, 1);
    const scale = spec.size * (0.7 + depth * 0.6);
    mesh.scale.setScalar(scale);
    material.opacity = 0.5 + depth * 0.5;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture ?? undefined}
        color={spec.color}
        transparent
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function PortalScene() {
  const flareTexture = useFlareTexture();
  return (
    <>
      <LogoPlane />
      {FLARE_SPECS.map((spec, i) => (
        <Flare key={i} spec={spec} texture={flareTexture} />
      ))}
    </>
  );
}

export default function HeroLogoPortal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "200px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none flex flex-col items-center">
      {/* Portal + logo — real 3D scene (not CSS/DOM), so the orbiting lights
          genuinely move in depth (toward/away from camera, in front of or
          behind the logo) rather than a flat animated ring. */}
      <div className="relative h-[220px] w-[220px] sm:h-[270px] sm:w-[270px] lg:h-[320px] lg:w-[320px]">
        <Canvas
          frameloop={inView ? "always" : "never"}
          camera={{ position: [0, 0, 3.2], fov: 40, near: 0.1, far: 20 }}
          style={{ background: "transparent" }}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          dpr={[1, 1.8]}
        >
          <PortalScene />
        </Canvas>
      </div>

      {/* Light beam connecting the logo down to the reflection pool — a
          bright core line plus a wider soft glow behind it, rather than a
          single thin flat line. */}
      <div className="relative h-14 sm:h-16 lg:h-[76px]">
        <div
          className="absolute top-0 left-1/2 h-full w-3 -translate-x-1/2 blur-md"
          style={{ background: "linear-gradient(to bottom, rgba(192,132,252,0.55), rgba(124,92,252,0))" }}
        />
        <div
          className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2"
          style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(192,132,252,0.15))" }}
        />
      </div>

      {/* Reflection pool — concentric rippled rings with a bright core and a
          horizontal light streak, plus a faint tail continuing below. */}
      <div className="relative h-[50px] w-[235px] sm:h-[62px] sm:w-[290px] lg:h-[72px] lg:w-[340px]">
        <div
          className="absolute top-1/2 left-1/2 h-[28%] w-full -translate-x-1/2 -translate-y-1/2 blur-lg"
          style={{ background: "linear-gradient(to right, transparent, rgba(124,92,252,0.5), rgba(255,255,255,0.6), rgba(124,92,252,0.5), transparent)" }}
        />
        {[1, 0.84, 0.68, 0.52, 0.38, 0.24, 0.12].map((scale, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 rounded-[50%] border"
            style={{
              width: `${scale * 100}%`,
              height: `${scale * 100}%`,
              borderColor: `rgba(124,92,252,${0.55 - i * 0.06})`,
              x: "-50%",
              y: "-50%",
            }}
            animate={{ opacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
          />
        ))}
        <div
          className="absolute top-1/2 left-1/2 h-[26%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-md"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.95), rgba(192,132,252,0.5) 55%, transparent 80%)" }}
        />
        {/* Faint reflection tail continuing below the pool */}
        <div
          className="absolute top-full left-1/2 h-10 w-px -translate-x-1/2 sm:h-14"
          style={{ background: "linear-gradient(to bottom, rgba(219,69,215,0.4), transparent)" }}
        />
      </div>
    </div>
  );
}
