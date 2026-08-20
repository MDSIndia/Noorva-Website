"use client";

// Generic "visual + copy + feature list + CTA" row, shared by the
// homepage's Companion/Video teasers (doc §6) and reused inside the
// individual product detail pages for their capability breakdowns (doc
// §9/§11). The visual panel is a flat icon plate (no photography), per the
// redesign's editorial, typography-first direction.

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export interface ProductFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ProductFeatureRowProps {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
  features: ProductFeature[];
  visualIcon: LucideIcon;
  visualLabel: string;
  ctaHref: string;
  ctaLabel: string;
  reverse?: boolean;
}

export default function ProductFeatureRow({
  eyebrow,
  title,
  accent,
  description,
  features,
  visualIcon: VisualIcon,
  visualLabel,
  ctaHref,
  ctaLabel,
  reverse = false,
}: ProductFeatureRowProps) {
  return (
    <div className={`flex flex-col gap-14 lg:flex-row lg:items-center lg:gap-16 ${reverse ? "lg:flex-row-reverse" : ""}`}>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex justify-center lg:flex-1"
      >
        <div
          className="relative flex aspect-square w-full max-w-[320px] flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border border-[color:var(--line)] shadow-[0_20px_44px_-20px_var(--shadow-warm)]"
          style={{ background: "linear-gradient(160deg, var(--paper-dim), var(--paper))" }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-[0.14] blur-2xl"
            style={{ background: "var(--accent)" }}
          />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)]">
            <VisualIcon className="h-9 w-9 text-[color:var(--accent)]" strokeWidth={1} />
          </div>
          <span className="relative text-xs font-medium tracking-[0.2em] text-[color:var(--ink-faint)] uppercase">{visualLabel}</span>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ staggerChildren: 0.08 }}
        className="lg:flex-1"
      >
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-4 text-[11px] font-semibold tracking-[0.25em] text-[color:var(--accent)] uppercase"
        >
          {eyebrow}
        </motion.p>

        <motion.h2
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="font-display mb-6 text-3xl leading-[1.12] font-normal text-[color:var(--ink)] md:text-4xl lg:text-5xl"
        >
          {title} {accent && <span className="italic">{accent}</span>}
        </motion.h2>

        <motion.p variants={fadeUp} transition={{ duration: 0.6, ease: "easeOut" }} className="mb-10 max-w-xl text-base leading-relaxed text-[color:var(--ink-soft)] md:text-lg">
          {description}
        </motion.p>

        <motion.div variants={fadeUp} transition={{ staggerChildren: 0.06 }} className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex items-start gap-3 border-l-2 border-[color:var(--line)] py-1 pl-4"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent)]" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-[color:var(--ink)]">{f.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--ink-faint)]">{f.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: "easeOut" }}>
          <Link href={ctaHref} className="btn-primary-sm group">
            {ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
