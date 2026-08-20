"use client";

// Ported from MDSIndia's own HowNoorvaWorksSection and re-skinned to
// Noorva's design system — same interactive stepper mechanic and copy, but
// Noorva's own heading font (font-playfair, not Neue Machina/Space
// Grotesk), accent palette (the blue/violet/magenta/gold/deep-blue already
// used across PhilosophySection/FeaturesSection/ClosingSection, not MDS's
// neon cyan/indigo/purple/orange/pink), and glass/vignette conventions in
// place of MDS's own section-padding/scene-fade globals, which don't exist
// in this project. The auto-advancing stage timer, click-to-jump stepper,
// progress bar, and animated content card are otherwise unchanged.

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const STAGE_MS = 4500;

const stages = [
  {
    id: "observe", label: "Observe", number: "01",
    accent: "#4fa8d5", glow: "79,168,213",
    description:
      "Noorva silently observes your habits, routines, conversations, and emotional patterns — building a real-time model of your life without being intrusive.",
    details: ["Passive behavioral mapping", "Emotional tone detection", "Contextual awareness", "Privacy-first architecture"],
  },
  {
    id: "understand", label: "Understand", number: "02",
    accent: "#7c5cfc", glow: "124,92,252",
    description:
      "Through thousands of micro-interactions, Noorva builds a deep, nuanced understanding of what matters to you, what stresses you, and what makes you thrive.",
    details: ["Deep semantic analysis", "Value & priority mapping", "Stress pattern recognition", "Personal model building"],
  },
  {
    id: "learn", label: "Learn", number: "03",
    accent: "#db45d7", glow: "219,69,215",
    description:
      "Noorva doesn't just gather data — she continuously refines her understanding, adapting to how you change, grow, and evolve over time.",
    details: ["Continuous model refinement", "Growth tracking", "Preference evolution", "Adaptive personalization"],
  },
  {
    id: "guide", label: "Guide", number: "04",
    accent: "#e8b478", glow: "232,180,120",
    description:
      "Armed with deep understanding, Noorva proactively offers guidance, insights, and gentle nudges exactly when you need them — before you even ask.",
    details: ["Proactive recommendations", "Decision support", "Goal alignment guidance", "Timely interventions"],
  },
  {
    id: "support", label: "Support", number: "05",
    accent: "#3965e5", glow: "57,101,229",
    description:
      "In moments of joy, difficulty, uncertainty, and growth — Noorva is your unwavering companion, offering the right support in the right way at the right moment.",
    details: ["Emotional support system", "Crisis-aware responses", "Celebration & motivation", "Long-term relationship"],
  },
];

