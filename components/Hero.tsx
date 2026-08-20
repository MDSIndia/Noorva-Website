"use client";

// Homepage hero — a simple, confident opening (no gating, no full-screen
// cinematic sequence) with a bit of editorial polish: a soft accent-tinted
// wash behind the headline, and a scrolling marquee of the ecosystem below.

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const MARQUEE_ITEMS = ["Noorva Companion", "Noorva Video", "Noorva Glasses", "Noorva Phones", "Future Products"];

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-[color:var(--paper)] pt-40 pb-0 md:pt-52">
      {/* Soft ambient wash — a single restrained accent bloom, not a starfield. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-18%] left-1/2 h-[560px] w-[880px] -translate-x-1/2 rounded-full opacity-[0.16] blur-[110px]"
        style={{ background: "radial-gradient(closest-side, var(--accent), transparent)" }}
      />

      <motion.div
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.12 }}
        className="relative mx-auto max-w-4xl px-6 pb-24 text-center md:px-10 md:pb-32"
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: "easeOut" }} className="mb-6 flex items-center justify-center gap-2.5">
          <span className="h-px w-6 bg-[color:var(--accent)]" />
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[color:var(--accent)] uppercase">A Connected Ecosystem</p>
          <span className="h-px w-6 bg-[color:var(--accent)]" />
        </motion.div>

        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-display text-5xl leading-[1.08] font-normal text-[color:var(--ink)] md:text-7xl"
        >
          A new generation of <span className="italic">human-interactive</span> technology.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[color:var(--ink-soft)] md:text-xl"
        >
          An evolving ecosystem of intelligent products designed to understand, assist and connect
          with people — beginning with Noorva Companion.
        </motion.p>

        <motion.div variants={fadeUp} transition={{ duration: 0.7, ease: "easeOut" }} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/products" className="btn-primary group">
            Explore Noorva
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link href="/ecosystem" className="btn-secondary">
            <PlayCircle className="h-4 w-4" strokeWidth={1.5} />
            See How It Works
          </Link>
        </motion.div>
      </motion.div>

      {/* Marquee strip — the ecosystem, always in motion. */}
      <div className="relative border-t border-[color:var(--line)] py-6">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-12 pr-12">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="flex shrink-0 items-center gap-12 text-sm font-medium tracking-[0.1em] whitespace-nowrap text-[color:var(--ink-faint)] uppercase">
                {item}
                <span className="text-[color:var(--accent)]">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
