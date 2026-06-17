import SmoothScroll from "@/components/SmoothScroll";
import SpaceIntro   from "@/components/SpaceIntro";
import BookScene    from "@/components/BookScene";

export default function Home() {
  return (
    <SmoothScroll>
      {/* ── Phase 1-2: Cinematic space journey (500vh) ── */}
      <SpaceIntro />

      {/* ── Phase 3-5: Globe → Book → Page-flip experience (1400vh) ── */}
      <BookScene />
    </SmoothScroll>
  );
}
