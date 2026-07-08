"use client";

import { forwardRef, type Ref } from "react";
import { storyChapters, type StoryChapterData } from "./storyData";

interface BookPageProps {
  chapter: StoryChapterData;
  /** Attached to a full-bleed overlay used to darken the page as it turns edge-on mid-flip. */
  shadeRef?: Ref<HTMLDivElement>;
}

const TOTAL = storyChapters.length;

// A single storybook page, always split into two leaves side by side: a
// full-height vertical photo plate (the page's left half) and the chapter's
// text (its right half) — read as one physical sheet of paper with a photo
// mounted on it, not an image with a caption floating over it.
// `chapter.grade` (0 = sepia past, 1 = full color present) drives a CSS
// filter so the imagery still "colorizes itself" through the story.
const BookPage = forwardRef<HTMLDivElement, BookPageProps>(function BookPage({ chapter, shadeRef }, ref) {
  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden rounded-[10px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
    >
      {/* Paper — warm cream/parchment, not a dark UI panel, so the page
          actually reads as a physical sheet of paper the way the leather
          cover reads as leather. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 30% 0%, #f5ead0 0%, #ecdcb4 55%, #ddc797 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.09] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* Aged/foxed vignette — a faint warm darkening toward the edges,
          like a real page that's picked up age rather than a flat tint. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 90px rgba(120,90,45,0.18), inset 0 0 30px rgba(90,65,30,0.12)" }}
      />

      {/* Ornate double border */}
      <div className="pointer-events-none absolute inset-3 rounded-[6px] border border-[#8a6a35]/35" />
      <div className="pointer-events-none absolute inset-[18px] rounded-[3px] border border-[#8a6a35]/18" />

      <div className="relative flex h-full min-h-0 flex-row items-stretch gap-3 p-5 pt-24 sm:gap-5 sm:pt-24 md:gap-8 md:p-10 md:pt-28 lg:gap-10 lg:p-12 lg:pt-32">
        {/* Photo plate — just the photo itself, no border/background box
            around it. The wrapper below is bounded to the page's height so
            the image can never run off the bottom; within that bound it's
            sized by its own aspect ratio (h-full + max-w-full, whichever
            the image's proportions hit first), so it may end up a little
            shorter than the full column height on wider chapter photos
            rather than crop or add empty matting either. */}
        <div className="flex h-full w-[38%] shrink-0 flex-col sm:w-[40%] md:w-[46%]">
          <div className="relative min-h-0 flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed set of public/story assets, plain img avoids next/image fill-inside-flex sizing friction */}
            <img
              src={chapter.imageSrc}
              alt={chapter.headline}
              className="block h-full max-w-full rounded-[6px] object-contain shadow-[0_20px_50px_-15px_rgba(60,40,15,0.5)]"
              style={{ filter: `saturate(${0.25 + chapter.grade * 0.75}) sepia(${(1 - chapter.grade) * 0.55})` }}
              draggable={false}
            />
          </div>
          <p className="mt-2 text-center text-[8px] font-light tracking-[0.35em] text-[#7a5f38]/70 uppercase md:mt-3 md:text-[9px]">
            Ch. {String(chapter.index).padStart(2, "0")}
          </p>
        </div>

        {/* Content — the page's right leaf. Ink tones instead of the
            near-white palette the dark-page version used — a light paper
            background needs dark type, the same as a printed book. */}
        <div className="flex h-full min-h-0 flex-1 flex-col justify-center overflow-hidden">
          <p className="text-[9px] font-light tracking-[0.35em] text-[#9c6b2e] uppercase md:text-xs md:tracking-[0.4em]">
            {chapter.eyebrow}
          </p>

          <h2 className="font-playfair mt-2 text-lg leading-[1.2] font-light text-[#332618] md:mt-5 md:text-3xl lg:text-4xl">
            {chapter.headline}
          </h2>

          <p className="first-letter:font-playfair mt-2 text-[11px] leading-relaxed font-light text-[#5b4a35] first-letter:float-left first-letter:mr-1 first-letter:text-3xl first-letter:leading-[0.75] first-letter:text-[#9c6b2e] md:mt-4 md:text-sm lg:text-base">
            {chapter.body}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-[#8a6a35]/25 pt-3 md:mt-auto md:pt-4">
            <span className="text-[8px] font-light tracking-[0.3em] text-[#7a5f38]/70 uppercase md:text-[9px]">
              The Noorva Story
            </span>
            <span className="text-[8px] font-light tracking-[0.3em] text-[#7a5f38]/70 md:text-[9px]">
              {String(chapter.index).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Flip-lighting shade, opacity driven by StoryGallerySection as the page turns edge-on */}
      <div
        ref={shadeRef}
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(105deg, rgba(255,255,255,0.14) 0%, rgba(0,0,0,0.85) 55%)",
          opacity: 0,
        }}
      />
    </div>
  );
});

export default BookPage;
