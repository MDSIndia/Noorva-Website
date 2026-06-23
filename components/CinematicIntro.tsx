"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollProgress } from "./store";

const CosmicCanvas = dynamic(() => import("./CosmicCanvas"), { ssr: false });

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/*
 * SCROLL MAP  (0 → 1 over the 800vh section)
 * ────────────────────────────────────────────
 * 0.00–0.04  black void + scroll hint
 * 0.04–0.18  star fades in, grows, pulses
 * 0.18–0.24  star compresses / charges
 * 0.24–0.42  star EXPLODES  → shockwave rings
 * 0.42–0.60  cosmos / galaxy forms
 * 0.60–0.74  Earth appears, rotates
 * 0.74–0.84  camera flies toward Earth
 * 0.84–0.93  Earth engulfs camera → portal flash
 * 0.93–1.00  Noorva brand reveal
 */

export default function CinematicIntro() {
  const containerRef = useRef<HTMLDivElement>(null);

  const progressRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const tl = gsap.timeline({ paused: true });

    /* ── Scroll hint: visible immediately, fades before first text */
    tl.to("#ci-scroll-hint",
      { opacity: 0, duration: 0.04 },
      0.02
    );

    /* ── Scene 1 → 2: "In the beginning…" */
    tl.fromTo("#ci-text-1",
      { opacity: 0, y: 20, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.06, ease: "power2.out" },
      0.07
    );
    tl.to("#ci-text-1",
      { opacity: 0, y: -16, filter: "blur(6px)", duration: 0.05, ease: "power2.in" },
      0.17
    );

    /* ── Scene 3 → 4: Explosion text */
    tl.fromTo("#ci-text-2",
      { opacity: 0, scale: 0.85, filter: "blur(14px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.07, ease: "power3.out" },
      0.28
    );
    tl.to("#ci-text-2",
      { opacity: 0, scale: 1.08, duration: 0.06, ease: "power2.in" },
      0.43
    );

    /* ── Scene 4 → 5: "A universe unfolds" */
    tl.fromTo("#ci-text-3",
      { opacity: 0, y: 22, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.06, ease: "power2.out" },
      0.50
    );
    tl.to("#ci-text-3",
      { opacity: 0, y: -16, duration: 0.05, ease: "power2.in" },
      0.62
    );

    /* ── Scene 5: Earth / "A fragile, perfect world" */
    tl.fromTo("#ci-text-4",
      { opacity: 0, y: 18, filter: "blur(6px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.07, ease: "power2.out" },
      0.63
    );
    tl.to("#ci-text-4",
      { opacity: 0, y: -14, duration: 0.05, ease: "power2.in" },
      0.74
    );

    /* ── Earth entry portal radial flash */
    tl.fromTo("#ci-portal",
      { opacity: 0, scale: 0.55 },
      { opacity: 1, scale: 1.35, duration: 0.10, ease: "power2.in" },
      0.83
    );
    tl.to("#ci-portal",
      { opacity: 0, scale: 2.0, duration: 0.08, ease: "power2.out" },
      0.93
    );

    /* ── Noorva brand reveal */
    tl.fromTo("#ci-noorva-wrap",
      { opacity: 0, scale: 0.88, filter: "blur(24px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.10, ease: "power3.out" },
      0.91
    );
    tl.fromTo("#ci-noorva-line",
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.07, ease: "power2.out" },
      0.96
    );
    tl.fromTo("#ci-noorva-tag",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.06, ease: "power2.out" },
      0.97
    );

    if (window.scrollY > 0) {
      progressRef.current = 1;
      scrollProgress.value = 1;
      tl.progress(1);
    } else {
      progressRef.current = 0;
      scrollProgress.value = 0;
      tl.progress(0);
    }

    const handleWheel = (e: WheelEvent) => {
      const isScrollingDown = e.deltaY > 0;
      const isScrollingUp = e.deltaY < 0;

      if (isScrollingDown && progressRef.current < 1) {
        e.preventDefault();
        progressRef.current = clamp(progressRef.current + e.deltaY * 0.0008, 0, 1);
        scrollProgress.value = progressRef.current;
      } else if (isScrollingUp && window.scrollY <= 0 && progressRef.current > 0) {
        e.preventDefault();
        progressRef.current = clamp(progressRef.current + e.deltaY * 0.0008, 0, 1);
        scrollProgress.value = progressRef.current;
      }
    };

    let lastTouchY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const deltaY = lastTouchY - touchY;
      lastTouchY = touchY;

      const isScrollingDown = deltaY > 0;
      const isScrollingUp = deltaY < 0;

      if (isScrollingDown && progressRef.current < 1) {
        e.preventDefault();
        progressRef.current = clamp(progressRef.current + deltaY * 0.002, 0, 1);
        scrollProgress.value = progressRef.current;
      } else if (isScrollingUp && window.scrollY <= 0 && progressRef.current > 0) {
        e.preventDefault();
        progressRef.current = clamp(progressRef.current + deltaY * 0.002, 0, 1);
        scrollProgress.value = progressRef.current;
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    let rafId = 0;
    const tick = () => {
      const current = tl.progress();
      const target = scrollProgress.value;
      
      if (Math.abs(current - target) > 0.00001) {
        // Reduced to 0.02 for a heavy, syrupy "liquid flow" feel
        tl.progress(current + (target - current) * 0.02);
      }
      
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      cancelAnimationFrame(rafId);
      tl.kill();
    };
  }, []);

  return (
    <section
      id="cosmic-intro"
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-black"
    >
      {/* ── Fullscreen viewport ─────────────────────────── */}
      <div className="absolute top-0 left-0 w-full h-screen overflow-hidden bg-black">

        {/* ── WebGL Canvas ──────────────────────────────────────── */}
        <CosmicCanvas />

        {/* ── Scroll Hint ───────────────────────────────────────── */}
        <div
          id="ci-scroll-hint"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20
                     flex flex-col items-center gap-2 pointer-events-none"
          style={{ opacity: 1 }}
        >
          <span className="text-[10px] tracking-[0.42em] uppercase text-white/38">
            Scroll to begin
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-white/28 to-transparent animate-pulse" />
        </div>

        {/* ── Text overlays ─────────────────────────────────────── */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">

          {/* Scene 2 */}
          <p
            id="ci-text-1"
            className="absolute text-center px-8
                       text-white/72 text-xl md:text-2xl font-light tracking-[0.30em] uppercase"
            style={{ opacity: 0, filter: "blur(10px)" }}
          >
            A Star Blast
          </p>

          {/* Scene 3 — explosion */}
          <div
            id="ci-text-2"
            className="absolute text-center px-8"
            style={{ opacity: 0, filter: "blur(14px)" }}
          >
            <p className="text-[9px] md:text-[11px] tracking-[0.52em] uppercase text-cyan-200/55 mb-3">
              The universe awakens
            </p>
            <h2
              className="text-5xl md:text-7xl lg:text-[5.5rem] font-extralight tracking-[-0.02em] text-white"
              style={{
                textShadow:
                  "0 0 55px rgba(100,170,255,0.85), 0 0 110px rgba(70,110,255,0.45)",
              }}
            >
              It becomes<br />Cosmos
            </h2>
          </div>

          {/* Scene 4 — cosmos */}
          <p
            id="ci-text-3"
            className="absolute text-center px-8
                       text-white/68 text-xl md:text-2xl font-light tracking-[0.24em] uppercase"
            style={{ opacity: 0, filter: "blur(8px)" }}
          >
            And expands forever
          </p>

          {/* Scene 5 — Earth */}
          <div
            id="ci-text-4"
            className="absolute text-center px-8"
            style={{ opacity: 0, filter: "blur(6px)" }}
          >
            <p className="text-[9px] md:text-[11px] tracking-[0.52em] uppercase text-blue-200/52 mb-3">
              Within it all
            </p>
            <p className="text-3xl md:text-5xl font-extralight text-white/82 tracking-[0.06em]">
              A fragile, perfect world
            </p>
          </div>
        </div>

        {/* ── Earth portal flash ────────────────────────────────── */}
        <div
          id="ci-portal"
          className="absolute inset-[-35%] z-[8] pointer-events-none"
          style={{
            opacity: 0,
            background:
              "radial-gradient(circle at center," +
              "rgba(215,238,255,0.94) 0%," +
              "rgba(45,125,255,0.48) 13%," +
              "rgba(75,35,195,0.22) 30%," +
              "rgba(0,0,0,0) 60%)",
            mixBlendMode: "screen",
          }}
        />

        {/* ── Noorva brand reveal ───────────────────────────────── */}
        <div
          id="ci-noorva-wrap"
          className="absolute inset-0 z-20 flex items-center justify-center
                     px-6 pointer-events-none"
          style={{ opacity: 0, filter: "blur(24px)" }}
        >
          <div className="relative text-center max-w-5xl">
            {/* Ambient glow */}
            <div
              className="absolute inset-[-150px] -z-10 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(85,55,215,0.24) 0%, transparent 62%)",
              }}
            />

            <p className="mb-6 text-[9px] md:text-[11px] tracking-[0.56em] uppercase text-cyan-100/48">
              Welcome to the world within
            </p>

            <h1
              className="font-[var(--font-playfair)] text-[4rem] md:text-[7.5rem] lg:text-[9.5rem]
                         leading-none tracking-[-0.06em] text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(148deg,#ffffff 10%,#b6dbff 44%,#d2bcff 72%,#ffffff 92%)",
              }}
            >
              Noorva
            </h1>

            <div
              id="ci-noorva-line"
              className="mx-auto my-7 h-px w-56 origin-center
                         bg-gradient-to-r from-transparent via-cyan-200/72 to-transparent"
              style={{ opacity: 0 }}
            />

            <p
              id="ci-noorva-tag"
              className="text-sm md:text-lg tracking-[0.18em] uppercase text-white/52"
              style={{ opacity: 0 }}
            >
              Intelligence that understands the human journey
            </p>
          </div>
        </div>

        {/* ── Vignette ──────────────────────────────────────────── */}
        <div
          className="absolute inset-0 z-[5] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.75) 100%)",
          }}
        />
      </div>
    </section>
  );
}
