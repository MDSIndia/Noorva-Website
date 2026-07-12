"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PodiumStage from "./PodiumStage";
import { FEATURES, ACCENT_HEX } from "../FeatureShowcase/featuresData";
import { lenisRef, galleryCaptureControl } from "../store";

gsap.registerPlugin(ScrollTrigger);

// How much scroll distance the whole pinned sequence consumes, in viewport
// heights. Unlike the old WebGL carousel, nothing here needs a continuous
// scrub value — the phones' own motion is driven by always-running CSS
// keyframes, independent of scroll — so this only has to feel long enough
// that each of the 4 discrete feature steps gets a comfortable stretch of
// scroll before advancing to the next.
const PIN_VH_MULTIPLIER = 5;

const DEFAULT_ACCENT = "#4fa8d5";

function goToClosing() {
  galleryCaptureControl.release?.(1600);
  lenisRef.current?.scrollTo("#closing", { duration: 1.4 });
}

export default function PhonePodium() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => "+=" + window.innerHeight * PIN_VH_MULTIPLIER,
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const idx = Math.min(FEATURES.length - 1, Math.floor(self.progress * FEATURES.length));
        setActiveIndex((prev) => (prev === idx ? prev : idx));
      },
    });

    return () => trigger.kill();
  }, []);

  const feature = FEATURES[activeIndex];
  const Icon = feature.icon;
  const accentHex = ACCENT_HEX[feature.accent] ?? DEFAULT_ACCENT;
  const textIsLeft = feature.textSide === "left";

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-[color:var(--bg)]/70"
      style={{ zIndex: 33 }}
    >
      <div className="pointer-events-none absolute inset-0 vignette-edge" />

      {/* Ambient surrounding light — tints and breathes along with whichever
          feature is active, echoing the podium's own glow at page scale. */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2">
        <div
          className="podium-glow h-full w-full rounded-full opacity-30 blur-[140px]"
          style={{ backgroundColor: accentHex }}
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center px-8 pt-28 sm:pt-32 lg:h-full lg:flex-row lg:justify-center lg:gap-6 lg:pt-0">
        {/* Central podium + phone stack — stays put in the middle of the
            stage; only the active phone, the podium's glow, and the
            surrounding light shift between features. */}
        <div
          className={`order-1 h-[46vh] w-full sm:h-[52vh] lg:h-[78vh] lg:w-[46%] ${textIsLeft ? "lg:order-2" : "lg:order-1"}`}
        >
          <PodiumStage activeIndex={activeIndex} />
        </div>

        {/* Feature copy — crossfades with the active phone. */}
        <div
          className={`order-2 flex flex-col items-center gap-6 text-center lg:w-[34%] lg:items-stretch lg:gap-0 ${
            textIsLeft ? "lg:order-1 lg:items-start lg:text-left" : "lg:order-2 lg:items-end lg:text-right"
          }`}
        >
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
              className={`flex flex-col items-center ${textIsLeft ? "lg:items-start" : "lg:items-end"}`}
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

          {/* Progress dots — which of the 4 features is currently active */}
          <div className="mt-10 flex items-center gap-2 self-center lg:self-auto">
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
      </div>
    </section>
  );
}
