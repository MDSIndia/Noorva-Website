"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import IPhoneTurntable from "./IPhoneTurntable";
import { FEATURES } from "../FeatureShowcase/featuresData";
import { phoneShowRotation, lenisRef, galleryCaptureControl } from "../store";

// Continuous idle spin — no scroll-hijack, just a phone turning in place
// until the user taps it. Degrees per second.
const AUTO_ROTATE_SPEED = 24;

function goToClosing() {
  galleryCaptureControl.release?.(1600);
  lenisRef.current?.scrollTo("#closing", { duration: 1.4 });
}

type Stage = "idle" | "features";

/** One-shot expanding ring, played from the tap point when the phone opens
 *  up into the feature list — the "stepping through the screen" beat. */
function PortalFlash({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      className="pointer-events-none fixed top-1/2 left-1/2 z-[60] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ background: "radial-gradient(circle, rgba(124,92,252,0.9), rgba(79,168,213,0.35) 55%, transparent 75%)" }}
      initial={{ scale: 0.3, opacity: 0.85 }}
      animate={{ scale: 12, opacity: 0 }}
      transition={{ duration: 0.85, ease: "easeOut" }}
      onAnimationComplete={onDone}
    />
  );
}

export default function PhoneShowcase3D() {
  const [stage, setStage] = useState<Stage>("idle");
  const [flashId, setFlashId] = useState(0);
  const enteredRef = useRef(false);
  const logoWrapRef = useRef<HTMLDivElement>(null);

  // Idle auto-rotation, plus fading the on-screen logo in/out as the phone's
  // face turns toward and away from camera — both driven off one rAF loop,
  // both bypassing React state so this never re-renders per frame.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!enteredRef.current) {
        phoneShowRotation.value = (phoneShowRotation.value + AUTO_ROTATE_SPEED * dt) % 360;
      }
      const rad = (phoneShowRotation.value * Math.PI) / 180;
      const facing = Math.max(0, Math.cos(rad));
      if (logoWrapRef.current) logoWrapRef.current.style.opacity = String(facing);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function handleEnter() {
    if (enteredRef.current) return;
    enteredRef.current = true;
    setFlashId((n) => n + 1);
    setStage("features");
  }

  function handleBack() {
    enteredRef.current = false;
    setStage("idle");
  }

  return (
    <section
      id="features"
      className="relative w-full overflow-hidden bg-[color:var(--bg)]/70 py-28 md:py-36"
      style={{ zIndex: 28 }}
    >
      <div className="pointer-events-none absolute inset-0 vignette-edge" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2">
        <div className="h-full w-full rounded-full bg-[color:var(--accent-1)]/8 blur-[140px] animate-float-slow" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-8">
        <p className="mb-14 text-center text-[10px] tracking-[0.5em] text-[color:var(--accent-warm)]/80 uppercase md:text-xs">
          What Noorva Becomes
        </p>

        <AnimatePresence mode="wait">
          {stage === "idle" ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.15, filter: "blur(14px)" }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
              className="relative flex flex-col items-center"
            >
              <button
                type="button"
                onClick={handleEnter}
                aria-label="Explore Noorva's features"
                className="group relative flex h-[64vh] max-h-[620px] w-full max-w-[360px] cursor-pointer items-center justify-center border-0 bg-transparent p-0"
              >
                <motion.div
                  className="relative h-full w-full"
                  whileHover={{ scale: 1.035 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <IPhoneTurntable accent="var(--accent-1)" activeIndex={0} />

                  {/* Spinning logo, sitting on the phone's screen — only
                      readable while the turntable is showing its face. */}
                  <div
                    ref={logoWrapRef}
                    className="pointer-events-none absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center md:h-20 md:w-20"
                    style={{ opacity: 0 }}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 -z-10 rounded-full"
                      style={{ background: "radial-gradient(circle, rgba(124,92,252,0.5), transparent 70%)" }}
                    />
                    <div className="phone-logo-spin relative h-full w-full">
                      <Image src="/NoorvaLogo.png" alt="" fill sizes="80px" className="object-contain opacity-95" />
                    </div>
                  </div>
                </motion.div>
              </button>

              <motion.div
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="mt-8 flex items-center gap-2 text-[11px] font-light tracking-[0.3em] text-white/50 uppercase"
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--accent-warm)" }} strokeWidth={1.5} />
                Tap to explore
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <button
                type="button"
                onClick={handleBack}
                className="group mb-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-medium tracking-[0.14em] text-white/70 uppercase backdrop-blur-xl transition-colors duration-300 hover:border-[color:var(--accent-1)]/40 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
                Back
              </button>

              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                className="mx-auto mb-16 max-w-2xl text-center font-playfair text-3xl font-light leading-[1.2] text-white/95 md:text-5xl"
              >
                One companion. As many roles as your life needs.
              </motion.h2>

              <div className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2">
                {FEATURES.map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 26, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ duration: 0.6, delay: 0.15 + i * 0.1, ease: "easeOut" }}
                      className="flex flex-col items-center text-center sm:items-start sm:text-left"
                    >
                      <div
                        className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5"
                        style={{ boxShadow: `0 0 24px color-mix(in srgb, ${feature.accent} 35%, transparent)` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: feature.accent }} strokeWidth={1.5} />
                      </div>
                      <h3 className="font-playfair mb-3 text-2xl font-light text-white/95 md:text-3xl">{feature.title}</h3>
                      <p className="max-w-sm text-sm leading-relaxed font-light text-white/55 md:text-base">{feature.body}</p>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-16 flex justify-center"
              >
                <button
                  onClick={goToClosing}
                  className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-[11px] font-medium tracking-[0.14em] text-white/80 uppercase backdrop-blur-xl transition-colors duration-300 hover:border-[color:var(--accent-warm)]/40 hover:text-white"
                >
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {flashId > 0 && (
          <PortalFlash key={flashId} onDone={() => setFlashId(0)} />
        )}
      </AnimatePresence>
    </section>
  );
}
