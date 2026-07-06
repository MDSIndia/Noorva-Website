"use client";

import { useEffect, useRef, useState } from "react";
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
  // The WebGL scene is expensive to keep rendering forever — pause its render
  // loop once the section scrolls out of view (it's the biggest lag source
  // once the user is deep into the story chapters below).
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

    // 0.48-0.90  fade entire intro to black before story section appears
    tl.to("#ci-fade-out",
      { opacity: 1, duration: 0.42, ease: "power2.inOut" }, 0.48);

    return () => { tl.kill(); };
  }, []);

  return (
    <section
      id="cosmic-intro"
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-black"
      style={{ zIndex: 30 }}
    >
      <div className="absolute inset-0 overflow-hidden bg-black">

        <CosmicCanvas frameloop={inView ? "always" : "never"} />

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
