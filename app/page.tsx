"use client";

import CinematicIntro from "@/components/CinematicIntro";
import Header from "@/components/Header";
import FeaturesSection from "@/components/FeaturesSection";
import StoryGallerySection from "@/components/StoryGallerySection";
import ClosingSection from "@/components/ClosingSection";
import WelcomeOverlay from "@/components/WelcomeOverlay";
import CosmicBackground from "@/components/CosmicBackground";
import WorldTransitionOverlay from "@/components/WorldTransitionOverlay";

export default function Home() {
  return (
    <>
      <CosmicBackground />
      <div className="grain" />
      <WorldTransitionOverlay />
      <WelcomeOverlay />
      <Header />
      <CinematicIntro />
      <StoryGallerySection />
      <FeaturesSection />
      <ClosingSection />
    </>
  );
}
