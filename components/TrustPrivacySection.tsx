"use client";

// Doc §6 "Trust and Privacy" — explains responsible use of personalization
// and user controls, kept high-level (no policy specifics are in the
// supplied documentation to publish as fact).

import { Lock, Eye, SlidersHorizontal } from "lucide-react";
import PageSection from "./ui/PageSection";
import SectionHeading from "./ui/SectionHeading";
import { motion } from "framer-motion";

const POINTS = [
  { icon: Lock, title: "Your Data, Protected", description: "Personalization is built to serve you, not to be sold." },
  { icon: Eye, title: "Transparent by Design", description: "Understand why Noorva suggests what it suggests." },
  { icon: SlidersHorizontal, title: "You Stay in Control", description: "Adjust, correct or reset what Noorva remembers, anytime." },
];

export default function TrustPrivacySection() {
  return (
    <PageSection id="trust-privacy" shade="dim">
      <SectionHeading eyebrow="Trust & Privacy" title="Personalization," accent="on your terms." align="center" />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ staggerChildren: 0.08 }}
        className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3"
      >
        {POINTS.map((p) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.title}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <Icon className="h-6 w-6 text-[color:var(--accent)]" strokeWidth={1.5} />
              <h3 className="text-base font-medium text-[color:var(--ink)]">{p.title}</h3>
              <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{p.description}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </PageSection>
  );
}
