"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FEATURES, type Feature } from "./FeatureShowcase/featuresData";
import { lenisRef, galleryCaptureControl } from "./store";
import useIsMobile from "./useIsMobile";
import PhoneShowcase3D from "./PhoneShowcase3D/PhoneShowcase3D";

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

function goToClosing() {
  galleryCaptureControl.release?.(1600);
  lenisRef.current?.scrollTo("#closing", { duration: 1.4 });
}

function FeatureRow({ feature }: { feature: Feature }) {
  const { icon: Icon, title, body, Art, accent, textSide } = feature;
  const reverse = textSide === "right";

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`flex flex-col items-center gap-10 md:gap-14 lg:gap-20 ${
        reverse ? "md:flex-row-reverse" : "md:flex-row"
      }`}
    >
      <div className="w-full max-w-md md:max-w-none md:flex-1">
        <Art />
      </div>

      <div
        className={`flex w-full flex-col items-center text-center md:max-w-md md:flex-1 ${
          reverse ? "md:items-end md:text-right" : "md:items-start md:text-left"
        }`}
      >
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <Icon className="h-5 w-5" style={{ color: accent }} strokeWidth={1.5} />
        </div>
        <h3 className="font-playfair mb-4 text-3xl font-light text-white/95 md:text-4xl lg:text-5xl">{title}</h3>
        <p className="max-w-sm text-sm leading-relaxed font-light text-white/55 md:text-base">{body}</p>
        <button
          onClick={goToClosing}
          className="group mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-[11px] font-medium tracking-[0.14em] text-white/80 uppercase backdrop-blur-xl transition-colors duration-300 hover:border-[color:var(--accent-warm)]/40 hover:text-white"
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

  // The pinned 3D showcase needs real scroll-hijack + a live WebGL canvas —
  // both are a poor fit for touch viewports (janky pinning, GPU cost on
  // battery-constrained devices), so mobile/tablet keep this lighter,
  // already-responsive static layout instead. null = unknown (SSR/first
  // paint) is treated the same as mobile so there's no hydration mismatch.
  if (isMobile !== false) {
    return (
      <section id="features" className="relative w-full overflow-hidden bg-[color:var(--bg)]/70 py-28 md:py-36">
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
              className="mx-auto max-w-2xl text-center font-playfair text-3xl md:text-5xl font-light text-white/95 leading-[1.2] mb-24 md:mb-32"
            >
              One companion. As many roles as your life needs.
            </motion.h2>
          </motion.div>

          <div className="flex flex-col gap-24 md:gap-32">
            {FEATURES.map((feature) => (
              <FeatureRow key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return <PhoneShowcase3D />;
}
