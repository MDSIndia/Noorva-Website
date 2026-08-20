import type { Metadata } from "next";
import { Brain, Heart, Compass, Sprout } from "lucide-react";
import PageSection from "@/components/ui/PageSection";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "About Noorva",
  description: "More than AI. A companion that grows with you.",
};

const VALUES = [
  { icon: Brain, title: "Learns You", description: "Remembers your routines, preferences and goals." },
  { icon: Heart, title: "Understands You", description: "Responds with empathy and context instead of generic replies." },
  { icon: Compass, title: "Guides You", description: "Provides personalized guidance that evolves with you." },
  { icon: Sprout, title: "Grows With You", description: "Improves every interaction through continuous learning." },
];

export default function AboutPage() {
  return (
    <main className="pt-24">
      <PageSection id="about-noorva">
        <SectionHeading
          eyebrow="About Noorva"
          title="More than AI."
          accent="A companion that grows with you."
          description="Noorva is designed to be more than an AI assistant. It is a companion that learns who you are, remembers what matters, understands your goals, and walks beside you every day."
        />

        <div className="mt-10 max-w-2xl space-y-5 text-base leading-relaxed text-[color:var(--ink-soft)] md:text-lg">
          <p>
            Instead of simply answering questions, Noorva offers guidance, encouragement, thoughtful conversations, and
            personalized support that evolves over time.
          </p>
          <p>
            Powered by advanced intelligence and shaped by human warmth, Noorva becomes a trusted presence that helps
            you navigate work, learning, relationships, health, and life&rsquo;s important moments.
          </p>
          <p className="text-[color:var(--ink)]">It doesn&rsquo;t replace human connection — it strengthens it.</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 border-t border-[color:var(--line)] pt-12 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title}>
                <Icon className="mb-4 h-5 w-5 text-[color:var(--accent)]" strokeWidth={1.5} />
                <h3 className="mb-2 text-base font-medium text-[color:var(--ink)]">{v.title}</h3>
                <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{v.description}</p>
              </div>
            );
          })}
        </div>
      </PageSection>

      <PageSection shade="dim">
        <p className="font-display mx-auto max-w-3xl text-center text-2xl leading-[1.5] font-normal text-[color:var(--ink)] italic md:text-3xl">
          &ldquo;A companion that remembers your journey, understands your story, and helps shape your future.&rdquo;
        </p>
        <p className="mt-6 text-center text-xs tracking-[0.2em] text-[color:var(--accent)] uppercase">— Noorva</p>
      </PageSection>
    </main>
  );
}
