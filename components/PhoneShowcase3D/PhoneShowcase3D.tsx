"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Scene from "./Scene";
import type { PhoneModelHandle } from "./PhoneModel";
import { FEATURES } from "../FeatureShowcase/featuresData";
import { phoneShowRotation, lenisRef, galleryCaptureControl } from "../store";

gsap.registerPlugin(ScrollTrigger);

// One full 360deg turn per feature, four features — see the master spec's
// own checkpoint table (Feature 1 -> 0deg ... Feature 4 -> 1080deg, exit at 1440deg).
const DEG_PER_FEATURE = 360;
const TOTAL_DEG = DEG_PER_FEATURE * FEATURES.length;
// How much scroll distance the whole pinned sequence consumes, in viewport
// heights — long enough that each 360deg turn doesn't fly by too fast.
const PIN_VH_MULTIPLIER = 3.6;

function goToClosing() {
  galleryCaptureControl.release?.(1600);
  lenisRef.current?.scrollTo("#closing", { duration: 1.4 });
}

export default function PhoneShowcase3D() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<PhoneModelHandle>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [inView, setInView] = useState(false);

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

    const rotationProxy = { deg: 0 };
    let lastIndex = -1;

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

    tl.to(rotationProxy, {
      deg: TOTAL_DEG,
      duration: 1,
      ease: "none",
      onUpdate: () => {
        phoneShowRotation.value = rotationProxy.deg;
        const idx = Math.min(FEATURES.length - 1, Math.floor(rotationProxy.deg / DEG_PER_FEATURE));
        if (idx !== lastIndex) {
          lastIndex = idx;
          setActiveIndex(idx);
          phoneRef.current?.pulse();
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

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-[color:var(--bg)]/70"
      style={{ zIndex: 28 }}
    >
      <div className="pointer-events-none absolute inset-0 vignette-edge" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2">
        <div className="h-full w-full rounded-full bg-[color:var(--accent-1)]/8 blur-[140px] animate-float-slow" />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center px-8">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Feature copy — crossfades whenever the phone completes a turn */}
          <div className="order-2 flex flex-col items-center text-center lg:order-1 lg:items-start lg:text-left">
            <p className="mb-5 text-[10px] tracking-[0.5em] text-[color:var(--accent-warm)]/80 uppercase md:text-xs">
              What Noorva Becomes
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="flex flex-col items-center lg:items-start"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <Icon className="h-5 w-5" style={{ color: feature.accent }} strokeWidth={1.5} />
                </div>
                <h3 className="font-playfair mb-4 text-3xl font-light text-white/95 md:text-4xl lg:text-5xl">
                  {feature.title}
                </h3>
                <p className="max-w-sm text-sm leading-relaxed font-light text-white/55 md:text-base">
                  {feature.body}
                </p>
                <button
                  onClick={goToClosing}
                  className="group mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-[11px] font-medium tracking-[0.14em] text-white/80 uppercase backdrop-blur-xl transition-colors duration-300 hover:border-[color:var(--accent-warm)]/40 hover:text-white"
                >
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
              </motion.div>
            </AnimatePresence>

            {/* Progress dots — which of the 4 turns is currently active */}
            <div className="mt-10 flex items-center gap-2">
              {FEATURES.map((f, i) => (
                <span
                  key={f.title}
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: i === activeIndex ? 22 : 6,
                    background: i === activeIndex ? "var(--accent-warm)" : "rgba(255,255,255,0.18)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Pinned 3D phone */}
          <div ref={canvasWrapRef} className="order-1 h-[60vh] w-full lg:order-2 lg:h-[75vh]">
            <Scene activeIndex={activeIndex} phoneRef={phoneRef} frameloop={inView ? "always" : "never"} />
          </div>
        </div>
      </div>
    </section>
  );
}
