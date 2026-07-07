"use client";

import { forwardRef, type Ref } from "react";
import Image from "next/image";
import { storyChapters } from "./storyData";

interface BookCoverProps {
  /** Attached to a full-bleed overlay used to darken the cover as it turns edge-on mid-flip. */
  shadeRef?: Ref<HTMLDivElement>;
}

const TOTAL = storyChapters.length;

// The book's front cover — a real, physical hardcover: dark leather, a
// gold-foil double frame with embossed corner flourishes, and a fanned
// page-edge stack along the fore-edge and tail so it reads as a thick,
// worn tome rather than a flat graphic. Opens (via the same flip mechanic
// as every other page) into Chapter One.
const BookCover = forwardRef<HTMLDivElement, BookCoverProps>(function BookCover({ shadeRef }, ref) {
  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden rounded-[14px]"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        boxShadow:
          "0 60px 130px -25px rgba(0,0,0,0.9), 0 20px 45px -12px rgba(0,0,0,0.8), 0 2px 0 1px rgba(232,180,120,0.06)",
      }}
    >
      {/* Leather ground */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(150% 120% at 50% -10%, #2c1c14 0%, #1a1108 42%, #090604 100%)",
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
        style={{ boxShadow: "inset 0 0 160px rgba(0,0,0,0.7), inset 0 0 50px rgba(0,0,0,0.55)" }}
      />

      {/* Foil sheen — a slow diagonal light catch across the gilt, like light
          moving across real gold leaf as the page settles. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="animate-book-sheen absolute -inset-y-1/2 left-0 w-1/3 opacity-[0.1] mix-blend-screen"
          style={{
            background:
              "linear-gradient(100deg, transparent 0%, rgba(232,180,120,0.75) 50%, transparent 100%)",
            filter: "blur(8px)",
          }}
        />
      </div>

      {/* Spine — the hinge this cover opens from */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-9 bg-gradient-to-r from-black/75 via-black/25 to-transparent md:w-14">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="absolute inset-x-0 h-px bg-[color:var(--accent-warm)]/15"
            style={{ top: `${(i + 1) * 12.5}%` }}
          />
        ))}
      </div>

      {/* Fore-edge page stack — dozens of hairline sheets implying a thick tome */}
      <div
        className="pointer-events-none absolute inset-y-3 right-0 w-[11px] overflow-hidden rounded-r-[13px] md:inset-y-4 md:w-[16px]"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(226,199,155,0.95) 30%, rgba(196,165,122,0.95) 65%, rgba(0,0,0,0.4) 100%)",
        }}
      >
        {Array.from({ length: 48 }, (_, i) => (
          <div key={i} className="absolute inset-x-0 h-px bg-black/20" style={{ top: `${i * (100 / 48)}%` }} />
        ))}
      </div>
      {/* Tail-edge sliver — same page stack peeking along the bottom */}
      <div
        className="pointer-events-none absolute inset-x-4 bottom-0 h-[8px] overflow-hidden rounded-b-[10px] md:inset-x-6 md:h-[11px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(226,199,155,0.9) 35%, rgba(196,165,122,0.9) 70%, rgba(0,0,0,0.35) 100%)",
        }}
      >
        {Array.from({ length: 28 }, (_, i) => (
          <div key={i} className="absolute inset-y-0 w-px bg-black/20" style={{ left: `${i * (100 / 28)}%` }} />
        ))}
      </div>

      {/* Gilt double frame — embossed gold foil, the way a real hardcover is stamped */}
      <div className="pointer-events-none absolute inset-4 rounded-[8px] border-[1.5px] border-[color:var(--accent-warm)]/55 md:inset-7" />
      <div className="pointer-events-none absolute inset-[22px] rounded-[4px] border border-[color:var(--accent-warm)]/25 md:inset-10" />

      {/* Corner flourishes — simple gilt diamonds, like foil-stamped corner ornaments */}
      {[
        "top-4 left-4 md:top-7 md:left-7",
        "top-4 right-6 md:top-7 md:right-9",
        "bottom-4 left-4 md:bottom-7 md:left-7",
        "bottom-4 right-6 md:bottom-7 md:right-9",
      ].map((pos) => (
        <div
          key={pos}
          className={`pointer-events-none absolute h-3 w-3 rotate-45 border border-[color:var(--accent-warm)]/50 md:h-3.5 md:w-3.5 ${pos}`}
        />
      ))}

      {/* Content */}
      <div className="relative flex h-full flex-col items-center justify-center px-8 pr-6 pl-16 text-center md:pr-8 md:pl-20">
        {/* Emblem — the mark set in an embossed gold medallion, like a wax
            seal or foil-stamped crest on the cover. */}
        <div className="relative flex h-20 w-20 items-center justify-center md:h-24 md:w-24">
          <div
            className="absolute inset-0 rounded-full border border-[color:var(--accent-warm)]/50"
            style={{ boxShadow: "0 0 26px rgba(232,180,120,0.25)" }}
          />
          <div className="absolute inset-[6px] rounded-full border border-[color:var(--accent-warm)]/25" />
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#0c0805] md:h-16 md:w-16"
            style={{ boxShadow: "inset 0 0 0 1px rgba(232,180,120,0.45), 0 0 22px rgba(0,0,0,0.6)" }}
          >
            <Image src="/NoorvaLogo.png" alt="Noorva" width={30} height={30} className="opacity-95" />
          </div>
        </div>

        <p className="mt-8 text-[10px] font-light tracking-[0.55em] text-[color:var(--accent-warm)]/70 uppercase md:text-xs">
          The Noorva Story
        </p>

        <h1
          className="font-playfair mt-4 text-5xl leading-none font-light md:text-7xl lg:text-8xl"
          style={{
            backgroundImage: "linear-gradient(180deg, #fff7e6 0%, #f6e3ba 30%, #e8b478 65%, #a97a3f 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter:
              "drop-shadow(0 1px 0 rgba(255,255,255,0.2)) drop-shadow(0 3px 10px rgba(0,0,0,0.7))",
          }}
        >
          Noorva
        </h1>

        <div
          className="mt-6 h-px w-16 md:w-24"
          style={{ background: "linear-gradient(90deg, transparent, rgba(232,180,120,0.75), transparent)" }}
        />

        <p className="mt-6 max-w-xs text-xs leading-relaxed font-light text-white/50 italic md:max-w-sm md:text-sm">
          A story of how humanity has always reached for connection — and the next step it takes.
        </p>

        <p className="mt-10 text-[9px] font-light tracking-[0.35em] text-white/30 uppercase md:text-[10px]">
          {String(TOTAL).padStart(2, "0")} Chapters
        </p>

        <div className="absolute bottom-8 flex flex-col items-center gap-2 opacity-70 md:bottom-10">
          <span className="text-[9px] font-light tracking-[0.4em] text-white/45 uppercase">Click to open</span>
          <div className="h-2 w-2 rounded-full border border-[color:var(--accent-warm)]/60 animate-ping" />
        </div>
      </div>

      {/* Flip-lighting shade, opacity driven by StoryGallerySection as the cover turns edge-on */}
      <div
        ref={shadeRef}
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(105deg, rgba(255,255,255,0.16) 0%, rgba(0,0,0,0.85) 55%)",
          opacity: 0,
        }}
      />
    </div>
  );
});

export default BookCover;
