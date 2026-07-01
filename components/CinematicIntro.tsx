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

export default function CinematicIntro() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: "+=2400",
        scrub: 0.8,
        pin: true,
        onUpdate: (self) => {
          scrollProgress.value = self.progress;
        },
      },
    });

    // 0.00-0.06  scroll hint fades
    tl.to("#ci-scroll-hint", { opacity: 0, duration: 0.06 }, 0);

    // 0.04-0.16  "A spark of intelligence"
    tl.fromTo("#ci-text-1",
      { opacity: 0, y: 24, filter: "blur(12px)" },
      { opacity: 1, y: 0,  filter: "blur(0px)", duration: 0.07, ease: "power2.out" }, 0.04);
    tl.to("#ci-text-1",
      { opacity: 0, y: -20, filter: "blur(8px)", duration: 0.05, ease: "power2.in" }, 0.13);

    // 0.18-0.42  Earth text
    tl.fromTo("#ci-text-4",
      { opacity: 0, y: 22, filter: "blur(8px)" },
      { opacity: 1, y: 0,  filter: "blur(0px)", duration: 0.08, ease: "power2.out" }, 0.18);
    tl.to("#ci-text-4",
      { opacity: 0, y: -16, filter: "blur(6px)", duration: 0.06, ease: "power2.in" }, 0.36);

    // 0.50-0.72  Noorva brand
    tl.fromTo("#ci-noorva-wrap",
      { opacity: 0, scale: 0.90, filter: "blur(28px)" },
      { opacity: 1, scale: 1,    filter: "blur(0px)", duration: 0.07, ease: "power3.out" }, 0.50);
    tl.fromTo("#ci-noorva-line",
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.05, ease: "power2.out" }, 0.58);
    tl.fromTo("#ci-noorva-tag",
      { y: 18, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.04, ease: "power2.out" }, 0.63);

    // 0.84-1.00  fade entire intro to black before story section appears
    tl.to("#ci-fade-out",
      { opacity: 1, duration: 0.16, ease: "power2.inOut" }, 0.84);

    return () => { tl.kill(); };
  }, []);

  return (
    <section
      id="cosmic-intro"
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-black"
    >
      <div className="absolute inset-0 overflow-hidden bg-black">

        <CosmicCanvas />

        {/* Scroll hint */}
        <div
          id="ci-scroll-hint"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
          style={{ opacity: 1 }}
        >
          <span className="text-[10px] tracking-[0.44em] uppercase text-white/35 font-light">
            Scroll to continue
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-white/25 to-transparent animate-pulse" />
        </div>

        {/* Text overlays */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <p
            id="ci-text-1"
            className="absolute text-center px-8 text-white/68 text-xl md:text-2xl font-light tracking-[0.32em] uppercase"
            style={{ opacity: 0, filter: "blur(12px)" }}
          >
            A spark of intelligence
          </p>

          <div
            id="ci-text-4"
            className="absolute text-center px-8"
            style={{ opacity: 0, filter: "blur(8px)" }}
          >
            <p className="text-[9px] md:text-[11px] tracking-[0.52em] uppercase text-cyan-100/45 mb-3">
              Precision in every moment
            </p>
            <p className="text-3xl md:text-5xl font-extralight text-white/78 tracking-[0.04em]">
              People deserve an intelligence that feels intentional
            </p>
          </div>
        </div>

        {/* Noorva reveal */}
        <div
          id="ci-noorva-wrap"
          className="absolute inset-0 z-20 flex items-center justify-center px-6 pointer-events-none"
          style={{ opacity: 0, filter: "blur(28px)" }}
        >
          <div className="relative text-center max-w-5xl">
            <div
              className="absolute inset-[-180px] -z-10 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(80,50,200,0.20) 0%, transparent 62%)",
              }}
            />
            <p className="mb-5 text-[9px] tracking-[0.58em] uppercase text-cyan-100/40 font-light">
              Precision, presence, polish
            </p>
            <h1
              className="font-[var(--font-playfair)] text-[3.8rem] md:text-[7rem] lg:text-[9rem] leading-none tracking-[-0.06em] text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(148deg, #ffffff 10%, #c4b5fd 40%, #8cc5ff 68%, #ffffff 92%)",
              }}
            >
              Noorva
            </h1>
            <div
              id="ci-noorva-line"
              className="mx-auto my-6 h-px w-48 origin-center bg-gradient-to-r from-transparent via-cyan-200/65 to-transparent"
              style={{ opacity: 0 }}
            />
            <p
              id="ci-noorva-tag"
              className="text-sm md:text-base tracking-[0.20em] uppercase text-white/45 font-light"
              style={{ opacity: 0 }}
            >
              Luxury intelligence, simply stated
            </p>
          </div>
        </div>

        {/* Black fade-out overlay — covers everything at end of intro */}
        <div
          id="ci-fade-out"
          className="absolute inset-0 z-30 bg-black pointer-events-none"
          style={{ opacity: 0 }}
        />
      </div>
    </section>
  );
}
