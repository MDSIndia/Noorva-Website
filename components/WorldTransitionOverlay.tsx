"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// One boundary-crossing sentinel per section *after* the first — there's no
// "previous world" to warp out of at the very top of the page, so
// #cosmic-intro itself isn't observed. Crossing #story-gallery's top edge
// is the intro<->story boundary, #features' is story<->features, and
// #closing's is features<->closing.
const BOUNDARY_SECTION_IDS = ["story-gallery", "features", "closing"];

const STREAK_COUNT = 160;
// Cosmic accent palette already used throughout the site (--accent-1,
// --accent-2, --accent-warm) plus plain white, so the burst reads as an
// intensified version of the same starfield rather than a new visual
// language.
const STREAK_COLORS = ["#ffffff", "#ffffff", "#7c5cfc", "#4fa8d5", "#e8b478"];

interface Streak {
  angle: number;
  dist: number;
  speed: number;
  color: string;
}

/** Fixed full-viewport canvas, normally invisible, that bursts into a
 *  warp-speed streak-of-stars + flash every time the user's scroll crosses
 *  a top-level section boundary — reads as "shifting from one world to
 *  another" rather than a plain scroll cut, regardless of which two
 *  sections are actually meeting (every boundary gets the same treatment,
 *  by design — see the conversation this shipped in). Sits above every
 *  section's own content (including the fully-opaque pinned #features
 *  scene) but below Header.tsx, which stays usable through the burst. */
export default function WorldTransitionOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let cx = width / 2;
    let cy = height / 2;
    // Half-diagonal — a streak needs to travel this far from center to have
    // fully exited the viewport in any direction.
    let maxDist = Math.hypot(cx, cy);

    const streaks: Streak[] = Array.from({ length: STREAK_COUNT }, () => makeStreak());

    function makeStreak(): Streak {
      return {
        angle: Math.random() * Math.PI * 2,
        // Starts a little out from dead-center so early frames don't spend
        // time crawling through an empty middle.
        dist: Math.random() * 40,
        speed: 0.6 + Math.random() * 1,
        color: STREAK_COLORS[Math.floor(Math.random() * STREAK_COLORS.length)],
      };
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      cx = width / 2;
      cy = height / 2;
      maxDist = Math.hypot(cx, cy);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // Single shared value the whole burst is driven by: ramps 0 -> 1 fast
    // (the "jump"), holds near-peak briefly, then decays back to 0 (arrival
    // in the new section) — see triggerWarp below for the actual tween.
    const state = { intensity: 0 };
    let raf = 0;

    function draw() {
      raf = requestAnimationFrame(draw);
      const intensity = state.intensity;
      ctx!.clearRect(0, 0, width, height);
      if (intensity < 0.001) return;

      for (const s of streaks) {
        const prevDist = s.dist;
        // Speed grows with intensity (faster streaks at the burst's peak)
        // and with the streak's own existing distance (accelerating
        // outward, not a constant crawl — matches how real warp-speed
        // starfields read).
        s.dist += (2 + s.dist * 0.12) * s.speed * intensity;
        if (s.dist > maxDist + 60) {
          Object.assign(s, makeStreak());
          continue;
        }
        const x0 = cx + Math.cos(s.angle) * prevDist;
        const y0 = cy + Math.sin(s.angle) * prevDist;
        const x1 = cx + Math.cos(s.angle) * s.dist;
        const y1 = cy + Math.sin(s.angle) * s.dist;

        ctx!.strokeStyle = s.color;
        ctx!.globalAlpha = intensity * Math.min(1, 0.25 + s.dist / maxDist);
        ctx!.lineWidth = 1 + intensity * 1.8;
        ctx!.beginPath();
        ctx!.moveTo(x0, y0);
        ctx!.lineTo(x1, y1);
        ctx!.stroke();
      }

      // Brief center-out flash, concentrated around peak intensity (cubed)
      // rather than tracking intensity linearly, so it reads as a punch of
      // light right at the crossing instead of a slow fade matching the
      // streaks' own longer decay.
      const flashAlpha = Math.pow(intensity, 3) * 0.45;
      if (flashAlpha > 0.002) {
        const gradient = ctx!.createRadialGradient(cx, cy, 0, cx, cy, maxDist * 0.7);
        gradient.addColorStop(0, `rgba(255,255,255,${flashAlpha})`);
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx!.globalAlpha = 1;
        ctx!.fillStyle = gradient;
        ctx!.fillRect(0, 0, width, height);
      }
      ctx!.globalAlpha = 1;
    }
    raf = requestAnimationFrame(draw);

    function triggerWarp() {
      gsap.killTweensOf(state);
      gsap.timeline()
        .to(state, { intensity: 1, duration: 0.28, ease: "power2.out" })
        .to(state, { intensity: 0, duration: 0.85, ease: "power2.in" });
    }

    const sentinels = BOUNDARY_SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) triggerWarp();
        }
      },
      // Root shrunk to a thin band at the very top of the viewport, and
      // nudged to start 12% early — the burst has a head start ramping up
      // so it's near peak intensity right as the section's top edge
      // actually reaches the top of the screen, rather than only starting
      // to react after the fact.
      { rootMargin: "0px 0px -88% 0px", threshold: 0 }
    );
    sentinels.forEach((el) => observer.observe(el));

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      observer.disconnect();
      gsap.killTweensOf(state);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 37, mixBlendMode: "screen" }}
    />
  );
}
