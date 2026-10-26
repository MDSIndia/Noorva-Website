"use client";

// "Built for Your Entire Life" — the breadth of what Noorva Companion
// covers, framed by life area rather than by feature.

import { Coffee, Sun, GraduationCap, Heart, Wallet, Users, Target } from "lucide-react";
import PageSection from "./ui/PageSection";
import SectionHeading from "./ui/SectionHeading";
import Card from "./ui/Card";

const CATEGORIES = [
  { icon: Coffee, title: "Lifestyle", description: "Curates ideas, manages routines and enhances your everyday life." },
  { icon: Sun, title: "Productivity", description: "Plans, tasks, calendar, focus and follow-through." },
  { icon: GraduationCap, title: "Learning", description: "Summarizes, teaches, recommends and grows with you." },
  { icon: Heart, title: "Health & Wellness", description: "Tracks habits, suggests routines and keeps you accountable." },
  { icon: Wallet, title: "Finance", description: "Budgets, tracks, reminds and helps you make smarter decisions." },
  { icon: Users, title: "Relationships", description: "Remembers, suggests and helps you stay meaningfully connected." },
  { icon: Target, title: "Personal Growth", description: "Guides your mindset, reflection and long-term goals." },
];

export default function LifeCategoriesSection() {
  return (
    <PageSection id="life-categories" shade="dim">
      <SectionHeading
        eyebrow="Built For Your Entire Life"
        title="One intelligence."
        accent="Every part of your world."
        description="Noorva works across your life and adapts to you."
      />

      <div className="mt-16 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={c.title} delay={i * 0.04}>
              <div className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundImage: "var(--accent-gradient)" }}>
                  <Icon className="h-[18px] w-[18px] text-white" strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 text-base font-medium text-[color:var(--ink)]">{c.title}</h3>
                <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{c.description}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </PageSection>
  );
}
