import type { Metadata } from "next";
import Link from "next/link";
import { Brain, ListTodo, Search, BookOpen, Mic, Bell, UserCog, ShieldCheck, ArrowRight, MessageCircleHeart } from "lucide-react";
import PageSection from "@/components/ui/PageSection";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Noorva Companion — Primary Product",
  description: "A personalized, human-interactive AI companion for everyday life. A guide, mentor, planner and companion — not another assistant.",
};

const CAPABILITIES = [
  { icon: Brain, title: "Human-Interactive AI", description: "Natural, personalized conversations that build understanding over time." },
  { icon: ListTodo, title: "Noorva Guide", description: "Goals, tasks, reminders, follow-ups and daily guidance." },
  { icon: Search, title: "Precise Search", description: "Natural-language discovery of relevant information." },
  { icon: BookOpen, title: "Basic Memory", description: "Goals, preferences, tasks and notes, remembered for continuity." },
  { icon: Mic, title: "Voice Interaction", description: "Speech-to-text and text-to-speech, so conversation feels natural." },
  { icon: Bell, title: "Smart Reminders", description: "Reminders and daily summaries, delivered at the right moment." },
  { icon: UserCog, title: "Personalization", description: "Shaped by your preferences and interactions, not a generic default." },
  { icon: ShieldCheck, title: "Smart Source Filtering", description: "Intent detection, source verification, summarization and personalized delivery." },
];

export default function CompanionPage() {
  return (
    <main className="pt-24">
      <PageSection id="companion-hero">
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <div
            className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-[color:var(--line)] shadow-[0_16px_32px_-16px_var(--shadow-warm)]"
            style={{ background: "linear-gradient(160deg, var(--paper-dim), var(--paper))" }}
          >
            <MessageCircleHeart className="h-8 w-8 text-[color:var(--accent)]" strokeWidth={1} />
          </div>
          <SectionHeading
            eyebrow="Primary Product"
            title="Not another assistant."
            accent="A guide, mentor, planner and companion."
            description="Noorva Companion is designed to understand who you are, remember what matters, and walk beside you every day — offering guidance, encouragement and personalized support that evolves with you."
            align="center"
          />
        </div>
        <div className="mt-10 flex justify-center">
          <Link href="#get-started" className="btn-primary-sm group">
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </PageSection>

      <PageSection id="companion-capabilities" shade="dim">
        <SectionHeading eyebrow="What It Does" title="Core" accent="capabilities." />
        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((c, i) => {
            const Icon = c.icon;
            return (
              <Card key={c.title} delay={i * 0.04}>
                <div className="p-6">
                  <Icon className="mb-4 h-6 w-6 text-[color:var(--accent)]" strokeWidth={1.5} />
                  <h3 className="mb-2 text-base font-medium text-[color:var(--ink)]">{c.title}</h3>
                  <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{c.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </PageSection>

      <PageSection id="get-started">
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeading eyebrow="Get Started" title="Ready to meet" accent="Noorva Companion?" align="center" />
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[color:var(--ink-soft)] md:text-lg">
            Noorva Companion is in active development. Reach out and we&rsquo;ll let you know as soon as it&rsquo;s ready for you.
          </p>
          <Link href="/contact" className="btn-primary group mt-8">
            Get Notified
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </PageSection>
    </main>
  );
}
