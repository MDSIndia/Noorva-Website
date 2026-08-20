"use client";

// Doc §20 FAQ — question list used verbatim, answered at the same
// high-level the rest of the doc holds to (no pricing, specs or
// availability dates invented beyond what's confirmed).

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  { q: "What is Noorva?", a: "Noorva is a connected ecosystem of human-interactive AI products, beginning with a personal companion and extending into video, wearables and devices." },
  { q: "What is Noorva Companion?", a: "Noorva's primary product — a personalized, human-interactive AI companion for everyday life. A guide, mentor, planner and companion, not just another assistant." },
  { q: "What is Noorva Video?", a: "Noorva's video sharing and discovery platform, focused on personalized, useful, relevant and credible content rather than endless scrolling." },
  { q: "How does Noorva personalize the experience?", a: "Through natural interaction, Noorva builds an understanding of your goals, preferences and context over time, and uses that to shape guidance, reminders and content." },
  { q: "What is Human-Interactive AI?", a: "The foundation of Noorva's intelligence — AI that learns through natural conversation and interaction, rather than rigid commands or menus." },
  { q: "What is Noorva Guide?", a: "The part of Noorva that turns understanding into practical action: goals, tasks, reminders and timely follow-ups." },
  { q: "How does source filtering work?", a: "Noorva's Advanced Source Filtering uses intent detection, source verification and summarization to prioritize credible, relevant information." },
  { q: "Who can create content on Noorva Video?", a: "Noorva Video is built around a creator ecosystem, with channels, uploads and a verification process for creators." },
  { q: "What does the verified creator badge mean?", a: "A verified badge signals that a creator has been through Noorva's creator verification process, helping viewers identify credible sources." },
  { q: "What products are part of the Noorva ecosystem?", a: "Noorva Companion, Noorva Video, Noorva Glasses and Noorva Phones today, with future products joining the ecosystem over time." },
  { q: "When will future Noorva products be available?", a: "Noorva Glasses and Noorva Phones are future/ecosystem products. Specific availability will be shared once specifications are finalized." },
  { q: "How can I get started or contact Noorva?", a: "Explore the product pages to get started, or reach out directly through the Contact page." },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="border-b border-[color:var(--line)]">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="group flex w-full items-center justify-between gap-4 py-6 text-left"
              aria-expanded={isOpen}
            >
              <span className={`text-sm text-[color:var(--ink)] transition-all duration-300 md:text-base ${isOpen ? "font-semibold" : "font-medium"}`}>
                {item.q}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[color:var(--ink)] transition-transform duration-300`}
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 text-sm leading-relaxed text-[color:var(--ink-soft)] md:text-base">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
