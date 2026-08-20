import type { Metadata } from "next";
import Link from "next/link";
import { Search, Bell, Sparkles, ShieldCheck, Layers, MessageSquareQuote, PlayCircle, BadgeCheck, ArrowRight } from "lucide-react";
import PageSection from "@/components/ui/PageSection";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import PhoneMockup from "@/components/ui/PhoneMockup";
import VideoScreen from "@/components/VideoScreen";

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
      <PageSection id="video-hero" mesh>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <SectionHeading
              eyebrow="Content Product"
              title="Not another"
              accent="scrolling feed."
              description="Noorva Video is Noorva's personalized discovery and video-sharing platform — built for useful, relevant and credible content, efficient consumption, and creators you can trust."
            />
            <Link href="/contact" className="btn-primary-sm group mt-10">
              Explore Noorva Video
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="lg:col-span-5">
            <PhoneMockup tilt={2}>
              <VideoScreen />
            </PhoneMockup>
          </div>
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
    </main>
  );
}
