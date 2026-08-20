import type { Metadata } from "next";
import { Brain, Video, Glasses, Smartphone, Sparkles } from "lucide-react";
import PageSection from "@/components/ui/PageSection";
import SectionHeading from "@/components/ui/SectionHeading";
import EcosystemShowcaseSection from "@/components/EcosystemShowcaseSection";

export const metadata: Metadata = {
  title: "Ecosystem — How Noorva Products Connect",
  description: "Noorva products aren't separate, unrelated tools — they're one connected ecosystem, built around a shared intelligence.",
};

const CONNECTION_STORY = [
  { icon: Brain, title: "Noorva Companion", role: "Personal intelligence & primary interaction layer" },
  { icon: Video, title: "Noorva Video", role: "Personalized and credible visual content" },
  { icon: Glasses, title: "Noorva Glasses", role: "A wearable extension of the ecosystem" },
  { icon: Smartphone, title: "Noorva Phones", role: "A deeper, device-level Noorva experience" },
  { icon: Sparkles, title: "Future Products", role: "Connect into the same ecosystem as they're introduced" },
];

export default function EcosystemPage() {
  return (
    <main className="pt-24">
      <PageSection id="ecosystem-hero" mesh>
        <SectionHeading
          eyebrow="The Ecosystem"
          title="One intelligence,"
          accent="many products."
          description="Noorva products are not separate, unrelated tools. Each one shares the same understanding of you — carrying it across every experience you use."
          align="center"
        />
      </PageSection>

      <PageSection id="ecosystem-story" shade="dim">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {CONNECTION_STORY.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-center gap-5 rounded-2xl border border-[color:var(--line)] bg-[color:var(--paper)] px-6 py-5"
              >
                <span className="font-mono shrink-0 text-xs text-[color:var(--ink-faint)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--line)]">
                  <Icon className="h-4 w-4 text-[color:var(--accent)]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-base font-medium text-[color:var(--ink)]">{item.title}</h3>
                  <p className="text-sm text-[color:var(--ink-soft)]">{item.role}</p>
                </div>
              </div>
            );
          })}
        </div>
      </PageSection>

      <EcosystemShowcaseSection />
    </main>
  );
}
