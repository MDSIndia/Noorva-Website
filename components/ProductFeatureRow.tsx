"use client";

// Generic "visual + copy + feature list + CTA" row, shared by the
// homepage's Companion/Video teasers (doc §6) and reused inside the
// individual product detail pages for their capability breakdowns (doc
// §9/§11). The visual slot renders whatever the caller passes — a
// PhoneMockup with real (if invented) screen content, rather than a
// generic icon plate.

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export interface ProductFeature {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
}

interface ProductFeatureRowProps {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
  features: ProductFeature[];
  visual: ReactNode;
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
  visual,
  ctaHref,
  ctaLabel,
  reverse = false,
}: ProductFeatureRowProps) {
  return (
    <div className={`flex flex-col gap-14 lg:flex-row lg:items-center lg:gap-16 ${reverse ? "lg:flex-row-reverse" : ""}`}>
      <div className="flex justify-center lg:flex-1">{visual}</div>

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
          className="mb-4 text-[11px] font-semibold tracking-[0.25em] text-[color:var(--ink)] uppercase"
        >
          {eyebrow}
        </motion.p>

        <motion.h2
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="font-display mb-6 text-3xl leading-[1.12] font-normal text-[color:var(--ink)] md:text-4xl lg:text-5xl"
        >
          {title} {accent && <span>{accent}</span>}
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
