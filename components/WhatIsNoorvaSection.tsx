"use client";

// Doc §6 "What is Noorva?" homepage beat — explains the ecosystem vision in
// simple language before any individual product is introduced. Doc §3:
// avoid making Noorva look like only a chatbot, only a video app, or only a
// hardware company.

import { Sparkles, Video, Glasses, Smartphone } from "lucide-react";
import PageSection from "./ui/PageSection";
import SectionHeading from "./ui/SectionHeading";
import { motion } from "framer-motion";

const PILLARS = [
  { icon: Sparkles, label: "Understand" },
  { icon: Video, label: "Discover" },
  { icon: Glasses, label: "Extend" },
  { icon: Smartphone, label: "Connect" },
];

export default function WhatIsNoorvaSection() {
  return (
    <PageSection id="what-is-noorva">
      <SectionHeading
        eyebrow="What Is Noorva"
        title="Noorva is building a connected ecosystem where"
        accent="intelligent AI lives across everyday life."
        description="Not a single app. Not a single device. Noorva is a family of human-centered AI products — beginning with a personal companion, and extending into video, wearables and devices as the ecosystem grows."
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ staggerChildren: 0.08 }}
        className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--line)] sm:grid-cols-4"
      >
        {PILLARS.map((p) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.label}
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center gap-3 bg-[color:var(--paper)] px-4 py-8 text-center"
            >
              <Icon className="h-5 w-5 text-[color:var(--accent)]" strokeWidth={1.5} />
              <span className="text-xs font-medium tracking-[0.15em] text-[color:var(--ink)] uppercase">{p.label}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </PageSection>
  );
}
