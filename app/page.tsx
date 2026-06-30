"use client";

import CinematicIntro from "@/components/CinematicIntro";
import MainContent from "@/components/MainContent";
import Header from "@/components/Header";

export default function Home() {
  return (
    <>
      <Header />
      <CinematicIntro />
      <MainContent />
    </>
  );
}
