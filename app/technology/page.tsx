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
  title: string;
  description: string;
}

const ENTRIES: TechEntry[] = [
  {
    id: "human-interactive-ai",
    icon: Brain,
    title: "Human-Interactive AI",
    description: "Learns through natural interaction — conversation, tone and context — rather than forms, menus or rigid commands.",
  },
  {
    id: "noorva-guide",
    icon: Compass,
    title: "Noorva Guide",
    description: "Turns understanding into practical action: goals, tasks, reminders and timely follow-ups.",
  },
  {
    id: "mood-algorithm",
    icon: Gauge,
    title: "Mood-Based Algorithm",
    description: "Helps Noorva understand not just what you need, but when and how you need it.",
  },
  {
    id: "source-filtering",
    icon: ShieldCheck,
    title: "Advanced Source Filtering",
    description: "Intent detection, source verification, summarization and personalized delivery — focused on credible, relevant information.",
  },
  {
    id: "voice-experience",
    icon: Mic,
    title: "Voice Experience",
    description: "Natural voice interaction where supported — speak to Noorva the way you'd speak to a person.",
  },
];

export default function TechnologyPage() {
  return (
    <main className="pt-24">
      <PageSection id="technology-hero" mesh>
        <SectionHeading
          eyebrow="The Intelligence"
          title="The technology behind"
          accent="Noorva."
          description="A brief look at what makes Noorva feel less like software and more like a companion — without turning this into a technical document."
          className="max-w-2xl"
        />
      </PageSection>

      <PageSection shade="dim">
        <div className="divide-y divide-[color:var(--line)] border-t border-[color:var(--line)]">
          {ENTRIES.map((entry, i) => {
            const Icon = entry.icon;
            return (
              <div key={entry.id} id={entry.id} className="scroll-mt-28 py-10 md:py-12">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-10">
                  <div className="flex items-center gap-4 md:col-span-4">
                    <span className="font-display text-sm text-[color:var(--ink-faint)]">{String(i + 1).padStart(2, "0")}</span>
                    <Icon className="h-5 w-5 text-[color:var(--accent)]" strokeWidth={1.5} />
                    <h3 className="text-lg font-medium text-[color:var(--ink)] md:text-xl">{entry.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-[color:var(--ink-soft)] md:col-span-8 md:text-base">{entry.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </PageSection>
    </main>
  );
}
