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
}

const DENSITY = 7000; // px^2 per star — lower = more stars

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
          r: 0.4 + depth * 1.2,
          baseAlpha: 0.2 + Math.random() * 0.55,
          twinkleSpeed: 0.3 + Math.random() * 1.0,
          twinklePhase: Math.random() * Math.PI * 2,
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
          s.y += dt * 3.5 * s.depth;
          s.x -= dt * 1.6 * s.depth;
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
        ctx.fillStyle = "#ffffff";
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
