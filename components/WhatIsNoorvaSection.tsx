"use client";

// Doc §6 "What is Noorva?" homepage beat — explains the ecosystem vision in
// simple language before any individual product is introduced. Doc §3:
// avoid making Noorva look like only a chatbot, only a video app, or only a
// hardware company. Laid out as an asymmetric two-column split (not another
// centered-headline-over-icon-grid block) so it doesn't repeat the Hero's
// composition.

import PageSection from "./ui/PageSection";
import { motion } from "framer-motion";

const POINTS = [
  { n: "01", label: "Understand", detail: "Learns your context through natural interaction." },
  { n: "02", label: "Discover", detail: "Surfaces what's actually useful, not just popular." },
  { n: "03", label: "Extend", detail: "Travels with you beyond the phone, over time." },
  { n: "04", label: "Connect", detail: "One understanding, shared across every product." },
];

export default function WhatIsNoorvaSection() {
  return (
    <PageSection id="what-is-noorva">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="lg:col-span-5"
        >
          <p className="mb-4 flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.25em] text-[color:var(--ink)] uppercase">
            <span className="h-px w-6" style={{ backgroundImage: "var(--accent-gradient)" }} />
            What Is Noorva
          </p>
          <h2 className="font-display text-4xl leading-[1.15] font-normal text-[color:var(--ink)] md:text-5xl">
            Not a single app. Not a single device.
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[color:var(--ink-soft)] md:text-lg">
            Noorva is a family of human-centered AI products — beginning with a personal companion,
            and extending into video, wearables and devices as the ecosystem grows.
          </p>
        </motion.div>

        <div className="lg:col-span-6 lg:col-start-7">
          {POINTS.map((p, i) => (
            <motion.div
              key={p.n}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.06 }}
              className="flex items-baseline gap-6 border-t border-[color:var(--line)] py-5 first:border-t-0 md:py-6"
            >
              <span className="font-display shrink-0 text-sm text-[color:var(--ink-faint)]">{p.n}</span>
              <span className="w-32 shrink-0 text-base font-medium text-[color:var(--ink)] md:text-lg">{p.label}</span>
              <span className="text-sm text-[color:var(--ink-soft)] md:text-base">{p.detail}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </PageSection>
  );
}