export default function HowNoorvaWorksSection() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const activeRef = useRef(active);
  const progressRef = useRef(0);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const goTo = (i: number) => {
    activeRef.current = i;
    progressRef.current = 0;
    setActive(i);
    setProgress(0);
  };

  useEffect(() => {
    if (paused) return;
    const step = 100 / (STAGE_MS / 50);
    const id = setInterval(() => {
      progressRef.current += step;
      setProgress(progressRef.current);
      if (progressRef.current >= 100) {
        progressRef.current = 0;
        const next = (activeRef.current + 1) % stages.length;
        activeRef.current = next;
        setActive(next);
        setProgress(0);
      }
    }, 50);
    return () => clearInterval(id);
  }, [paused]);

  const cur = stages[active];

  return (
    <section id="how-noorva-works" className="relative w-full overflow-hidden bg-[color:var(--bg)]/70 py-28 md:py-36">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(${cur.glow},0.06) 0%, transparent 70%)`,
          transition: "background 0.8s ease",
        }}
      />
      <div className="pointer-events-none absolute inset-0 vignette-edge" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10">
        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-10 text-center md:mb-14"
        >
          <span className="mb-4 block text-[10px] font-light tracking-[0.5em] text-[color:var(--accent-warm)]/80 uppercase md:text-xs">
            Intelligence by Design
          </span>
          <h2 className="font-playfair text-4xl leading-[0.95] font-light text-white/95 md:text-6xl lg:text-7xl">
            How{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #3965e5 0%, #7c5cfc 50%, #db45d7 100%)",
                filter: "drop-shadow(0 0 24px rgba(124,92,252,0.35))",
              }}
            >
              Noorva
            </span>{" "}
            Works
          </h2>
        </motion.div>

        {/* ── STEP NAVIGATOR ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="mb-3 flex items-center"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {stages.map((stage, i) => (
            <React.Fragment key={stage.id}>
              {i > 0 && (
                <div className="relative mx-1 h-px flex-1 overflow-hidden rounded-full sm:mx-3 md:mx-5" style={{ minWidth: "6px" }}>
                  <div className="absolute inset-0" style={{ background: "rgba(255,255,255,0.10)" }} />
                  {i <= active && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ background: `linear-gradient(to right, ${stages[i - 1].accent}, ${stage.accent})` }}
                    />
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => goTo(i)}
                className="flex flex-shrink-0 flex-col items-center gap-1 focus:outline-none sm:gap-2"
              >
                <motion.div
                  animate={{
                    borderColor: i === active ? cur.accent : "rgba(255,255,255,0.14)",
                    boxShadow: i === active ? `0 0 18px rgba(${cur.glow},0.45), 0 0 40px rgba(${cur.glow},0.18)` : "none",
                    scale: i === active ? 1.12 : 1,
                  }}
                  transition={{ duration: 0.4 }}
                  className="flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10 md:h-12 md:w-12"
                  style={{
                    border: `2px solid ${i === active ? cur.accent : "rgba(255,255,255,0.14)"}`,
                    background: i === active ? `rgba(${cur.glow},0.14)` : "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(10px) saturate(150%)",
                    WebkitBackdropFilter: "blur(10px) saturate(150%)",
                  }}
                >
                  <span
                    className="font-mono text-[0.55rem] font-semibold sm:text-[0.65rem] md:text-xs"
                    style={{ color: i === active ? cur.accent : "rgba(255,255,255,0.30)" }}
                  >
                    {stage.number}
                  </span>
                </motion.div>
                <span
                  className="hidden text-[0.48rem] font-medium tracking-[0.10em] uppercase transition-colors duration-300 sm:block sm:text-[0.58rem] sm:tracking-[0.16em] md:text-[0.68rem]"
                  style={{ color: i === active ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.25)" }}
                >
                  {stage.label}
                </span>
              </button>
            </React.Fragment>
          ))}
        </motion.div>

        {/* ── PROGRESS BAR ── */}
        <div
          className="mb-6 h-px overflow-hidden rounded-full md:mb-8"
          style={{ background: "rgba(255,255,255,0.06)" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(to right, ${cur.accent}66, ${cur.accent})`,
              transition: "width 0.05s linear",
            }}
          />
        </div>

        {/* ── CONTENT CARD ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="relative overflow-hidden rounded-2xl md:rounded-3xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.14)",
              backdropFilter: "blur(24px) saturate(150%)",
              WebkitBackdropFilter: "blur(24px) saturate(150%)",
              boxShadow: `0 0 100px rgba(${cur.glow},0.10), 0 8px 32px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(${cur.glow},0.07)`,
            }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Top accent line */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(to right, transparent 5%, ${cur.accent} 50%, transparent 95%)` }}
            />

            {/* Ghost number — decorative */}
            <div
              className="font-playfair pointer-events-none absolute top-2 right-4 leading-none select-none md:right-10"
              style={{
                fontSize: "clamp(7rem, 18vw, 16rem)",
                letterSpacing: "-0.04em",
                color: `rgba(${cur.glow},0.07)`,
              }}
            >
              {cur.number}
            </div>

            <div className="relative grid grid-cols-1 items-start gap-6 p-6 md:p-8 lg:grid-cols-[1fr_300px] lg:gap-10 lg:p-10">
              {/* Left: Heading + Description */}
              <div>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.55, ease: EASE }}
                  className="mb-8 h-0.5 w-14 origin-left rounded-full"
                  style={{ background: `linear-gradient(to right, ${cur.accent}, ${cur.accent}44)` }}
                />

                <h3
                  className="font-playfair mb-6 font-light"
                  style={{ fontSize: "clamp(3rem, 6.5vw, 7rem)", lineHeight: 0.9, color: "rgba(255,255,255,0.96)" }}
                >
                  {cur.label}
                </h3>

                <p
                  className="font-light"
                  style={{ fontSize: "clamp(1rem, 1.25vw, 1.18rem)", lineHeight: 1.78, color: "rgba(255,255,255,0.75)", maxWidth: "560px" }}
                >
                  {cur.description}
                </p>
              </div>

              {/* Right: Detail tags */}
              <div className="flex flex-col gap-3 pt-1">
                {cur.details.map((detail, i) => (
                  <motion.div
                    key={detail}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.09, duration: 0.45, ease: EASE }}
                    className="flex items-center gap-3 rounded-xl px-4 py-3.5"
                    style={{
                      background: `rgba(${cur.glow},0.09)`,
                      border: `1px solid rgba(${cur.glow},0.20)`,
                      backdropFilter: "blur(10px) saturate(150%)",
                      WebkitBackdropFilter: "blur(10px) saturate(150%)",
                    }}
                  >
                    <div
                      className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ background: cur.accent, boxShadow: `0 0 6px ${cur.accent}` }}
                    />
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>
                      {detail}
                    </span>
                  </motion.div>
                ))}

                {/* Stage counter */}
                <div
                  className="mt-2 flex items-center gap-1.5 px-4 uppercase"
                  style={{ fontFamily: "monospace", fontSize: "0.62rem", letterSpacing: "0.15em", color: "rgba(255,255,255,0.18)" }}
                >
                  <span style={{ color: cur.accent }}>{cur.number}</span>
                  <span>/</span>
                  <span>0{stages.length}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
