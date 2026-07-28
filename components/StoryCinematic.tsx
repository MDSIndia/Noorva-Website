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

// Fine fractal-noise grain, tiled as a background-image over the parchment
// gradient below — the flat gradient alone reads as smooth plastic, not
// aged paper. Generated inline (not an image asset) so it stays a single
// self-contained repo change with nothing new to fetch/commit as a binary.
const PARCHMENT_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Ink/gilt tones for the parchment chapter pages — a warmer, darker gold
// than --accent-warm (#e8b478), which is tuned for bright text on a near-
// black background and reads as washed-out pastel on cream paper.
const PAGE_INK = "#3f2a14";
const PAGE_GILT = "rgba(120,78,28,0.55)";

// How long the water-drop reveal takes to fully spread across the frame —
// matches StoryGallerySection's own SLIDE_DURATION so its isAnimatingRef gate
// (which blocks the next wheel/swipe transition) releases right as this
// settles, not before or after.
const RIPPLE_DURATION = 1.05;

/** One corner accent on the chapter page's gilt frame — echoes the closed
 *  book's own gold corner-diamond flourish (BookModel.tsx's baked cover
 *  texture) so the pages read as part of the same physical object as the
 *  cover, not a disconnected UI skin. */
function CornerMark({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-3 w-3 rotate-45 border ${className}`}
      style={{ borderColor: PAGE_GILT, boxShadow: "0 0 14px 2px rgba(232,180,120,0.6)" }}
    />
  );
}

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
      <p className="mt-8 text-xs font-light tracking-[0.4em] text-white/30 uppercase">
        {String(storyChapters.length).padStart(2, "0")} Chapters
      </p>
      <p className="mt-14 text-[10px] font-light tracking-[0.4em] text-white/40 uppercase" style={{ animation: "pulse 2.4s ease-in-out infinite" }}>
        Scroll to begin
      </p>
    </div>
  );
}

function ChapterSlide({ chapter, reducedMotion }: { chapter: StoryChapterData; reducedMotion: boolean }) {
  const total = storyChapters.length;
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: "radial-gradient(120% 90% at 50% 8%, #f7ead0 0%, #edd7a8 38%, #cca873 74%, #93724a 100%)" }}
    >
      {/* Grain + a heavy inward vignette stand in for a scanned/aged paper
          surface — flat gradient alone reads as smooth plastic, not paper
          with worn, darkened edges. */}
      <div className="pointer-events-none absolute inset-0 mix-blend-multiply" style={{ backgroundImage: PARCHMENT_GRAIN, opacity: 0.5 }} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 12px rgba(50,30,10,0.45), inset 0 0 140px rgba(40,22,8,0.55), inset 0 0 280px rgba(30,16,6,0.4)" }}
      />

      {/* Ornate gilt double-frame + corner diamonds — the same gold-line
          motif used on the closed book's own leather cover (BookModel.tsx),
          carried onto the interior pages so the two read as one object. The
          glow (box-shadow, not just a bright border color) is what the
          book cover's own frame relies on too — a plain saturated line
          reads as flat ink on paper, the blurred halo is what makes it
          look lit from within rather than drawn. */}
      <div
        className="pointer-events-none absolute inset-6 rounded-lg border-2 sm:inset-10"
        style={{ borderColor: PAGE_GILT, boxShadow: "0 0 22px rgba(232,180,120,0.55), inset 0 0 22px rgba(232,180,120,0.3)" }}
      />
      <div
        className="pointer-events-none absolute inset-8 rounded-md border sm:inset-[52px]"
        style={{ borderColor: "rgba(120,78,28,0.35)", boxShadow: "0 0 14px rgba(232,180,120,0.4), inset 0 0 14px rgba(232,180,120,0.2)" }}
      />
      <CornerMark className="top-8 left-8 sm:top-12 sm:left-12" />
      <CornerMark className="top-8 right-8 sm:top-12 sm:right-12" />
      <CornerMark className="bottom-8 left-8 sm:bottom-12 sm:left-12" />
      <CornerMark className="bottom-8 right-8 sm:bottom-12 sm:right-12" />

      {/* Text cuts cleanly between chapters (mode="wait") rather than
          crossfading — the framed photo below is what overlaps/dissolves
          via the outer slide's own crossfade; letting two chapters' dense
          text overlap the same fixed position simultaneously read as
          confusing ghosting during an earlier pass at this (see the fix in
          StoryGallerySection.tsx's page-turn history), so text and image
          intentionally use different transition styles here. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={chapter.index}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative flex h-full flex-col items-center justify-center gap-6 px-10 py-16 text-center sm:gap-8 sm:px-16 md:px-24"
        >
          <div>
            <p className="font-hand text-3xl tracking-wide sm:text-4xl" style={{ color: PAGE_INK }}>
              Chapter {chapter.index}
            </p>
            <div
              className="mx-auto mt-2 h-px w-24"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(120,78,28,0.75), transparent)",
                boxShadow: "0 0 12px 1px rgba(232,180,120,0.65)",
              }}
            />
          </div>

          <div
            className="relative w-full max-w-md overflow-hidden rounded-sm sm:max-w-lg"
            style={{
              aspectRatio: "4 / 3",
              border: "3px solid #2e1c0c",
              boxShadow: "0 16px 36px rgba(30,16,6,0.45), inset 0 0 0 1px rgba(232,180,120,0.4)",
            }}
          >
            <KenBurnsImage chapter={chapter} reducedMotion={reducedMotion} />
          </div>

          <div className="max-w-xl">
            <p className="font-hand text-2xl leading-snug sm:text-3xl" style={{ color: PAGE_INK }}>
              {chapter.headline}
            </p>
            <p className="font-hand mt-3 text-xl sm:text-2xl" style={{ color: "rgba(63,42,20,0.75)" }}>
              {chapter.body}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-10 bottom-5 flex items-center justify-between sm:inset-x-16">
        <span className="text-[10px] font-light tracking-[0.3em] uppercase" style={{ color: "rgba(63,42,20,0.55)" }}>
          The Noorva Story
        </span>
        <span className="text-[10px] font-light tracking-[0.3em]" style={{ color: "rgba(63,42,20,0.55)" }}>
          {String(chapter.index).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

/** Wraps one slide in a paper-flip-like reveal: the new page slides in from
 *  the left (like being drawn across from the spine) while a directional
 *  clip-path sweeps its reveal boundary left-to-right, and an SVG turbulence
 *  + displacement filter warps the whole slide like a wave passing over
 *  water — so the straight wipe edge reads as a rippling water-front instead
 *  of a hard line, settling flat exactly as the sweep finishes. A fresh
 *  instance mounts per `key` (AnimatePresence's `currentIndex` key on the
 *  call site), so each page-flip gets its own filter id/seed with no risk of
 *  two overlapping transitions fighting over the same filter node. */
function RippleSlide({ children, reducedMotion }: { children: React.ReactNode; reducedMotion: boolean }) {
  const elRef = useRef<HTMLDivElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  // Random per mount, not derived from currentIndex — a stable id would be
  // reused if the user ever lands back on an index whose previous filter
  // node hasn't finished being torn down, and a random seed keeps
  // consecutive ripples from looking like the exact same wave every time.
  const [filterId] = useState(() => `page-ripple-${Math.random().toString(36).slice(2, 9)}`);
  const [seed] = useState(() => Math.floor(Math.random() * 1000));

  useEffect(() => {
    if (reducedMotion) return; // a continuous rippling warp is exactly the motion this preference opts out of — plain crossfade only.
    const el = elRef.current;
    const disp = dispRef.current;
    if (!el || !disp) return;

    el.style.filter = `url(#${filterId})`;
    // inset(top right bottom left) — right starts at 100% (nothing visible)
    // and shrinks to 0%, so the visible strip grows from the left edge
    // rightward: the reveal boundary sweeps left -> right across the frame,
    // like a page being turned in from the spine. xPercent gives the page
    // itself a physical shift into place alongside that sweep, rather than
    // just an alpha wipe sitting still.
    gsap.set(el, { clipPath: "inset(0% 100% 0% 0%)", xPercent: -6 });
    gsap.set(disp, { attr: { scale: 70 } });

    // Clip sweep, physical shift, and displacement scale all run in lockstep
    // on the same timeline so the warp is always strongest right at the
    // sweep's own leading edge and fully calm behind it — clearing the
    // inline filter entirely once settled (rather than leaving it applied
    // at scale 0) so the browser isn't asked to maintain an SVG filter's
    // backing store for the whole time the chapter is just sitting there
    // being read.
    const tl = gsap.timeline({ onComplete: () => { el.style.filter = ""; } });
    tl.to(el, { clipPath: "inset(0% 0% 0% 0%)", xPercent: 0, duration: RIPPLE_DURATION, ease: "power2.out" }, 0);
    tl.to(disp, { attr: { scale: 0 }, duration: RIPPLE_DURATION, ease: "power3.out" }, 0);

    return () => {
      tl.kill();
    };
    // Mount-only — this component is freshly instantiated per AnimatePresence
    // key (see call site), so there's no prop change to react to here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      ref={elRef}
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      // The outgoing slide shifts right and fades as the incoming one shifts
      // in from the left over it — a reciprocal motion so the page reads as
      // physically displaced rather than just crossfaded.
      exit={{ opacity: 0, x: "4%" }}
      transition={{ duration: RIPPLE_DURATION, ease: "easeInOut" }}
    >
      {!reducedMotion && (
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <defs>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves={2} seed={seed} result="noise" />
              <feDisplacementMap ref={dispRef} in="SourceGraphic" in2="noise" scale={0} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
      )}
      {children}
    </motion.div>
  );
}

/** The fullscreen cinematic sequence shown after the book "opens" — a
 *  title/cover slide followed by one full-bleed Ken Burns image per
 *  chapter, replacing the earlier WebGL page-curl reader entirely.
 *  `currentIndex` is owned by StoryGallerySection.tsx, which already has
 *  the wheel/touch/keyboard gesture handling this reuses verbatim; this
 *  component only renders whichever slide is current, revealing each one
 *  with a water-drop ripple (see RippleSlide) instead of a plain crossfade. */
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
        <RippleSlide key={currentIndex} reducedMotion={reducedMotion}>
          {chapter ? <ChapterSlide chapter={chapter} reducedMotion={reducedMotion} /> : <CoverSlide />}
        </RippleSlide>
      </AnimatePresence>
    </div>
  );
}
