import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Brain, ListTodo, Search, BookOpen, Mic, Bell, UserCog, ShieldCheck, ArrowRight } from "lucide-react";
import PageSection from "@/components/ui/PageSection";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import PhoneMockup from "@/components/ui/PhoneMockup";
import CompanionScreen from "@/components/CompanionScreen";
import CompanionDemoSection from "@/components/CompanionDemoSection";
import LifeCategoriesSection from "@/components/LifeCategoriesSection";

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
      <PageSection id="companion-hero" mesh>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <SectionHeading
              eyebrow="Primary Product"
              title="Not another assistant."
              accent="A guide, mentor, planner and companion."
              description="Noorva Companion is designed to understand who you are, remember what matters, and walk beside you every day — offering guidance, encouragement and personalized support that evolves with you."
            />
            <Link href="#get-started" className="btn-primary-sm group mt-10">
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="lg:col-span-5">
            <PhoneMockup>
              <CompanionScreen />
            </PhoneMockup>
          </div>
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

      <CompanionDemoSection />
      <LifeCategoriesSection />

      <PageSection id="get-started">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="order-2 lg:order-1 lg:col-span-6">
            <p className="mb-4 flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.25em] text-[color:var(--ink)] uppercase">
              <span className="h-px w-6" style={{ backgroundImage: "var(--accent-gradient)" }} />
              Get Started
            </p>
            <h2 className="font-display text-3xl leading-[1.15] font-normal text-[color:var(--ink)] md:text-4xl">
              Ready to meet <span>Noorva Companion?</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[color:var(--ink-soft)] md:text-lg">
              Noorva Companion is in active development. Reach out and we&rsquo;ll let you know as soon as it&rsquo;s ready for you.
            </p>
            <Link href="/contact" className="btn-primary group mt-8">
              Get Notified
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="order-1 flex justify-center lg:order-2 lg:col-span-6">
            <Image
              src="/phone-in-hand-trimmed.png"
              alt="A hand holding a phone with the Noorva mark glowing on screen"
              width={420}
              height={406}
              className="h-auto w-full max-w-[340px]"
            />
          </div>
        </div>
      </PageSection>
    </main>
  );
}
