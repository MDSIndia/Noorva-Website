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
 * SCROLL MAP  (0 to 1 over the 600vh section)
 * 0.00-0.04  black void + scroll hint
 * 0.00-0.18  star appears and BLASTS
 * 0.16-0.60  Earth appears, rotates, camera approaches
 * 0.55-0.80  Noorva brand reveal
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
        end: "+=3000",
        scrub: 1.5,
        pin: true,
        snap: {
          snapTo: [0, 0.06, 0.20, 0.55, 1],
          duration: { min: 0.2, max: 1.0 },
          delay: 0.1,
          ease: "power2.inOut"
        },
        onUpdate: (self) => {
          scrollProgress.value = self.progress;
        }
      }
    });

    tl.to("#ci-scroll-hint",
      { opacity: 0, duration: 0.04 },
      0.02
    );

    tl.fromTo("#ci-text-1",
      { opacity: 0, y: 20, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.06, ease: "power2.out" },
      0.04
    );
    tl.to("#ci-text-1",
      { opacity: 0, y: -16, filter: "blur(6px)", duration: 0.04, ease: "power2.in" },
      0.14
    );

    tl.fromTo("#ci-text-4",
      { opacity: 0, y: 18, filter: "blur(6px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.07, ease: "power2.out" },
      0.20
    );
    tl.to("#ci-text-4",
      { opacity: 0, y: -14, duration: 0.05, ease: "power2.in" },
      0.38
    );

    tl.fromTo("#ci-noorva-wrap",
      { opacity: 0, scale: 0.88, filter: "blur(24px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.06, ease: "power3.out" },
      0.52
    );
    tl.fromTo("#ci-noorva-line",
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.04, ease: "power2.out" },
      0.60
    );
    tl.fromTo("#ci-noorva-tag",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.03, ease: "power2.out" },
      0.64
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
      <div className="absolute top-0 left-0 w-full h-screen overflow-hidden bg-black">

        <CosmicCanvas />

        <div
          id="ci-scroll-hint"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
          style={{ opacity: 1 }}
        >
          <span className="text-[10px] tracking-[0.42em] uppercase text-white/38">
            Scroll to begin
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-white/28 to-transparent animate-pulse" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">

          <p
            id="ci-text-1"
            className="absolute text-center px-8 text-white/72 text-xl md:text-2xl font-light tracking-[0.30em] uppercase"
            style={{ opacity: 0, filter: "blur(10px)" }}
          >
            A spark of intelligence
          </p>

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

        <div
          id="ci-noorva-wrap"
          className="absolute inset-0 z-20 flex items-center justify-center px-6 pointer-events-none"
          style={{ opacity: 0, filter: "blur(24px)" }}
        >
          <div className="relative text-center max-w-5xl">
            <div
              className="absolute inset-[-150px] -z-10 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(85,55,215,0.24) 0%, transparent 62%)"
              }}
            />

            <p className="mb-6 text-[9px] md:text-[11px] tracking-[0.56em] uppercase text-cyan-100/48">
              The Future of Connection
            </p>

            <h1
              className="font-[var(--font-playfair)] text-[4rem] md:text-[7.5rem] lg:text-[9.5rem] leading-none tracking-[-0.06em] text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(148deg,#ffffff 10%,#b6dbff 44%,#d2bcff 72%,#ffffff 92%)"
              }}
            >
              Noorva
            </h1>

            <div
              id="ci-noorva-line"
              className="mx-auto my-7 h-px w-56 origin-center bg-gradient-to-r from-transparent via-cyan-200/72 to-transparent"
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

        <div
          className="absolute inset-0 z-[5] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.75) 100%)"
          }}
        />
      </div>
    </section>
  );
}