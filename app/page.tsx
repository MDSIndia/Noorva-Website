"use client";

import CinematicIntro from "@/components/CinematicIntro";
import Header from "@/components/Header";
import FeaturesSection from "@/components/FeaturesSection";
import StoryGallerySection from "@/components/StoryGallerySection";
import ClosingSection from "@/components/ClosingSection";
import WelcomeOverlay from "@/components/WelcomeOverlay";
import CosmicBackground from "@/components/CosmicBackground";

export default function Home() {
  return (
    <>
      <CosmicBackground />
      <div className="grain" />
      <WelcomeOverlay />
      <Header />
      <CinematicIntro />
      <FeaturesSection />
      <ClosingSection />
      {/* Hidden by default — a fixed overlay revealed only via the hero's
          "Noorva Book" button or the header's "Story" link, not normal
          scroll flow. Rendered last so its DOM order matches how it stacks
          visually on top of everything else. */}
      <StoryGallerySection />
    </>
  );
}
