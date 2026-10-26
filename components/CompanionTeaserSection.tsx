"use client";

// Doc §6/§9 — the homepage's first detailed product introduction, ahead of
// Video/Glasses/Phones per the doc's "Companion first" ordering.

import { Brain, ListTodo, Search, Mic } from "lucide-react";
import PageSection from "./ui/PageSection";
import ProductFeatureRow from "./ProductFeatureRow";
import Phone3D from "./ui/Phone3D";

const FEATURES = [
  { icon: Brain, title: "Noorva Properative AI", description: "Natural, personalized conversations that remember you." },
  { icon: ListTodo, title: "Noorva Guide", description: "Goals, tasks, reminders and daily guidance." },
  { icon: Search, title: "Precise Search", description: "Natural-language discovery of relevant information." },
  { icon: Mic, title: "Voice Experience", description: "Speak naturally — speech-to-text and text-to-speech." },
];

export default function CompanionTeaserSection() {
  return (
    <PageSection id="companion">
      <ProductFeatureRow
        eyebrow="Primary Product"
        title="Noorva Companion —"
        accent="a companion that grows with you."
        description="A personalized, Noorva Properative AI companion for everyday life. Not another assistant — a guide, mentor, planner and companion that understands your goals and walks beside you."
        features={FEATURES}
        visual={<Phone3D />}
        ctaHref="/products/companion"
        ctaLabel="Explore Noorva Companion"
      />
    </PageSection>
  );
}
