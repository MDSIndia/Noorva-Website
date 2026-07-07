"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollProgress, lenisRef, galleryCaptureControl } from "./store";
import mobileImage from "@/assets/images/mobileimage-trimmed.png";

const CosmicCanvas = dynamic(() => import("./CosmicCanvas"), { ssr: false });

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// CosmicCanvas's own star-blast resolves into a calm resting field by its
// internal progress ~0.45 (see CosmicCanvas.tsx). Scaling scroll progress
// into that range means the pin can be any length we like while always
// finishing on the same settled, calm frame — no dead scroll padding, no
// mid-explosion cutoff.
const BLAST_SETTLE_P = 0.45;

export default function CinematicIntro() {
  const containerRef = useRef<HTMLDivElement>(null);

  function goTo(target: string) {
    galleryCaptureControl.release?.(target === "#story-gallery" ? 0 : 1600);
    lenisRef.current?.scrollTo(target, { duration: 1.4 });
  }
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
        end: "+=1200",
        scrub: 0.8,
        pin: true,
        id: "cosmic-intro",
        onUpdate: (self) => {
          scrollProgress.value = self.progress * BLAST_SETTLE_P;
        },
      },
    });

    // 0.00-0.05  scroll hint fades
    tl.to("#ci-scroll-hint", { opacity: 0, duration: 0.05 }, 0);

    // 0.12-0.30  hero text + phone fade in, then hold — this becomes the
    // static landing content once the pin releases, so it never fades out.
    tl.fromTo("#ci-text-1",
      { opacity: 0, y: 24, filter: "blur(12px)" },
      { opacity: 1, y: 0,  filter: "blur(0px)", duration: 0.18, ease: "power2.out" }, 0.12);

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

        {/* Hero content — fades in as the star blast settles, then stays put
            as the page's static landing once the pin releases. */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div
            id="ci-text-1"
            className="flex flex-col items-center gap-10 px-8 text-center md:flex-row md:gap-16"
            style={{ opacity: 0, filter: "blur(12px)" }}
          >
            <div className="flex flex-col items-center gap-9">
              <p className="max-w-sm text-white/68 text-lg md:text-2xl font-light tracking-[0.1em] uppercase md:max-w-md">
                Intelligence like never before in your phone
              </p>

              <div className="pointer-events-auto flex flex-col items-center gap-5 sm:flex-row">
                <button
                  onClick={() => goTo("#story-gallery")}
                  className="btn-glow shrink-0 rounded-full border border-white/20 px-7 py-3 text-[11px] font-light tracking-[0.28em] text-white/80 uppercase transition-colors duration-300 hover:border-white/40 hover:text-white"
                >
                  Explore Noorva Book
                </button>

                <button
                  onClick={() => goTo("#closing")}
                  className="btn-glow shrink-0 rounded-full border px-7 py-3 text-[11px] font-light tracking-[0.28em] uppercase transition-colors duration-300"
                  style={{
                    borderColor: "rgba(232,180,120,0.5)",
                    color: "var(--accent-warm)",
                  }}
                >
                  Sign Up to Noorva
                </button>

                <a
                  href="https://mdsindia.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[10px] font-light tracking-[0.24em] text-white/40 uppercase underline-offset-4 transition-colors duration-300 hover:text-white/70 hover:underline"
                >
                  About MDS &amp; the team
                </a>
              </div>
            </div>

            <div className="pointer-events-none shrink-0">
              <Image
                src={mobileImage}
                alt="Noorva focus timer running on a phone"
                className="h-auto w-[130px] drop-shadow-[0_15px_40px_rgba(124,92,252,0.3)] md:w-[170px]"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
