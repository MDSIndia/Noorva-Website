"use client";

// Doc §6 "Trust and Privacy" — explains responsible use of personalization
// and user controls, kept high-level (no policy specifics are in the
// supplied documentation to publish as fact). Left-aligned heading with a
// horizontal, divider-separated row rather than another centered icon
// triptych.

import { Lock, Eye, SlidersHorizontal } from "lucide-react";
import PageSection from "./ui/PageSection";
import { motion } from "framer-motion";

const POINTS = [
  { icon: Lock, title: "Your Data, Protected", description: "Personalization is built to serve you, not to be sold." },
  { icon: Eye, title: "Transparent by Design", description: "Understand why Noorva suggests what it suggests." },
  { icon: SlidersHorizontal, title: "You Stay in Control", description: "Adjust, correct or reset what Noorva remembers, anytime." },
];

export default function TrustPrivacySection() {
  return (
    <PageSection id="trust-privacy">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="lg:col-span-4"
        >
          <p className="mb-4 flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.25em] text-[color:var(--ink)] uppercase">
            <span className="h-px w-6" style={{ backgroundImage: "var(--accent-gradient)" }} />
            Trust &amp; Privacy
          </p>
          <h2 className="font-display text-3xl leading-[1.15] font-normal text-[color:var(--ink)] md:text-4xl">
            Personalization, <span>on your terms.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 divide-[color:var(--line)] sm:grid-cols-3 sm:divide-x lg:col-span-8">
          {POINTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.08 }}
                className="sm:pl-8 sm:first:pl-0"
              >
                <Icon className="mb-4 h-5 w-5 text-[color:var(--accent)]" strokeWidth={1.5} />
                <h3 className="mb-2 text-base font-medium text-[color:var(--ink)]">{p.title}</h3>
                <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{p.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PageSection>
  );
}
