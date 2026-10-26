"use client";

// Doc §6/§11 — the video sharing/discovery platform teaser, positioned
// right after Companion per the doc's homepage flow.

import { Search, Bell, ShieldCheck, Users } from "lucide-react";
import PageSection from "./ui/PageSection";
import ProductFeatureRow from "./ProductFeatureRow";
import Phone3D from "./ui/Phone3D";

const FEATURES = [
  { icon: Search, title: "Precise Video Search", description: "Natural-language discovery, not endless scrolling." },
  { icon: Bell, title: "Smart Reminders", description: "Never miss content that actually matters to you." },
  { icon: ShieldCheck, title: "Source Filtering", description: "Credible, verified sources over noise." },
  { icon: Users, title: "Verified Creators", description: "A creator ecosystem built on trust." },
];

export default function VideoTeaserSection() {
  return (
    <PageSection id="video" shade="dim">
      <ProductFeatureRow
        eyebrow="Content Product"
        title="Noorva Video —"
        accent="content worth your time."
        description="Noorva isn't intended to be another conventional scrolling video app. It's built for personalized discovery, useful content, credible creators and efficient consumption."
        features={FEATURES}
        visual={<Phone3D screen="video" />}
        ctaHref="/products/video"
        ctaLabel="Explore Noorva Video"
        reverse
      />
    </PageSection>
  );
}
