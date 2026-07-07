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

      <div className="relative flex h-full min-h-0 flex-col p-3 md:flex-row md:p-4">
        {/* Illustration plate — left half on desktop, top of the stack on mobile */}
        <div className="relative h-[54%] shrink-0 overflow-hidden rounded-[4px] border border-white/10 md:h-full md:w-[54%]">
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed set of public/story assets, plain img avoids next/image fill-inside-flex sizing friction */}
          <img
            src={chapter.imageSrc}
            alt={chapter.headline}
            className="h-full w-full object-cover"
            style={{ filter: `saturate(${0.25 + chapter.grade * 0.75}) sepia(${(1 - chapter.grade) * 0.55})` }}
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/50" />
          {/* Fades toward the text so an overlapping mobile caption stays legible against the photo. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-black/25" />
        </div>

        {/* Text column — overlaps the bottom of the image on mobile, sits beside it on desktop */}
        <div className="relative z-10 -mt-14 flex min-h-0 flex-1 flex-col rounded-t-[8px] bg-gradient-to-b from-[#0d0a06] to-[#0d0a06]/98 px-5 pt-5 pb-4 md:mt-0 md:rounded-none md:bg-none md:pt-24 md:pr-8 md:pb-2 md:pl-7 lg:pt-28 lg:pl-9">
          <p className="text-[10px] font-light tracking-[0.4em] text-[color:var(--accent-warm)]/80 uppercase md:text-xs">
            {chapter.eyebrow}
          </p>

          <h2 className="font-playfair mt-3 text-xl leading-[1.2] font-light text-white/92 md:mt-5 md:text-3xl lg:text-4xl">
            {chapter.headline}
          </h2>
          <p className="first-letter:font-playfair mt-3 text-xs leading-relaxed font-light text-white/55 first-letter:float-left first-letter:mr-1 first-letter:text-4xl first-letter:leading-[0.75] first-letter:text-[color:var(--accent-warm)] md:mt-4 md:text-sm lg:text-base">
            {chapter.body}
          </p>

          <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-[9px] font-light tracking-[0.3em] text-white/30 uppercase">The Noorva Story</span>
            <span className="text-[9px] font-light tracking-[0.3em] text-white/30">
              {String(chapter.index).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Flip-lighting shade, opacity driven by useFlipBook as the page turns edge-on */}
      <div ref={shadeRef} className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: 0 }} />
    </div>
  );
});

export default BookPage;
