"use client";

// Shared layout for Noorva Glasses and Noorva Phones (doc §13/§14) — both
// pages are structurally identical (concept positioning, ecosystem fit,
// connection to Companion, future CTA), differing only in copy and icon, so
// one implementation serves both instead of two near-duplicate page files.
// No hardware specs, sensors, battery or OS claims are made anywhere here —
// the supplied documentation explicitly withholds those pending
// client-approved specifications.

import Link from "next/link";
import { ArrowRight, Link2, Glasses, Smartphone } from "lucide-react";
import PageSection from "./ui/PageSection";
import Card from "./ui/Card";
import { motion } from "framer-motion";

const ICONS = { glasses: Glasses, phones: Smartphone } as const;

interface FutureProductPageProps {
  icon: keyof typeof ICONS;
  name: string;
  positioning: string;
  ecosystemFit: string;
  companionConnection: string;
  useCases: string[];
}

export default function FutureProductPage({
  icon,
  name,
  positioning,
  ecosystemFit,
  companionConnection,
  useCases,
}: FutureProductPageProps) {
  const Icon = ICONS[icon];
  return (
    <main className="pt-24">
      <PageSection id={`${name.toLowerCase().replace(/\s+/g, "-")}-hero`} mesh>
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative mb-8 flex h-20 w-20 items-center justify-center rounded-full shadow-[0_16px_32px_-16px_var(--shadow-accent)]"
            style={{ backgroundImage: "var(--accent-gradient)" }}
          >
            <Icon className="h-8 w-8 text-white" strokeWidth={1} />
          </motion.div>

          <span className="mb-5 rounded-full border border-[color:var(--line)] px-4 py-1.5 text-[10px] font-medium tracking-[0.2em] text-[color:var(--ink-soft)] uppercase">
            Future / Ecosystem Product
          </span>

          <h1 className="font-display text-4xl leading-[1.15] font-normal text-[color:var(--ink)] md:text-5xl lg:text-6xl">{name}</h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[color:var(--ink-soft)] md:text-lg">{positioning}</p>
        </div>
      </PageSection>

      <PageSection shade="dim">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2">
          <Card>
            <div className="p-8">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundImage: "var(--accent-gradient)" }}>
                <Link2 className="h-[18px] w-[18px] text-white" strokeWidth={1.5} />
              </div>
              <h3 className="font-display mb-3 text-xl font-normal text-[color:var(--ink)]">How It Fits the Ecosystem</h3>
              <p className="text-sm leading-relaxed text-[color:var(--ink-soft)] md:text-base">{ecosystemFit}</p>
            </div>
          </Card>
          <Card delay={0.06}>
            <div className="p-8">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundImage: "var(--accent-gradient)" }}>
                <Icon className="h-[18px] w-[18px] text-white" strokeWidth={1.5} />
              </div>
              <h3 className="font-display mb-3 text-xl font-normal text-[color:var(--ink)]">Connection with Noorva Companion</h3>
              <p className="text-sm leading-relaxed text-[color:var(--ink-soft)] md:text-base">{companionConnection}</p>
            </div>
          </Card>
        </div>

        <div className="mx-auto mt-5 max-w-5xl">
          <Card delay={0.1}>
            <div className="p-8">
              <h3 className="font-display mb-5 text-xl font-normal text-[color:var(--ink)]">High-Level Use Cases (Once Approved)</h3>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {useCases.map((u) => (
                  <li key={u} className="flex items-start gap-2.5 text-sm leading-relaxed text-[color:var(--ink-soft)]">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color:var(--accent)]" />
                    {u}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs leading-relaxed text-[color:var(--ink-faint)]">
                Specific hardware, sensor and platform capabilities will be published once specifications are finalized and approved.
              </p>
            </div>
          </Card>
        </div>

        <div className="mt-14 flex justify-center">
          <Link href="/contact" className="btn-primary-sm group">
            Notify Me
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </PageSection>
    </main>
  );
}
