"use client";

// Doc §6/§16 — Technology homepage beat: introduces the intelligence behind
// Noorva without turning the homepage into a technical document; full
// detail lives on /technology. A stacked list with oversized numerals
// rather than another row of icon cards, to keep the page from repeating
// its own visual pattern.

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageSection from "./ui/PageSection";
import SectionHeading from "./ui/SectionHeading";
import { motion } from "framer-motion";

const TECH = [
  { n: "01", title: "Human-Interactive AI", description: "Learns through natural interaction, not forms and menus." },
  { n: "02", title: "Noorva Guide", description: "Turns understanding into practical, everyday action." },
  { n: "03", title: "Mood-Based Algorithm", description: "Understands timing and context, not just requests." },
  { n: "04", title: "Advanced Source Filtering", description: "Focuses on credible, relevant information." },
];

export default function TechnologyTeaserSection() {
  return (
    <PageSection id="technology-teaser" shade="dim">
      <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
        <SectionHeading eyebrow="The Intelligence" title="Technology that feels" accent="less like software." className="lg:max-w-md" />
        <Link
          href="/technology"
          className="link-underline hidden shrink-0 items-center gap-2 pb-1 text-sm font-medium tracking-[0.05em] text-[color:var(--ink)] uppercase lg:flex"
        >
          Explore the Technology
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-14 divide-y divide-[color:var(--line)] border-t border-[color:var(--line)]">
        {TECH.map((t, i) => (
          <motion.div
            key={t.n}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.05 }}
            className="group flex flex-col gap-2 py-7 sm:flex-row sm:items-center sm:gap-8 md:py-9"
          >
            <span className="font-display text-2xl text-[color:var(--ink)] opacity-50 sm:w-16 sm:shrink-0">{t.n}</span>
            <h3 className="text-lg font-medium text-[color:var(--ink)] sm:w-72 sm:shrink-0 md:text-xl">{t.title}</h3>
            <p className="text-sm leading-relaxed text-[color:var(--ink-soft)] md:text-base">{t.description}</p>
          </motion.div>
        ))}
      </div>

      <Link
        href="/technology"
        className="link-underline mt-10 inline-flex items-center gap-2 pb-1 text-sm font-medium tracking-[0.05em] text-[color:var(--ink)] uppercase lg:hidden"
      >
        Explore the Technology
        <ArrowRight className="h-4 w-4" />
      </Link>
    </PageSection>
  );
}
