"use client";

import { useEffect } from "react";
import { lenisRef } from "@/components/store";
import Hero from "@/components/Hero";
import WhatIsNoorvaSection from "@/components/WhatIsNoorvaSection";
import EcosystemShowcaseSection from "@/components/EcosystemShowcaseSection";
import PullQuoteSection from "@/components/PullQuoteSection";
import CompanionTeaserSection from "@/components/CompanionTeaserSection";
import VideoTeaserSection from "@/components/VideoTeaserSection";
import ConnectedFutureSection from "@/components/ConnectedFutureSection";
import TechnologyTeaserSection from "@/components/TechnologyTeaserSection";
import ProductExperienceSection from "@/components/ProductExperienceSection";
import TrustPrivacySection from "@/components/TrustPrivacySection";
import FinalCTASection from "@/components/FinalCTASection";

// Fully rebuilt for the Product Ecosystem Website Documentation, on a fresh
// light/editorial visual language. Nothing from the previous dark "cosmic"
// build is mounted here — not the WelcomeOverlay/CinematicIntro click-to-
// enter sequence, not the Story Book gallery, not the old content sections.
// Those files are left in place (unused, not deleted) rather than removed
// outright, in case any of that work is wanted again later.

export default function Home() {
  // Header nav routes home first for the "Home" anchor when clicked from
  // another page, appending `?scrollTo=home` — finish that scroll here.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("scrollTo");
    if (!target) return;
    const id = window.setTimeout(() => {
      lenisRef.current?.scrollTo(0, { duration: 1.2 });
      window.history.replaceState(null, "", window.location.pathname);
    }, 200);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      <Hero />
      <WhatIsNoorvaSection />
      <EcosystemShowcaseSection />
      <PullQuoteSection />
      <CompanionTeaserSection />
      <VideoTeaserSection />
      <ConnectedFutureSection />
      <TechnologyTeaserSection />
      <ProductExperienceSection />
      <TrustPrivacySection />
      <FinalCTASection />
    </>
  );
}
