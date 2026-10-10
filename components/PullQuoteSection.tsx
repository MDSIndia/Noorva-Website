"use client";

// A single raised band — a slightly lifted surface with a soft blue glow —
// breaks the run of flat sections and gives the homepage a deliberate rhythm
// change for the pull quote.

import { motion } from "framer-motion";

export default function PullQuoteSection() {
  return (
    <section className="relative w-full overflow-hidden glass-strong !rounded-none !border-x-0 py-28 md:py-36">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 80% at 50% 0%, var(--glow-blue), transparent 70%)" }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-4xl px-6 md:px-10">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-display text-3xl leading-[1.35] font-light text-[color:var(--ink)] md:text-5xl"
        >
          &ldquo;Every leap in human progress was a new way to connect. Noorva is building the next one
          — not a chatbot, not a video app, not a gadget. An ecosystem.&rdquo;
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex items-center gap-3"
        >
          <span className="h-px w-8" style={{ backgroundImage: "var(--accent-gradient)" }} />
          <span className="text-xs font-medium tracking-[0.2em] text-[color:var(--ink-soft)] uppercase">The Noorva Ecosystem</span>
        </motion.div>
      </div>
    </section>
  );
}
