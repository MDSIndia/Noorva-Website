"use client";

import { forwardRef, type Ref } from "react";
import { storyChapters, type StoryChapterData } from "./storyData";

interface BookPageProps {
  chapter: StoryChapterData;
  /** Attached to a full-bleed overlay used to darken the page as it turns edge-on mid-flip. */
  shadeRef?: Ref<HTMLDivElement>;
}

const TOTAL = storyChapters.length;

// A single storybook page: paper texture, an inset illustration "plate",
// eyebrow/headline/body, and a page-number footer. `chapter.grade` (0 = sepia
// past, 1 = full color present) drives a CSS filter so the imagery still
// "colorizes itself" through the story, echoing what the old WebGL gallery
// did with a shader.
const BookPage = forwardRef<HTMLDivElement, BookPageProps>(function BookPage({ chapter, shadeRef }, ref) {
  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden rounded-[10px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
    >
      {/* Paper */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 30% 0%, #241c14 0%, #161009 55%, #0d0a06 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Ornate double border */}
      <div className="pointer-events-none absolute inset-3 rounded-[6px] border border-[color:var(--accent-warm)]/25" />
      <div className="pointer-events-none absolute inset-[18px] rounded-[3px] border border-[color:var(--accent-warm)]/10" />

      <div className="relative h-full min-h-0 p-3 md:flex md:flex-row md:p-4">
        {/* Illustration plate — full-bleed behind the caption on mobile, left half on desktop */}
        <div className="absolute inset-3 overflow-hidden rounded-[4px] border border-white/10 md:relative md:inset-0 md:h-full md:w-[54%]">
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed set of public/story assets, plain img avoids next/image fill-inside-flex sizing friction */}
          <img
            src={chapter.imageSrc}
            alt={chapter.headline}
            className="h-full w-full object-cover"
            style={{ filter: `saturate(${0.25 + chapter.grade * 0.75}) sepia(${(1 - chapter.grade) * 0.55})` }}
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/50" />
          {/* Fades toward the bottom so the overlapping mobile caption stays legible against the photo. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-black/25" />
        </div>

        {/* Caption — floats over the bottom of the full-bleed image on mobile, sits beside it in its own column on desktop */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex max-h-[68%] min-h-0 flex-col overflow-hidden rounded-b-[4px] px-4 pt-10 pb-4 md:static md:inset-auto md:max-h-none md:min-h-0 md:flex-1 md:overflow-visible md:rounded-none md:px-0 md:pt-24 md:pr-8 md:pb-2 md:pl-7 lg:pt-28 lg:pl-9">
          <p className="text-[10px] font-light tracking-[0.4em] text-[color:var(--accent-warm)]/80 uppercase md:text-xs">
            {chapter.eyebrow}
          </p>

          <h2 className="font-playfair mt-3 text-xl leading-[1.2] font-light text-white/92 md:mt-5 md:text-3xl lg:text-4xl">
            {chapter.headline}
          </h2>
          <p className="first-letter:font-playfair mt-3 text-xs leading-relaxed font-light text-white/70 first-letter:float-left first-letter:mr-1 first-letter:text-4xl first-letter:leading-[0.75] first-letter:text-[color:var(--accent-warm)] md:text-white/55 md:mt-4 md:text-sm lg:text-base">
            {chapter.body}
          </p>

          <div className="mt-auto flex items-center justify-between border-t border-white/15 pt-3 md:border-white/10 md:pt-4">
            <span className="text-[9px] font-light tracking-[0.3em] text-white/40 uppercase md:text-white/30">The Noorva Story</span>
            <span className="text-[9px] font-light tracking-[0.3em] text-white/40 md:text-white/30">
              {String(chapter.index).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Flip-lighting shade, opacity driven by useFlipBook as the page turns edge-on */}
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
