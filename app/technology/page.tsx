import type { Metadata } from "next";
import { Brain, Compass, Gauge, ShieldCheck, Mic } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import PageSection from "@/components/ui/PageSection";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Technology — The Intelligence Behind Noorva",
  description: "Human-Interactive AI, Noorva Guide, Mood-Based Algorithm, Advanced Source Filtering and Voice Experience.",
};

interface TechEntry {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  shade: "paper" | "dim";
}

const ENTRIES: TechEntry[] = [
  {
    id: "human-interactive-ai",
    icon: Brain,
    eyebrow: "Foundation",
    title: "Human-Interactive AI",
    description: "Learns through natural interaction — conversation, tone and context — rather than forms, menus or rigid commands.",
    shade: "dim",
  },
  {
    id: "noorva-guide",
    icon: Compass,
    eyebrow: "Guidance",
    title: "Noorva Guide",
    description: "Turns understanding into practical action: goals, tasks, reminders and timely follow-ups.",
    shade: "paper",
  },
  {
    id: "mood-algorithm",
    icon: Gauge,
    eyebrow: "Timing",
    title: "Mood-Based Algorithm",
    description: "Helps Noorva understand not just what you need, but when and how you need it.",
    shade: "dim",
  },
  {
    id: "source-filtering",
    icon: ShieldCheck,
    eyebrow: "Trust",
    title: "Advanced Source Filtering",
    description: "Intent detection, source verification, summarization and personalized delivery — focused on credible, relevant information.",
    shade: "paper",
  },
  {
    id: "voice-experience",
    icon: Mic,
    eyebrow: "Interaction",
    title: "Voice Experience",
    description: "Natural voice interaction where supported — speak to Noorva the way you'd speak to a person.",
    shade: "dim",
  },
];

export default function TechnologyPage() {
  return (
    <main className="pt-24">
      <PageSection id="technology-hero">
        <SectionHeading
          eyebrow="The Intelligence"
          title="The technology behind"
          accent="Noorva."
          description="A brief look at what makes Noorva feel less like software and more like a companion — without turning this into a technical document."
          align="center"
        />
      </PageSection>

      {ENTRIES.map((entry) => {
        const Icon = entry.icon;
        return (
          <PageSection key={entry.id} id={entry.id} shade={entry.shade}>
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--line)]">
                <Icon className="h-5 w-5 text-[color:var(--accent)]" strokeWidth={1.5} />
              </div>
              <SectionHeading eyebrow={entry.eyebrow} title={entry.title} align="center" />
              <p className="mt-6 max-w-xl text-base leading-relaxed text-[color:var(--ink-soft)] md:text-lg">{entry.description}</p>
            </div>
          </PageSection>
        );
      })}
    </main>
  );
}
