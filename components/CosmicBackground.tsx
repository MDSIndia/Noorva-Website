"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  depth: number; // 0.3 (far/small/slow) .. 1 (near/large/fast)
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

// px^2 per star — lower = more stars. Dropped from 7000 to give the whole
// site a visibly denser, more "cosmos-filled" backdrop rather than a sparse
// handful of dots.
const DENSITY = 2000;

// A handful of stars pick up a faint brand-color tint instead of plain
// white, so the field reads as a genuine nebula-adjacent cosmos rather than
// a flat star chart — same blue/violet already used for every other accent
// on the site, just at low saturation so it doesn't compete with content.
const STAR_COLORS = ["#ffffff", "#ffffff", "#ffffff", "#bcd4ff", "#c9b8ff"];

/**
 * Fixed, full-viewport star field that sits behind every section of the
 * site for the whole scroll length. Plain canvas 2D so it stays cheap to
 * keep mounted permanently.
 */
export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let stars: Star[] = [];

    const makeStars = () => {
      const count = Math.round((width * height) / DENSITY);
      stars = Array.from({ length: count }, () => {
        const depth = 0.3 + Math.random() * 0.7;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          depth,
          r: 0.5 + depth * 1.7,
          baseAlpha: 0.28 + Math.random() * 0.62,
          twinkleSpeed: 0.45 + Math.random() * 1.35,
          twinklePhase: Math.random() * Math.PI * 2,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        };
      });
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars();
    };

    resize();
    window.addEventListener("resize", resize);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, width, height);

      for (const s of stars) {
        if (!reduceMotion) {
          // Drift speed roughly tripled from the original tuning — the old
          // pace (near stars crossing the viewport in well over a minute)
          // read as effectively static at a glance; this is fast enough to
          // notice within a couple of seconds of watching while still
          // feeling like slow ambient drift, not a warp-speed effect.
          s.y += dt * 9 * s.depth;
          s.x -= dt * 4 * s.depth;
          if (s.y > height + 4) {
            s.y = -4;
            s.x = Math.random() * width;
          }
          if (s.x < -4) {
            s.x = width + 4;
            s.y = Math.random() * height;
          }
          s.twinklePhase += dt * s.twinkleSpeed;
        }
        const twinkle = reduceMotion ? 1 : 0.6 + 0.4 * Math.sin(s.twinklePhase);
        ctx.globalAlpha = s.baseAlpha * twinkle;
        ctx.beginPath();
        ctx.fillStyle = s.color;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: -1, background: "var(--bg)" }}
    />
  );
}
