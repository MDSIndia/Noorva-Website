"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// Hero visual: public/hero-right.jpg (tablet with a holographic data
// sphere), plain and untouched — plus two small decorative layers on top:
// a slowly rotating dashed ring over the sphere, and a handful of particles
// that fly outward from it and fade. Center below is where the sphere's
// dense core actually sits in the source photo (found by probing the
// pixels), so both line up with the art instead of the image's geometric
// center.
const IMAGE_WIDTH = 989;
const IMAGE_HEIGHT = 702;
const SPHERE_CENTER_X = (490 / IMAGE_WIDTH) * 100;
const SPHERE_CENTER_Y = (310 / IMAGE_HEIGHT) * 100;
const SPHERE_RADIUS = (195 / IMAGE_WIDTH) * 100;
// Particles flying outward from the sphere — fixed angle/timing (not
// Math.random(), which this repo's react-hooks/purity lint rule forbids
// during render) so positions are deterministic across renders but still
// look scattered.
interface ParticleSpec {
  angleDeg: number;
  size: number;
  delay: number;
  duration: number;
}
function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}
const PARTICLES: ParticleSpec[] = [
  { angleDeg: 15, size: 3, delay: 0, duration: 2.6 },
  { angleDeg: 60, size: 2, delay: 0.5, duration: 3.0 },
  { angleDeg: 100, size: 3, delay: 1.1, duration: 2.4 },
  { angleDeg: 145, size: 2, delay: 1.6, duration: 2.8 },
  { angleDeg: 195, size: 3, delay: 0.3, duration: 3.2 },
  { angleDeg: 235, size: 2, delay: 0.9, duration: 2.5 },
  { angleDeg: 280, size: 3, delay: 1.9, duration: 2.9 },
  { angleDeg: 325, size: 2, delay: 1.3, duration: 2.7 },
];
const PARTICLE_POSITIONS = PARTICLES.map((p) => {
  const rad = (p.angleDeg * Math.PI) / 180;
  return {
    ...p,
    // outward drift, in px at the lg breakpoint's ~460px box
    dx: round4(Math.cos(rad) * 60),
    dy: round4(Math.sin(rad) * 60),
  };
});

export default function HeroLogoPortal() {
  const containerRef = useRef<HTMLDivElement>(null);
  // Cursor parallax — subtle 3D tilt that follows the pointer anywhere on
  // the page (not just over the image, which is pointer-events-none so it
  // never blocks clicks on the hero text/buttons behind/beside it). Springs
  // smooth the raw pointer delta into an easing follow instead of a snap.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 55, damping: 16, mass: 0.6 });
  const springY = useSpring(rawY, { stiffness: 55, damping: 16, mass: 0.6 });
  const rotateX = useTransform(springY, [-1, 1], [5, -5]);
  const rotateY = useTransform(springX, [-1, 1], [-5, 5]);

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      rawX.set(Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1)));
      rawY.set(Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1)));
    }
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [rawX, rawY]);

  return (
    <div className="pointer-events-none flex flex-col items-center">
      <div ref={containerRef} style={{ perspective: 900 }}>
        <motion.div
          className="relative w-[280px] sm:w-[360px] lg:w-[460px]"
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
            // Without an explicit (or aspect-ratio-derived) height, this
            // container's height is "auto" — and percentages like `top` and
            // `height` on absolutely-positioned children don't resolve
            // against an auto height, so the ring/particles below land in
            // the wrong place. Pinning the aspect ratio here gives them a
            // definite box to resolve against.
            aspectRatio: `${IMAGE_WIDTH} / ${IMAGE_HEIGHT}`,
          }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* Masking the photo by its own luminance makes its near-black
              background transparent (revealing the animated cosmic canvas
              behind it) while the bright sphere/tablet content stays fully
              opaque — so it reads as glowing content floating in the scene
              instead of a dark rectangle pasted over it. (`mix-blend-mode`
              would do this too, but CinematicIntro's ancestor animates
              `filter: blur()` on this content for the intro reveal, which
              creates a stacking context that walls off blending from
              anything painted outside it — including the canvas. A
              self-luminance mask uses plain alpha compositing instead, so
              it isn't affected.) */}
          <img
            src="/hero-right.jpg"
            alt="Noorva AI holographic data sphere"
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
            className="h-auto w-full"
            style={{
              maskImage: "url(/hero-right.jpg)",
              WebkitMaskImage: "url(/hero-right.jpg)",
              maskMode: "luminance",
              maskSize: "100% 100%",
              WebkitMaskSize: "100% 100%",
            }}
          />

          {/* Minimal rotating ring over the sphere. Positioning (top/left/
              centering) and animation (rotate) are split across two
              elements on purpose — Framer Motion drives `animate` through
              its own inline `transform`, which silently replaces a
              Tailwind `-translate-x-1/2 -translate-y-1/2` set on the same
              element instead of combining with it. Centering lives on a
              plain (non-animated) wrapper; the motion.div inside only ever
              owns the rotate transform. */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              top: `${SPHERE_CENTER_Y}%`,
              left: `${SPHERE_CENTER_X}%`,
              // 1.1x hugs just outside the dense solid core (~100px radius
              // of the 195px-radius SPHERE_RADIUS burst) rather than
              // slicing through the radiating spikes further out.
              width: `${SPHERE_RADIUS * 1.1}%`,
              aspectRatio: "1 / 1",
            }}
          >
            <motion.div
              className="h-full w-full rounded-full"
              style={{ border: "1px dashed rgba(147,197,253,0.55)" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Particles flying outward from the sphere — same split: outer
              div anchors + centers on the sphere's center point, inner
              motion.div owns the opacity/x/y drift animation. */}
          {PARTICLE_POSITIONS.map((p, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: `${SPHERE_CENTER_Y}%`, left: `${SPHERE_CENTER_X}%` }}
            >
              <motion.div
                className="rounded-full bg-white"
                style={{
                  width: p.size,
                  height: p.size,
                  boxShadow: "0 0 4px 1px rgba(147,197,253,0.8), 0 0 8px 2px rgba(59,130,246,0.4)",
                }}
                animate={{
                  opacity: [0, 1, 0],
                  x: [0, p.dx, p.dx * 1.6],
                  y: [0, p.dy, p.dy * 1.6],
                }}
                transition={{ duration: p.duration, repeat: Infinity, ease: "easeOut", delay: p.delay }}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
