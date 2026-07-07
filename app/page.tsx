"use client";

import CinematicIntro from "@/components/CinematicIntro";
import Header from "@/components/Header";
import StoryGallerySection from "@/components/StoryGallerySection";
import ClosingSection from "@/components/ClosingSection";
import WelcomeOverlay from "@/components/WelcomeOverlay";

export default function Home() {
  return (
    <>
      <div className="grain" />
      <WelcomeOverlay />
      <Header />
      <CinematicIntro />
      <StoryGallerySection />
      <ClosingSection />
    </>
  );
}
