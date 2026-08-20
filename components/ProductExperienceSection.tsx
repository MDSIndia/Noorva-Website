"use client";

// Doc §6/§17 "Product Experience" — the doc calls for screenshots, demos
// and real-life use cases; since no approved product photography exists
// for this redesign, this section leans on the doc's other named format
// (real-life use cases, doc §10) rendered as short editorial vignettes.

import { Sunrise, Briefcase, BookOpen, Moon } from "lucide-react";
import PageSection from "./ui/PageSection";
import SectionHeading from "./ui/SectionHeading";
import { motion } from "framer-motion";

const MOMENTS = [
  { icon: Sunrise, time: "Morning", text: "A quick summary of your day, shaped around what actually matters to you." },
  { icon: Briefcase, time: "Work", text: "Noorva Guide keeps goals and tasks moving without you having to manage it." },
  { icon: BookOpen, time: "Learning", text: "Ask a real question, get a real answer — sourced, filtered, summarized." },
  { icon: Moon, time: "Evening", text: "A companion that checks in, not a notification that demands attention." },
];

export default function ProductExperienceSection() {
  return (
    <PageSection id="product-experience">
      <SectionHeading
        eyebrow="A Day With Noorva"
        title="One companion,"
        accent="woven through your day."
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.08 }}
        className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        {MOMENTS.map((m) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.time}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="border-t border-[color:var(--line)] pt-6"
            >
              <Icon className="mb-4 h-5 w-5 text-[color:var(--accent)]" strokeWidth={1.5} />
              <h3 className="font-display mb-2 text-xl font-normal text-[color:var(--ink)]">{m.time}</h3>
              <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{m.text}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </PageSection>
  );
}
