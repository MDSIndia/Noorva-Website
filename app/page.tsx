import SmoothScroll   from "@/components/SmoothScroll";
import SpaceIntro     from "@/components/SpaceIntro";
import LandingScene   from "@/components/LandingScene";
import BookScene      from "@/components/BookScene";

export default function Home() {
  return (
    <SmoothScroll>
      {/* Scene 1-2 : deep space → Earth approach (500vh) */}
      <SpaceIntro />
      {/* Scene 3-4 : golden landscape → book falls from sky (380vh) */}
      <LandingScene />
      {/* Scene 5-8 : book opens → rapid flip → pen-written pages (1800vh) */}
      <BookScene />
    </SmoothScroll>
  );
}
