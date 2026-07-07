"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { BookOpen, Sparkles } from "lucide-react";
import { scrollProgress, lenisRef, galleryCaptureControl } from "./store";
import phoneInHand from "@/assets/images/phone-in-hand-trimmed.png";

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
        end: "+=350",
        scrub: 0.6,
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
      className="relative w-full h-screen overflow-hidden"
      style={{ zIndex: 30 }}
    >
      <div className="absolute inset-0 overflow-hidden">

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
            className="flex flex-col items-center gap-10 px-8 text-center lg:flex-row lg:gap-16"
            style={{ opacity: 0, filter: "blur(12px)" }}
          >
            <div className="flex flex-col items-center gap-9">
              <p
                className="max-w-md bg-clip-text text-3xl font-bold tracking-[0.1em] text-transparent uppercase md:max-w-xl md:text-5xl lg:max-w-2xl lg:text-6xl"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #3965e5 0%, #7c5cfc 50%, #db45d7 100%)",
                }}
              >
                Intelligence Like
                <br />
                Never Before In
                <br />
                Your Hands
              </p>

              <div className="pointer-events-auto flex flex-col items-center gap-5 sm:flex-row">
                <button
                  onClick={() => goTo("#story-gallery")}
                  className="group relative shrink-0 rounded-full p-[1.5px] transition-transform duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #3965e5, #7c5cfc, #db45d7)",
                    boxShadow: "0 0 28px rgba(124,92,252,0.4)",
                  }}
                >
                  <span className="btn-glow flex items-center gap-2 rounded-full bg-black/85 px-7 py-3 text-[11px] font-semibold tracking-[0.28em] text-white uppercase backdrop-blur-xl transition-colors duration-300 group-hover:bg-black/70">
                    <BookOpen className="h-4 w-4" strokeWidth={1.75} />
                    Noorva Book
                  </span>
                </button>

                <button
                  onClick={() => goTo("#closing")}
                  className="group relative shrink-0 rounded-full p-[1.5px] transition-transform duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #e8b478, #db45d7, #7c5cfc)",
                    boxShadow: "0 0 28px rgba(232,180,120,0.4)",
                  }}
                >
                  <span
                    className="btn-glow flex items-center gap-2 rounded-full bg-black/85 px-7 py-3 text-[11px] font-semibold tracking-[0.28em] uppercase backdrop-blur-xl transition-colors duration-300 group-hover:bg-black/70"
                    style={{ color: "var(--accent-warm)" }}
                  >
                    <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                    Join Noorva
                  </span>
                </button>
              </div>
            </div>

            <div className="relative pointer-events-none shrink-0" style={{ perspective: 1200 }}>
              <motion.div
                animate={{ y: [0, -16, 0], rotateY: [-6, 6, -6] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src={phoneInHand}
                  alt="Noorva running on a phone"
                  className="h-auto w-[280px] drop-shadow-[0_25px_60px_rgba(124,92,252,0.35)] sm:w-[340px] lg:w-[400px]"
                  priority
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
