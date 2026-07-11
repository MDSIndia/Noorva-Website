"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { storyChapters, type StoryChapterData, type KenBurns } from "./storyData";

interface StoryCinematicProps {
  /** 0 = the title/cover slide, 1..N = storyChapters[index-1]. */
  currentIndex: number;
}

// Continuous slow drift while a chapter is on screen, not a one-shot
// animation timed to a fixed reading duration — the user controls pacing via
// scroll/swipe, so the motion just needs to feel alive for however long they
// linger, via yoyo+repeat rather than a duration tuned to a guess.
const KEN_BURNS_VARS: Record<KenBurns, { from: gsap.TweenVars; to: gsap.TweenVars }> = {
  "zoom-in": { from: { scale: 1 }, to: { scale: 1.16 } },
  "zoom-out": { from: { scale: 1.16 }, to: { scale: 1 } },
  "pan-left": { from: { scale: 1.12, xPercent: 3 }, to: { scale: 1.12, xPercent: -3 } },
  "pan-right": { from: { scale: 1.12, xPercent: -3 }, to: { scale: 1.12, xPercent: 3 } },
};

function KenBurnsImage({ chapter, reducedMotion }: { chapter: StoryChapterData; reducedMotion: boolean }) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    if (reducedMotion) {
      gsap.set(el, { scale: 1.04, xPercent: 0 });
      return;
    }
    const vars = KEN_BURNS_VARS[chapter.kenBurns];
    gsap.set(el, vars.from);
    const tween = gsap.to(el, { ...vars.to, duration: 9, ease: "sine.inOut", yoyo: true, repeat: -1 });
    return () => {
      tween.kill();
    };
  }, [chapter, reducedMotion]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- fixed set of public/story assets, plain img keeps the GSAP ref simple (matches the removed BookPage.tsx's own precedent for the same reason)
    <img
      ref={imgRef}
      src={chapter.imageSrc}
      alt={chapter.headline}
      className="absolute inset-0 h-full w-full object-cover"
      // grade: 0 = sepia/monochrome (ancient past), 1 = full natural color
      // (present) — the story "colorizes itself" as it progresses, same
      // formula the removed CSS-page version (BookPage.tsx) already proved.
      style={{ filter: `saturate(${0.25 + chapter.grade * 0.75}) sepia(${(1 - chapter.grade) * 0.55})` }}
      draggable={false}
    />
  );
}

function CoverSlide() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
      style={{ background: "radial-gradient(150% 120% at 50% -10%, #2c1c14 0%, #1a1108 42%, #090604 100%)" }}
    >
      <div className="pointer-events-none absolute inset-6 rounded-2xl border sm:inset-10" style={{ borderColor: "rgba(232,180,120,0.3)" }} />
      <div
        className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border"
        style={{ borderColor: "rgba(232,180,120,0.5)", boxShadow: "0 0 52px rgba(232,180,120,0.25)" }}
      >
        <div className="h-10 w-10 rounded-full" style={{ background: "radial-gradient(circle, #c084fc, #7c5cfc)" }} />
      </div>
      <p className="mb-4 text-xs font-light tracking-[0.5em] uppercase" style={{ color: "rgba(232,180,120,0.75)" }}>
        The Noorva Story
      </p>
      <h1
        className="font-playfair mb-6 text-5xl font-light text-transparent md:text-7xl"
        style={{
          backgroundImage: "linear-gradient(180deg, #fff7e6 0%, #f6e3ba 30%, #e8b478 65%, #a97a3f 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        Noorva
      </h1>
      <p className="max-w-md text-sm font-light text-white/50 italic md:text-base">
        A story of how humanity has always reached for connection — and the next step it takes.
      </p>
      <p className="mt-8 text-xs font-light tracking-[0.4em] text-white/30 uppercase">08 Chapters</p>
      <p className="mt-14 text-[10px] font-light tracking-[0.4em] text-white/40 uppercase" style={{ animation: "pulse 2.4s ease-in-out infinite" }}>
        Scroll to begin
      </p>
    </div>
  );
}

function ChapterSlide({ chapter, reducedMotion }: { chapter: StoryChapterData; reducedMotion: boolean }) {
  const total = storyChapters.length;
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <KenBurnsImage chapter={chapter} reducedMotion={reducedMotion} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,7,4,0.05) 0%, rgba(10,7,4,0.15) 40%, rgba(10,7,4,0.65) 70%, rgba(6,4,2,0.92) 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 220px rgba(0,0,0,0.5)" }} />

      {/* Text cuts cleanly between chapters (mode="wait") rather than
          crossfading — the image layer above is what overlaps/dissolves;
          letting two chapters' dense text overlap the same fixed position
          simultaneously read as confusing ghosting during an earlier pass
          at this (see the fix in StoryGallerySection.tsx's page-turn
          history), so text and image intentionally use different
          transition styles here. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={chapter.index}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="absolute inset-x-0 bottom-0 px-8 pb-20 sm:px-14 sm:pb-24 md:px-20 md:pb-28"
        >
          <p className="text-xs font-light tracking-[0.4em] uppercase" style={{ color: "rgba(232,180,120,0.9)" }}>
            {chapter.eyebrow}
          </p>
          <h2 className="font-playfair mt-4 max-w-2xl text-3xl leading-[1.2] font-light text-[#fdf6e8] md:text-5xl">{chapter.headline}</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed font-light text-white/80 md:text-base">{chapter.body}</p>
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-8 bottom-6 flex items-center justify-between sm:inset-x-14 md:inset-x-20">
        <span className="text-[10px] font-light tracking-[0.3em] text-white/50 uppercase">The Noorva Story</span>
        <span className="text-[10px] font-light tracking-[0.3em] text-white/50">
          {String(chapter.index).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

/** The fullscreen cinematic sequence shown after the book "opens" — a
 *  title/cover slide followed by one full-bleed Ken Burns image per
 *  chapter, replacing the earlier WebGL page-curl reader entirely.
 *  `currentIndex` is owned by StoryGallerySection.tsx, which already has
 *  the wheel/touch/keyboard gesture handling this reuses verbatim; this
 *  component only renders whichever slide is current and crossfades
 *  between them. */
export default function StoryCinematic({ currentIndex }: StoryCinematicProps) {
  // Lazily initialized off matchMedia directly, not a ref — this component
  // only ever mounts client-side (inside the fullscreen overlay, after a
  // user click), never part of the server-rendered HTML, so there's no
  // hydration-mismatch risk to guard against. Matches BookReader3D.tsx's
  // identical useIsDesktop precedent; a ref read during render (the
  // original version of this) trips the react-hooks/refs lint rule.
  const [reducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const chapter = currentIndex > 0 ? storyChapters[currentIndex - 1] : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <AnimatePresence>
        <motion.div
          key={currentIndex}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          {chapter ? <ChapterSlide chapter={chapter} reducedMotion={reducedMotion} /> : <CoverSlide />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
