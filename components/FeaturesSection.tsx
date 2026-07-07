"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import useIsMobile from "./useIsMobile";
import FeatureShowcase from "./FeatureShowcase/FeatureShowcase";
import PhoneFrame from "./FeatureShowcase/PhoneFrame";
import { FEATURES, type Feature } from "./FeatureShowcase/featuresData";
import { lenisRef, galleryCaptureControl } from "./store";

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

function goToClosing() {
  galleryCaptureControl.release?.(1600);
  lenisRef.current?.scrollTo("#closing", { duration: 1.4 });
}

function MobileFeatureCard({ feature }: { feature: Feature }) {
  const { icon: Icon, title, body, Screen, accent } = feature;
  const cardRef = useRef<HTMLDivElement>(null);
  // Only animate the screen's own micro-details (typing dots, waveform,
  // blinking cursor) while the card is actually on screen.
  const inView = useInView(cardRef, { once: false, amount: 0.5 });

  return (
    <motion.div
      ref={cardRef}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] px-6 pt-10 pb-9"
    >
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-25 blur-[70px]"
        style={{ background: accent }}
      />

      <div className="relative flex justify-center">
        <PhoneFrame glowColor={accent}>
          <Screen active={inView} initiallyVisible />
        </PhoneFrame>
      </div>

      <div className="relative mt-8 text-center">
        <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <Icon className="h-5 w-5 text-[color:var(--accent-warm)]/85" strokeWidth={1.5} />
        </div>
        <h3 className="font-playfair mb-3 text-2xl font-light text-white/92">{title}</h3>
        <p className="mx-auto max-w-xs text-sm leading-relaxed font-light text-white/55">{body}</p>

        <button
          onClick={goToClosing}
          className="group mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-[11px] font-medium tracking-[0.14em] text-white/80 uppercase backdrop-blur-xl transition-colors duration-300 hover:border-[color:var(--accent-warm)]/40 hover:text-white"
        >
          Get Started
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </div>
    </motion.div>
  );
}

export default function FeaturesSection() {
  const isMobile = useIsMobile();

  if (isMobile !== false) {
    return (
      <section
        id="features"
        className="relative w-full overflow-hidden bg-[color:var(--bg)]/70 py-28 md:py-36"
      >
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2">
          <div className="h-full w-full rounded-full bg-[color:var(--accent-1)]/8 blur-[140px] animate-float-slow" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ staggerChildren: 0.12 }}
          >
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="mb-5 text-center text-[10px] md:text-xs tracking-[0.5em] uppercase text-[color:var(--accent-warm)]/80 font-light"
            >
              What Noorva Becomes
            </motion.p>

            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mx-auto max-w-2xl text-center font-playfair text-3xl md:text-5xl font-light text-white/95 leading-[1.2] mb-20"
            >
              One companion. As many roles as your life needs.
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <MobileFeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return <FeatureShowcase />;
}
