"use client";

// Doc §6/§16 — Technology homepage beat: introduces the intelligence behind
// Noorva without turning the homepage into a technical document; full
// detail lives on /technology.

import Link from "next/link";
import { ArrowRight, Brain, Compass, Gauge, ShieldCheck } from "lucide-react";
import PageSection from "./ui/PageSection";
import SectionHeading from "./ui/SectionHeading";
import Card from "./ui/Card";

const TECH = [
  { icon: Brain, title: "Human-Interactive AI", description: "Learns through natural interaction, not forms and menus." },
  { icon: Compass, title: "Noorva Guide", description: "Turns understanding into practical, everyday action." },
  { icon: Gauge, title: "Mood-Based Algorithm", description: "Understands timing and context, not just requests." },
  { icon: ShieldCheck, title: "Advanced Source Filtering", description: "Focuses on credible, relevant information." },
];

export default function TechnologyTeaserSection() {
  return (
    <PageSection id="technology-teaser" shade="dim">
      <SectionHeading eyebrow="The Intelligence" title="Technology that feels" accent="less like software." />

      <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TECH.map((t, i) => {
          const Icon = t.icon;
          return (
            <Card key={t.title} delay={i * 0.06}>
              <div className="p-6">
                <Icon className="mb-4 h-6 w-6 text-[color:var(--accent)]" strokeWidth={1.5} />
                <h3 className="mb-2 text-base font-medium text-[color:var(--ink)]">{t.title}</h3>
                <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{t.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-14 flex justify-center">
        <Link
          href="/technology"
          className="group inline-flex items-center gap-2 text-sm font-medium tracking-[0.05em] text-[color:var(--ink)] uppercase transition-colors duration-300 hover:text-[color:var(--accent)]"
        >
          Explore the Technology
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </PageSection>
  );
}
