"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Scene from "./Scene";
import MagneticButton from "./MagneticButton";
import { FEATURES, ACCENT_HEX } from "../FeatureShowcase/featuresData";
import { desertFlightProgress, lenisRef, galleryCaptureControl } from "../store";
import { PROXY_MAX, getDisplayIndex } from "./sceneVisibility";
import { useQualityTier, useReducedMotion, TIER_CONFIGS } from "./qualityTier";

gsap.registerPlugin(ScrollTrigger);

// How much scroll distance the whole pinned sequence consumes, in viewport
// heights. Bumped from PhoneShowcase3D.tsx's old 7 — the sweep itself also
// got longer (PROXY_MAX = 3.5, the extra 0.5 being the finale tail) and
// each unit now carries far more to read (camera flythrough + construct
// reveal/dissolve + terrain, not just a phone turn), so it needs more vh
// per unit than the old simple carousel did. Tune by feel.
const PIN_VH_MULTIPLIER = 11;

// The caption's own entrance — each line rises and settles in turn rather
// than the whole block moving/scaling/blurring together, which read as
// chaotic swooping in earlier passes. A plain, restrained rise+fade instead,
// with the container staggering each child slightly behind the last — the
// same cascading-reveal pattern most premium product sites use for a
// heading-then-detail entrance.
const CAPTION_CONTAINER_VARIANTS = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};
const CAPTION_LINE_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

function goToClosing() {
  galleryCaptureControl.release?.(1600);
  lenisRef.current?.scrollTo("#closing", { duration: 1.4 });
}

export default function DesertShowcase3D() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const tierName = useQualityTier();
  const tier = TIER_CONFIGS[tierName];
  const reducedMotion = useReducedMotion();

  // Pause the WebGL render loop entirely while the canvas is off-screen —
  // the single biggest lag source once the user has scrolled well past it.
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "200px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const proxy = { p: 0 };
    let lastDisplay = -1;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + window.innerHeight * PIN_VH_MULTIPLIER,
        pin: true,
        scrub: 0.7,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Continuous 0 -> PROXY_MAX sweep, written into desertFlightProgress
    // every scrubbed tick (unclamped — CameraRig/Terrain/every construct
    // need the full range including the finale tail for the dissolve).
    tl.to(proxy, {
      p: PROXY_MAX,
      duration: 1,
      ease: "none",
      onUpdate: () => {
        desertFlightProgress.value = proxy.p;

        // Caption switches at the same halfway point convention the rest
        // of this scroll system already uses — see getDisplayIndex's doc
        // comment.
        const displayIndex = getDisplayIndex(proxy.p);
        if (displayIndex !== lastDisplay) {
          lastDisplay = displayIndex;
          setActiveIndex(displayIndex);
        }
      },
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  const feature = FEATURES[activeIndex];
  const Icon = feature.icon;
  // The DOM-side caption chrome (accent dot, icon ring, title glow)
  // retints to the same accent Terrain.tsx/the constructs blend toward in
  // the 3D scene, so the whole section reads as one synced system rather
  // than two coincidentally similar palettes.
  const accentHex = ACCENT_HEX[feature.accent] ?? "#4fa8d5";

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-[color:var(--bg)]/70"
      style={{ zIndex: 33 }}
    >
      <div className="pointer-events-none absolute inset-0 vignette-edge" />
      {/* Cinematic top/bottom letterbox gradient — vignette-edge above
          darkens corners/edges uniformly, but a directional top+bottom
          fade on top of that reads as a proper widescreen film frame and
          adds a bit more contrast pulling the eye to the centered
          caption. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 14%, transparent 86%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Full-bleed cinematic stage — desert terrain, sky, camera
          flythrough, and the 4 per-feature holographic constructs all
          live inside this one Canvas (see Scene.tsx). */}
      <div ref={canvasWrapRef} className="absolute inset-0">
        <Scene tier={tier} reducedMotion={reducedMotion} frameloop={inView ? "always" : "never"} />
      </div>

      {/* Feature copy — dead-centered at every size, the clear focal
          point. Each line rises and fades in on its own beat
          (staggerChildren below) rather than the whole block flying in
          from a corner. */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={feature.title}
            variants={CAPTION_CONTAINER_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="pointer-events-auto flex max-w-xl flex-col items-center"
          >
            <motion.div variants={CAPTION_LINE_VARIANTS} className="mb-3 flex items-center gap-2 sm:mb-4">
              <span
                className="h-1 w-1 rounded-full transition-colors duration-700"
                style={{ background: accentHex, boxShadow: `0 0 6px ${accentHex}` }}
              />
              <p className="text-[9px] tracking-[0.4em] text-[color:var(--accent-warm)]/70 uppercase sm:text-xs">
                What Noorva Becomes
              </p>
              <span className="font-mono text-[9px] tracking-widest text-white/25 sm:text-[10px]">
                0{activeIndex + 1}/0{FEATURES.length}
              </span>
            </motion.div>
            <motion.div variants={CAPTION_LINE_VARIANTS} className="mb-5 flex flex-col items-center gap-4 sm:mb-7">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-white/5 backdrop-blur-sm transition-colors duration-700 sm:h-12 sm:w-12"
                style={{ borderColor: `${accentHex}55`, boxShadow: `0 0 18px ${accentHex}33` }}
              >
                <Icon className="h-4 w-4 sm:h-6 sm:w-6" style={{ color: feature.accent }} strokeWidth={1.5} />
              </div>
              <h3
                className="font-playfair text-5xl font-light tracking-tight text-white/95 transition-[text-shadow] duration-700 sm:text-6xl md:text-7xl lg:text-8xl"
                style={{ textShadow: `0 0 40px ${accentHex}4d, 0 0 84px ${accentHex}26` }}
              >
                {feature.title}
              </h3>
            </motion.div>
            <motion.p
              variants={CAPTION_LINE_VARIANTS}
              className="mb-7 max-w-md text-sm leading-relaxed font-light text-white/55 sm:text-base md:mb-9 md:text-lg"
            >
              {feature.body}
            </motion.p>
            <motion.div variants={CAPTION_LINE_VARIANTS} className="flex flex-col items-center gap-7">
              <MagneticButton onClick={goToClosing} accentHex={accentHex}>
                <span className="group inline-flex items-center gap-2">
                  Get Started
                  <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </MagneticButton>

              {/* Progress indicator — glowing lines with a single
                  highlight that slides between segments (layoutId) as
                  the feature changes, rather than each segment
                  independently transitioning its own width/color. */}
              <div className="flex items-center gap-2">
                {FEATURES.map((f, i) => (
                  <span key={f.title} className="relative h-[3px] w-8 overflow-hidden rounded-full bg-white/10">
                    {i === activeIndex && (
                      <motion.span
                        layoutId="features-progress-glow"
                        className="absolute inset-0 rounded-full"
                        style={{ background: "var(--accent-warm)", boxShadow: "0 0 12px var(--accent-warm)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
