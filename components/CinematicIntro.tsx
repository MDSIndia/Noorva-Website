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

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: "+=4000",
        scrub: 1.5,
        pin: true,
        snap: {
          snapTo: [0, 0.12, 0.35, 0.56, 0.68, 0.82, 1],
          duration: { min: 0.2, max: 1.0 },
          delay: 0.1,
          ease: "power2.inOut"
        },
        onUpdate: (self) => {
          scrollProgress.value = self.progress;
        }
      }
    });

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

    /* ── Earth entry portal radial flash ────────────────────────── */
    tl.fromTo("#ci-portal",
      { opacity: 0, scale: 0.55 },
      { opacity: 1, scale: 1.35, duration: 0.04, ease: "power2.in" },
      0.72
    );
    tl.to("#ci-portal",
      { opacity: 0, scale: 2.0, duration: 0.04, ease: "power2.out" },
      0.76
    );

    /* ── Campfire Ancestors Scene Overlay (Before Noorva) ───── */
    tl.fromTo("#ci-campfire-wrap",
      { opacity: 0, filter: "blur(8px)" },
      { opacity: 1, filter: "blur(0px)", duration: 0.04, ease: "power2.out" },
      0.75
    );
    tl.fromTo("#ci-campfire-img",
      { scale: 1.0 },
      { scale: 1.45, duration: 0.14, ease: "none" },
      0.75
    );
    tl.to("#ci-campfire-wrap",
      { opacity: 0, filter: "blur(12px)", duration: 0.04, ease: "power2.in" },
      0.85
    );

    /* ── Noorva brand reveal ───────────────────────────────── */
    tl.fromTo("#ci-noorva-wrap",
      { opacity: 0, scale: 0.88, filter: "blur(24px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.05, ease: "power3.out" },
      0.90
    );
    tl.fromTo("#ci-noorva-line",
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.03, ease: "power2.out" },
      0.95
    );
    tl.fromTo("#ci-noorva-tag",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.02, ease: "power2.out" },
      0.97
    );

    return () => {
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

          {/* Scene 2 — spark of intelligence */}
          <p
            id="ci-text-1"
            className="absolute text-center px-8
                       text-white/72 text-xl md:text-2xl font-light tracking-[0.30em] uppercase"
            style={{ opacity: 0, filter: "blur(10px)" }}
          >
            A spark of intelligence
          </p>

          {/* Scene 3 — knowledge expands */}
          <div
            id="ci-text-2"
            className="absolute text-center px-8"
            style={{ opacity: 0, filter: "blur(14px)" }}
          >
            <p className="text-[9px] md:text-[11px] tracking-[0.52em] uppercase text-cyan-200/55 mb-3">
              Knowledge awakens
            </p>
            <h2
              className="text-5xl md:text-7xl lg:text-[5.5rem] font-extralight tracking-[-0.02em] text-white"
              style={{
                textShadow:
                  "0 0 55px rgba(100,170,255,0.85), 0 0 110px rgba(70,110,255,0.45)",
              }}
            >
              It grows.<br />It connects.
            </h2>
          </div>

          {/* Scene 4 — intelligence reaches humanity */}
          <p
            id="ci-text-3"
            className="absolute text-center px-8
                       text-white/68 text-xl md:text-2xl font-light tracking-[0.24em] uppercase"
            style={{ opacity: 0, filter: "blur(8px)" }}
          >
            And finds its purpose in people
          </p>

          {/* Scene 5 — Earth / human world */}
          <div
            id="ci-text-4"
            className="absolute text-center px-8"
            style={{ opacity: 0, filter: "blur(6px)" }}
          >
            <p className="text-[9px] md:text-[11px] tracking-[0.52em] uppercase text-blue-200/52 mb-3">
              In a world full of noise
            </p>
            <p className="text-3xl md:text-5xl font-extralight text-white/82 tracking-[0.06em]">
              People need a guide they can trust
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

        {/* ── Campfire Ancestors Scene Overlay (Before Noorva) ───── */}
        <div
          id="ci-campfire-wrap"
          className="absolute inset-0 z-[12] w-full h-screen pointer-events-none overflow-hidden"
          style={{ opacity: 0 }}
        >
          <img
            id="ci-campfire-img"
            src="/ancestors_campfire.png"
            alt="Ancestors sitting around a campfire"
            className="absolute inset-0 w-full h-full object-cover origin-center opacity-100"
            style={{ transform: "scale(1.0)" }}
          />
          {/* Subtle warm ambient lighting overlay */}
          <div className="absolute inset-0 bg-radial-gradient pointer-events-none"
            style={{
              background: "radial-gradient(circle at center, rgba(230,82,10,0.15) 0%, transparent 80%)",
            }}
          />
          {/* Dark gradient only at the very bottom to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

          {/* Centered at the bottom of the screen */}
          <div className="absolute bottom-16 md:bottom-24 left-0 right-0 px-6 flex flex-col items-center text-center">
            <span className="text-[10px] tracking-[0.45em] uppercase text-amber-500/90 mb-4 font-semibold">
              Before Noorva
            </span>
            <h2 className="font-[var(--font-playfair)] text-3xl md:text-5xl lg:text-6xl text-white leading-tight font-extralight tracking-tight max-w-4xl mb-6">
              We gathered around the fire, <br />
              <span className="italic text-amber-100/90 font-light">sharing stories in the dark.</span>
            </h2>
            <p className="max-w-2xl text-xs md:text-sm leading-relaxed text-white/60 font-light">
              For generations, our ancestors sat under the stars. They built fires to keep the wild at bay, connecting through the shared experience of storytelling.
            </p>
          </div>
        </div>

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
              The Future of Connection
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
