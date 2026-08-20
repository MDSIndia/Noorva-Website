import type { Metadata } from "next";
import Link from "next/link";
import { Search, Bell, Sparkles, ShieldCheck, Layers, MessageSquareQuote, PlayCircle, BadgeCheck, ArrowRight } from "lucide-react";
import PageSection from "@/components/ui/PageSection";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Noorva Video — Content Product",
  description: "A personalized video platform focused on useful, relevant and credible content — not endless scrolling.",
};

const CAPABILITIES = [
  { icon: Search, title: "Precise Video Search", description: "Natural-language search finds exactly what you're looking for." },
  { icon: Bell, title: "Smart Video Reminders", description: "Come back to content that matters, right when it matters." },
  { icon: Sparkles, title: "Personalized Recommendations", description: "Discovery shaped by your interests, not just engagement." },
  { icon: ShieldCheck, title: "Content Source Filtering", description: "Credible sources are surfaced over noise." },
  { icon: Layers, title: "Multi-Platform Access", description: "Reach video content across supported platforms." },
  { icon: MessageSquareQuote, title: "Why This Video", description: "A dynamic explanation of why each video was recommended." },
  { icon: PlayCircle, title: "Modern Playback", description: "A clean, modern video player built for focus." },
  { icon: BadgeCheck, title: "Verified Creators", description: "Creator channels, uploads, and verified badges you can trust." },
];

export default function VideoPage() {
  return (
    <main className="pt-24">
      <PageSection id="video-hero">
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <div
            className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-[color:var(--line)] shadow-[0_16px_32px_-16px_var(--shadow-warm)]"
            style={{ background: "linear-gradient(160deg, var(--paper-dim), var(--paper))" }}
          >
            <PlayCircle className="h-8 w-8 text-[color:var(--accent)]" strokeWidth={1} />
          </div>
          <SectionHeading
            eyebrow="Content Product"
            title="Not another"
            accent="scrolling feed."
            description="Noorva Video is Noorva's personalized discovery and video-sharing platform — built for useful, relevant and credible content, efficient consumption, and creators you can trust."
            align="center"
          />
        </div>
        <div className="mt-10 flex justify-center">
          <Link href="/contact" className="btn-primary-sm group">
            Explore Noorva Video
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </PageSection>

      <PageSection id="video-capabilities" shade="dim">
        <SectionHeading eyebrow="What It Does" title="Discovery," accent="done differently." />
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
    </main>
  );
}
