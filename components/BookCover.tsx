"use client";

import { forwardRef, type Ref } from "react";
import Image from "next/image";
import { storyChapters } from "./storyData";

interface BookCoverProps {
  /** Attached to a full-bleed overlay used to darken the cover as it turns edge-on mid-flip. */
  shadeRef?: Ref<HTMLDivElement>;
}

const TOTAL = storyChapters.length;

// The book's front cover — an old, leather-bound, gold-foil-embossed plate
// that opens (via the same flip mechanic as every other page) into Chapter
// One. Deliberately heavier and more ornate than the paper pages inside: a
// darker leather ground, a triple-line gilt frame with corner flourishes,
// and an embossed title treatment (gradient-filled text + layered shadows)
// instead of flat color.
const BookCover = forwardRef<HTMLDivElement, BookCoverProps>(function BookCover({ shadeRef }, ref) {
  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden rounded-[10px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.85)]"
      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
    >
      {/* Leather ground */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(140% 110% at 50% -10%, #2c1c14 0%, #1c1109 45%, #0c0805 100%)",
        }}
      />
      {/* Diagonal leather-grain hatch */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(255,255,255,0.5) 0px, transparent 1px, transparent 3px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* Aged vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 140px rgba(0,0,0,0.65), inset 0 0 40px rgba(0,0,0,0.5)" }}
      />

      {/* Spine — the hinge this cover opens from */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/70 via-black/25 to-transparent md:w-12">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="absolute inset-x-0 h-px bg-[color:var(--accent-warm)]/15"
            style={{ top: `${(i + 1) * 12.5}%` }}
          />
        ))}
      </div>

      {/* Gilt double frame */}
      <div className="pointer-events-none absolute inset-4 rounded-[6px] border-[1.5px] border-[color:var(--accent-warm)]/50 md:inset-6" />
      <div className="pointer-events-none absolute inset-[22px] rounded-[3px] border border-[color:var(--accent-warm)]/25 md:inset-9" />

      {/* Corner flourishes */}
      {[
        "top-4 left-4 md:top-6 md:left-6",
        "top-4 right-4 md:top-6 md:right-6",
        "bottom-4 left-4 md:bottom-6 md:left-6",
        "bottom-4 right-4 md:bottom-6 md:right-6",
      ].map((pos) => (
        <div
          key={pos}
          className={`pointer-events-none absolute h-2.5 w-2.5 rotate-45 border border-[color:var(--accent-warm)]/50 md:h-3 md:w-3 ${pos}`}
        />
      ))}

      {/* Content */}
      <div className="relative flex h-full flex-col items-center justify-center px-10 pl-14 text-center md:pl-16">
        <div
          className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--accent-warm)]/40 md:h-20 md:w-20"
          style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.4), 0 0 30px rgba(232,180,120,0.15)" }}
        >
          <Image src="/NoorvaLogo.png" alt="Noorva" width={34} height={34} className="opacity-90 md:h-10 md:w-10" />
        </div>

        <p className="mt-8 text-[10px] font-light tracking-[0.55em] text-[color:var(--accent-warm)]/70 uppercase md:text-xs">
          The Noorva Story
        </p>

        <h1
          className="font-playfair mt-4 text-5xl leading-none font-light md:text-7xl lg:text-8xl"
          style={{
            backgroundImage: "linear-gradient(180deg, #f6e3ba 0%, #e8b478 45%, #a97a3f 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter:
              "drop-shadow(0 1px 0 rgba(255,255,255,0.18)) drop-shadow(0 3px 6px rgba(0,0,0,0.65))",
          }}
        >
          Noorva
        </h1>

        <div className="mt-6 h-px w-16 bg-[color:var(--accent-warm)]/40 md:w-24" />

        <p className="mt-6 max-w-xs text-xs leading-relaxed font-light text-white/50 italic md:max-w-sm md:text-sm">
          A story of how humanity has always reached for connection — and the next step it takes.
        </p>

        <p className="mt-10 text-[9px] font-light tracking-[0.35em] text-white/30 uppercase md:text-[10px]">
          {String(TOTAL).padStart(2, "0")} Chapters
        </p>

        <div className="absolute bottom-8 flex flex-col items-center gap-2 opacity-60 md:bottom-10">
          <span className="text-[9px] font-light tracking-[0.4em] text-white/40 uppercase">Scroll to open</span>
          <div className="h-6 w-px bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </div>

      {/* Flip-lighting shade, opacity driven by StoryGallerySection as the cover turns edge-on */}
      <div ref={shadeRef} className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: 0 }} />
    </div>
  );
});

export default BookCover;
