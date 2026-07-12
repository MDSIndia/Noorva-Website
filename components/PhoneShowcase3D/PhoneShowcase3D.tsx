"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Scene from "./Scene";
import { FEATURES } from "../FeatureShowcase/featuresData";
import { phoneCarouselX, lenisRef, galleryCaptureControl } from "../store";

gsap.registerPlugin(ScrollTrigger);

// How much scroll distance the whole pinned sequence consumes, in viewport
// heights — one full phone rotation happens per feature (see
// PhoneModel.tsx's ROTATION_PER_FEATURE), so this needs to be long enough
// that a full turn doesn't fly by in a single wheel notch.
const PIN_VH_MULTIPLIER = 7;

// Where the feature copy's entrance animation originates from — a
// different corner each time, so the text visibly flies in off-screen like
// a video title card rather than just fading in place. It always lands in
// the same resting spot (beside the phone on desktop — see textSide below —
// or the stacked caption on mobile), so only the entrance/exit direction
// varies, not the resting layout.
const ENTRY_CORNERS: { x: number; y: number }[] = [
  { x: -340, y: -160 }, // top-left
  { x: 340, y: -160 }, // top-right
  { x: -340, y: 160 }, // bottom-left
  { x: 340, y: 160 }, // bottom-right
];

function goToClosing() {
  galleryCaptureControl.release?.(1600);
  lenisRef.current?.scrollTo("#closing", { duration: 1.4 });
}

export default function PhoneShowcase3D() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [inView, setInView] = useState(false);
  // Below the lg breakpoint the caption stacks beneath the phone (no room
  // for a side panel), so PhoneModel.tsx still needs to raise the phone up
  // to leave room for it there. At lg+ the caption moves beside the phone
  // instead, so the phone can sit fully centered with no reserved gap.
  const [isDesktop, setIsDesktop] = useState(false);

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
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
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

    // Continuous 0 -> (N-1) sweep, read directly by PhoneModel.tsx every
    // frame to drive its scroll-linked rotation (one full turn per whole
    // number crossed).
    tl.to(proxy, {
      p: FEATURES.length - 1,
      duration: 1,
      ease: "none",
      onUpdate: () => {
        phoneCarouselX.value = proxy.p;
        const idxA = Math.max(0, Math.min(FEATURES.length - 1, Math.floor(proxy.p)));
        const idxB = Math.min(FEATURES.length - 1, idxA + 1);
        const blend = proxy.p - idxA;

        // The screen content and the caption both switch at blend = 0.5 —
        // exactly when PhoneModel.tsx's rotation (phoneCarouselX * 2π) has
        // the phone turned all the way to its back, hidden from the
        // camera. Text exits as the phone starts turning away (blend just
        // past 0), and the new text/screen are both in place by the time
        // it turns back to face forward (blend approaching 1 -> the next
        // integer), so nothing changes while it's actually visible.
        const displayIndex = blend >= 0.5 ? idxB : idxA;
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
  const corner = ENTRY_CORNERS[activeIndex % ENTRY_CORNERS.length];
  const textIsLeft = feature.textSide === "left";

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-[color:var(--bg)]/70"
      style={{ zIndex: 33 }}
    >
      <div className="pointer-events-none absolute inset-0 vignette-edge" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2">
        <div className="h-full w-full rounded-full bg-[color:var(--accent-1)]/8 blur-[140px] animate-float-slow" />
      </div>

      {/* Full-bleed centered stage — the phone stays put in the middle and
          only turns in place now; nothing slides to a corner anymore. */}
      <div ref={canvasWrapRef} className="absolute inset-0">
        <Scene activeIndex={activeIndex} isDesktop={isDesktop} frameloop={inView ? "always" : "never"} />
      </div>

      {/* Feature copy — stacked below the phone on mobile (no room for a
          side panel there), but beside it on desktop, alternating left/right
          per feature (feature.textSide) since the phone itself now stays
          fixed in the center rather than moving to meet the text. Flies in
          from a different corner each time (ENTRY_CORNERS) rather than
          fading in place, like a video title card. */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-8 pb-6 sm:pb-9 lg:inset-y-0 lg:bottom-auto lg:h-full lg:items-center lg:px-12 lg:pb-0 xl:px-24 ${
          textIsLeft ? "lg:justify-start" : "lg:justify-end"
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, x: corner.x, y: corner.y, scale: 0.72, filter: "blur(14px)" }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -corner.x * 0.5, y: -corner.y * 0.5, scale: 0.85, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-auto flex max-w-md flex-col items-center text-center lg:max-w-sm ${
              textIsLeft ? "lg:items-start lg:text-left" : "lg:items-end lg:text-right"
            }`}
          >
            <p className="mb-1.5 text-[9px] tracking-[0.4em] text-[color:var(--accent-warm)]/70 uppercase lg:mb-3 lg:text-xs">
              What Noorva Becomes
            </p>
            <div
              className={`mb-1.5 flex items-center gap-2 lg:mb-4 lg:flex-col lg:items-start lg:gap-4 ${
                textIsLeft ? "" : "lg:items-end"
              }`}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 lg:h-11 lg:w-11">
                <Icon className="h-3.5 w-3.5 lg:h-5 lg:w-5" style={{ color: feature.accent }} strokeWidth={1.5} />
              </div>
              <h3 className="font-playfair text-2xl font-light text-white/95 md:text-3xl lg:text-5xl">
                {feature.title}
              </h3>
            </div>
            <p className="mb-3 max-w-sm text-xs leading-relaxed font-light text-white/55 md:text-sm lg:mb-7 lg:text-base">
              {feature.body}
            </p>
            <div className="flex items-center gap-4 lg:flex-col lg:items-stretch lg:gap-6">
              <button
                onClick={goToClosing}
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-medium tracking-[0.14em] text-white/80 uppercase backdrop-blur-xl transition-colors duration-300 hover:border-[color:var(--accent-warm)]/40 hover:text-white lg:justify-center lg:px-5 lg:py-2.5 lg:text-[11px]"
              >
                Get Started
                <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>

              {/* Progress dots — which of the 4 features is currently active */}
              <div className={`flex items-center gap-1.5 ${textIsLeft ? "" : "lg:justify-end"}`}>
                {FEATURES.map((f, i) => (
                  <span
                    key={f.title}
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: i === activeIndex ? 20 : 6,
                      background: i === activeIndex ? "var(--accent-warm)" : "rgba(255,255,255,0.18)",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
