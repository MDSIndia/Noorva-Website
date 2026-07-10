"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import gsap from "gsap";
import { motion } from "framer-motion";
import { Library, ArrowUpRight } from "lucide-react";
import {
  scrollProgress,
  lenisRef,
  galleryCaptureControl,
  acquireScrollLock,
  releaseScrollLock,
  introRevealControl,
} from "./store";
import phoneInHand from "@/assets/images/phone-in-hand-trimmed.png";

const CosmicCanvas = dynamic(() => import("./CosmicCanvas"), { ssr: false });

// CosmicCanvas's own star-blast resolves into a calm resting field by its
// internal progress ~0.45 (see CosmicCanvas.tsx). Scaling our 0-1 reveal
// progress into that range means the reveal can take however long feels
// right while always finishing on the same settled, calm frame.
const BLAST_SETTLE_P = 0.45;
const REVEAL_DURATION = 3.4; // seconds, click -> fully settled

export default function CinematicIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPlayedRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

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

  // The intro is a fixed gate, not a scrollable section — nothing below it
  // should be reachable until the click reveal has actually played out.
  useEffect(() => {
    acquireScrollLock("cosmic-intro");
    return () => releaseScrollLock("cosmic-intro");
  }, []);

  useEffect(() => {
    // Built paused — a click anywhere on the intro plays it once, replacing
    // the old scroll-scrubbed reveal with a click-triggered one. The
    // underlying CosmicCanvas is agnostic to what drives `scrollProgress`,
    // so swapping the trigger is just a matter of who calls tl.play().
    const tl = gsap.timeline({ paused: true });
    tlRef.current = tl;

    tl.to(
      { v: 0 },
      {
        v: 1,
        duration: REVEAL_DURATION,
        ease: "power1.out",
        onUpdate: function () {
          scrollProgress.value = this.targets()[0].v * BLAST_SETTLE_P;
        },
      },
      0
    );

    // hero text + phone fade in partway through the blast, then hold —
    // this becomes the static landing content once the reveal finishes.
    tl.fromTo(
      "#ci-text-1",
      { opacity: 0, y: 24, filter: "blur(12px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: REVEAL_DURATION * 0.5, ease: "power2.out" },
      REVEAL_DURATION * 0.35
    );

    return () => {
      tl.kill();
    };
  }, []);

  const handleReveal = useCallback(() => {
    if (hasPlayedRef.current) return;
    hasPlayedRef.current = true;
    gsap.to("#ci-click-hint", { opacity: 0, duration: 0.3 });
    tlRef.current?.eventCallback("onComplete", () => releaseScrollLock("cosmic-intro"));
    tlRef.current?.play();
  }, []);

  // Let WelcomeOverlay trigger this same reveal from its own dismiss click,
  // so the star blast starts immediately instead of needing a second click.
  useEffect(() => {
    introRevealControl.play = handleReveal;
    return () => {
      introRevealControl.play = null;
    };
  }, [handleReveal]);

  return (
    <section
      id="cosmic-intro"
      ref={containerRef}
      onClick={handleReveal}
      className="relative w-full h-screen overflow-hidden cursor-pointer"
      style={{ zIndex: 30 }}
    >
      <div className="absolute inset-0 overflow-hidden">

        <CosmicCanvas frameloop={inView ? "always" : "never"} />

        {/* Click hint */}
        <div
          id="ci-click-hint"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 pointer-events-none"
          style={{ opacity: 1 }}
        >
          <span className="text-[10px] tracking-[0.44em] uppercase text-white/35 font-light">
            Click anywhere to begin
          </span>
          <div className="h-2 w-2 rounded-full border border-white/40 animate-ping" />
        </div>

        {/* Hero content — fades in as the star blast settles, then stays put
            as the page's static landing once the reveal finishes. */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div
            id="ci-text-1"
            className="flex flex-col-reverse items-center gap-10 px-8 text-center lg:flex-row lg:gap-16"
            style={{ opacity: 0, filter: "blur(12px)" }}
          >
            <div className="flex flex-col items-center gap-9">
              <p
                className="max-w-md bg-clip-text text-3xl font-bold tracking-[0.1em] text-transparent uppercase md:max-w-xl md:text-5xl lg:max-w-2xl lg:text-6xl"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #ffffff 0%, #3965e5 35%, #7c5cfc 65%, #db45d7 100%)",
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
                    <Library className="h-4 w-4" strokeWidth={1.75} />
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
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
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
                <div className="relative">
                  <Image
                    src={phoneInHand}
                    alt="Noorva running on a phone"
                    className="h-auto w-[280px] drop-shadow-[0_25px_60px_rgba(124,92,252,0.35)] sm:w-[340px] lg:w-[400px]"
                    priority
                  />
                  {/* Orbit ring over the phone's screen, aligned to the logo
                      already baked into phone-in-hand-trimmed.png. Positioned
                      as a percentage of the full image (measured via pixel
                      analysis of the source PNG — the logo's true center
                      sits at 50.67%/51.47% of the image, not exactly image
                      center) so it tracks the screen correctly at every
                      breakpoint width. */}
                  <div
                    className="absolute"
                    style={{ left: "37.2%", top: "23.6%", width: "27%", height: "55.8%" }}
                  >
                    <div className="absolute top-1/2 left-1/2 aspect-square w-[80%] -translate-x-1/2 -translate-y-1/2">
                      <motion.div
                        className="absolute inset-0 rounded-full border border-dashed"
                        style={{ borderColor: "rgba(192,132,252,0.55)" }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      >
                        <span
                          className="absolute top-[-4%] left-1/2 h-[7%] w-[7%] -translate-x-1/2 rounded-full bg-[#c084fc]"
                          style={{ boxShadow: "0 0 6px 2px rgba(192,132,252,0.85)" }}
                        />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
