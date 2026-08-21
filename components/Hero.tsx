"use client";

// Homepage hero — deliberately asymmetric (not the dead-centered
// headline/subhead/two-buttons template) with a slightly tilted pull-quote
// card standing in for a "pinned note," so the page reads as laid out by
// hand rather than generated from a block.

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";
import { UnderlineDoodle } from "./ui/Doodle";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const MARQUEE_ITEMS = ["Noorva Companion", "Noorva Video", "Noorva Glasses", "Noorva Phones", "Future Products"];

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-[color:var(--paper)] pt-36 pb-0 md:pt-44">
      <div className="gradient-mesh" />
      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 pb-24 md:px-10 md:pb-32 lg:grid-cols-12 lg:items-end lg:gap-8">
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.12 }}
          className="lg:col-span-7"
        >
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-5 text-[11px] font-semibold tracking-[0.25em] text-[color:var(--ink)] uppercase"
          >
            A Connected Ecosystem
          </motion.p>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="font-display text-5xl leading-[1.05] font-normal text-[color:var(--ink)] md:text-[4.5rem]"
          >
            A new generation of{" "}
            <span className="relative inline-block italic">
              human-interactive
              <UnderlineDoodle className="absolute -bottom-2 left-0 h-3 w-full" />
            </span>{" "}
            technology.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mt-8 max-w-lg text-lg leading-relaxed text-[color:var(--ink-soft)]"
          >
            An evolving ecosystem of intelligent products designed to understand, assist and connect
            with people — beginning with Noorva Companion.
          </motion.p>

          <motion.div variants={fadeUp} transition={{ duration: 0.7, ease: "easeOut" }} className="mt-10 flex flex-wrap items-center gap-4">
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

        {/* Pinned note — a small aside, slightly off-kilter, standing in
            for a hand-placed pull-quote rather than more hero copy. */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -6 }}
          animate={{ opacity: 1, y: 0, rotate: -3 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="relative lg:col-span-5 lg:justify-self-end"
        >
          <div className="gradient-border rounded-[1.4rem] p-[1.5px] shadow-[0_24px_50px_-20px_var(--shadow-cool)]">
            <div className="glass-panel relative w-full max-w-[300px] rounded-[1.35rem] p-7">
              <span className="absolute -top-3 left-7 h-6 w-12 rotate-[-4deg] bg-[color:var(--accent-soft)]" aria-hidden />
              <p className="font-display text-xl leading-snug text-[color:var(--ink)] italic">
                &ldquo;Not another assistant — a guide, mentor, planner and companion.&rdquo;
              </p>
              <p className="mt-4 text-[10px] font-semibold tracking-[0.2em] text-[color:var(--ink-faint)] uppercase">— Noorva Companion</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Marquee strip — the ecosystem, always in motion. */}
      <div className="relative border-t border-[color:var(--line)] py-6">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-12 pr-12">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="shrink-0 text-sm font-medium tracking-[0.1em] whitespace-nowrap text-[color:var(--ink-faint)] uppercase">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
