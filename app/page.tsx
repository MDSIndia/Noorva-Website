"use client";

import CinematicIntro from "@/components/CinematicIntro";
import MainContent from "@/components/MainContent";

export default function Home() {
  return (
    <main className="bg-black text-white" style={{ overflowX: "clip" }}>
      <CinematicIntro />
      <MainContent />
    </main>
  );
}
