"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import BookPage from "./BookPage";
import BookCover from "./BookCover";
import { galleryCaptureControl, acquireScrollLock, releaseScrollLock } from "./store";
import { storyChapters } from "./storyData";

// Page 0 is the cover; pages 1..N are the chapters.
const TOTAL_PAGES = storyChapters.length + 1;

const FLIP_DURATION = 1.1; // seconds, one full page-turn
const ZOOM_DURATION = 0.9; // seconds, preview -> fullscreen
const WHEEL_THRESHOLD = 2; // ignore near-zero wheel noise
const SWIPE_THRESHOLD = 30; // px, minimum touch swipe to count as a gesture
// Trackpad/inertial wheel scrolling keeps emitting decaying delta events for
// a while after the user's physical gesture ends. Without this, a single
// flick that outlasts FLIP_DURATION triggers a second, unintended chapter
// transition the instant the first one finishes — the page visibly turns
// twice for one scroll. A gesture only "ends" once wheel events stop for
// this long, so trailing momentum can't chain into another transition.
const GESTURE_IDLE_MS = 180;

// Thickness of the idly-spinning preview book, in px — a plain rotateY spin
// on a flat cover would show nothing for half the turn (its back face is
// never drawn), so the preview is a real 4-sided box: front cover, back
// cover, spine, and fore-edge, each rotated/pushed out to its own face.
const BOOK_DEPTH = 56;

// BookCover's own type sizes (text-5xl md:text-7xl lg:text-8xl, etc.) are
// tuned for filling the whole viewport as a fullscreen page — dropped
// straight into the ~200px-wide preview box they'd overflow it completely.
// Rendering it at this fixed "design" size and scaling the whole thing down
// keeps every proportion (text, frame, shadow) identical to the fullscreen
// cover, just shrunk, rather than needing a second hand-tuned mini layout.
const COVER_DESIGN_W = 600;
const COVER_DESIGN_H = 889;

// Raised binding-cord positions down the spine, as a % of its height.
const SPINE_BAND_POSITIONS = [14, 32, 50, 68, 86];

function RotatingBookPreview() {
  const half = BOOK_DEPTH / 2;
  return (
    <div className="animate-book-3d-spin absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
      {/* Front cover */}
      <div className="absolute inset-0" style={{ transform: `translateZ(${half}px)`, backfaceVisibility: "hidden" }}>
        <div
          className="absolute top-0 left-0 origin-top-left [--cover-scale:0.31667] md:[--cover-scale:0.45]"
          style={{ width: COVER_DESIGN_W, height: COVER_DESIGN_H, transform: "scale(var(--cover-scale))" }}
        >
          <BookCover />
        </div>
      </div>

      {/* Back cover — same leather ground and gilt frame, no title */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[14px]"
        style={{
          transform: `rotateY(180deg) translateZ(${half}px)`,
          backfaceVisibility: "hidden",
          background: "radial-gradient(150% 120% at 50% -10%, #2c1c14 0%, #1a1108 42%, #090604 100%)",
          boxShadow: "0 60px 130px -25px rgba(0,0,0,0.9), 0 20px 45px -12px rgba(0,0,0,0.8)",
        }}
      >
        <div className="pointer-events-none absolute inset-4 rounded-[8px] border-[1.5px] border-[color:var(--accent-warm)]/40 md:inset-7" />
        <div className="pointer-events-none absolute inset-[22px] rounded-[4px] border border-[color:var(--accent-warm)]/20 md:inset-10" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="h-14 w-14 rounded-full border border-[color:var(--accent-warm)]/35 md:h-20 md:w-20"
            style={{ boxShadow: "inset 0 0 0 1px rgba(232,180,120,0.25)" }}
          />
        </div>
      </div>

      {/* Spine — left edge, the hinge this cover opens from. Raised bands
          across it (the cords a real hardcover is sewn over, showing
          through the leather) each shaded light-to-dark top-to-bottom so
          they read as actual 3D ridges, not a flat printed stripe. */}
      <div
        className="absolute top-0 h-full overflow-hidden"
        style={{
          width: BOOK_DEPTH,
          left: `calc(50% - ${half}px)`,
          transform: `rotateY(-90deg) translateZ(calc(var(--book-w) / 2))`,
          backfaceVisibility: "hidden",
          background: "linear-gradient(180deg, #241609 0%, #150d06 100%)",
        }}
      >
        {SPINE_BAND_POSITIONS.map((top) => (
          <div
            key={top}
            className="absolute inset-x-[3px] rounded-[2px]"
            style={{
              top: `${top}%`,
              height: 9,
              background:
                "linear-gradient(180deg, rgba(255,224,168,0.35) 0%, rgba(232,180,120,0.15) 30%, rgba(0,0,0,0.35) 75%, rgba(0,0,0,0.55) 100%)",
              boxShadow:
                "0 1px 0 rgba(255,238,210,0.4) inset, 0 -2px 3px rgba(0,0,0,0.6) inset, 0 2px 4px rgba(0,0,0,0.5)",
            }}
          />
        ))}
      </div>

      {/* Fore-edge — right edge, implying a stack of thick pages */}
      <div
        className="absolute top-0 h-full overflow-hidden"
        style={{
          width: BOOK_DEPTH,
          left: `calc(50% - ${half}px)`,
          transform: `rotateY(90deg) translateZ(calc(var(--book-w) / 2))`,
          backfaceVisibility: "hidden",
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.35) 0%, rgba(226,199,155,0.95) 30%, rgba(196,165,122,0.95) 70%, rgba(0,0,0,0.3) 100%)",
        }}
      />
    </div>
  );
}

export default function StoryGallerySection() {
  // The clickable, idly-rotating book sitting in normal page flow before
  // it's opened — its measured rect is the FLIP-animation's start point.
  const previewWrapRef = useRef<HTMLDivElement>(null);
  // The fixed fullscreen layer that appears once opened.
  const overlayRef = useRef<HTMLDivElement>(null);

  // Two stacked page slots. `underRef` always rests flat (rotateY 0) and
  // just has its content silently swapped while hidden behind `overRef`.
  // `overRef` is the one that actually turns — 0deg -> ±180deg around
  // whichever edge matches the nav direction — and vanishes past 90deg via
  // backface-visibility, revealing `under` (already showing the target
  // chapter) sitting flat underneath. `over` is then silently snapped back
  // to 0deg/target content, restoring the resting invariant for next time.
  // It's also the visible top layer at rest, which is why the preview->
  // fullscreen zoom below animates `over`, not `under`.
  const underRef = useRef<HTMLDivElement>(null);
  const overRef = useRef<HTMLDivElement>(null);
  const overShadeRef = useRef<HTMLDivElement>(null);
  const [underPageIdx, setUnderPageIdx] = useState(0);
  const [overPageIdx, setOverPageIdx] = useState(0);
  const [entered, setEntered] = useState(false);
  const enteredRef = useRef(false);

  const currentIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const isTransitioningRef = useRef(false); // guards the open/close zoom itself
  const touchStartYRef = useRef<number | null>(null);
  const gestureConsumedRef = useRef(false);
  const gestureIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    enteredRef.current = entered;
  }, [entered]);

  useEffect(() => {
    function goTo(targetIndex: number) {
      if (isAnimatingRef.current) return;
      const from = currentIndexRef.current;
      if (targetIndex === from) return;

      const forward = targetIndex > from;
      const origin = forward ? "left center" : "right center";
      // The flipping leaf's back face is never drawn (backfaceVisibility:
      // hidden), so nothing it does past 90deg is visible — rotating it all
      // the way to 180 just burns half the tween doing nothing, which is
      // why the old version looked like it "popped" to the next page at the
      // halfway mark. Stopping just past edge-on (92deg) means the full
      // duration is spent on motion that actually reads on screen.
      const endRotation = forward ? -92 : 92;

      isAnimatingRef.current = true;

      // flushSync forces the content swap to actually commit to the DOM
      // before we touch refs below — crossing the cover/chapter-one boundary
      // swaps `under`'s component type (BookCover <-> BookPage), which
      // remounts its DOM node. Reading `underRef.current` before the flush
      // would grab the node that's about to be discarded, so the opacity
      // reset below would silently no-op on a detached element.
      flushSync(() => setUnderPageIdx(targetIndex));
      const over = overRef.current;
      const under = underRef.current;
      const shade = overShadeRef.current;
      if (!over || !under || !shade) {
        isAnimatingRef.current = false;
        return;
      }
      gsap.set(under, { opacity: 0 }); // faded in below, not just instantly exposed

      gsap.set(over, { transformOrigin: origin, rotateY: 0, y: 0, scaleX: 1 });

      gsap.to(over, {
        rotateY: endRotation,
        duration: FLIP_DURATION,
        // inOut eases gently into the turn and, just as importantly, gently
        // out of it — power2.in accelerated the whole way and then stopped
        // dead at full speed, which read as an abrupt snap rather than a
        // smooth turn settling into place.
        ease: "power2.inOut",
        onUpdate: function () {
          const progress = this.progress();
          // A real page doesn't rotate perfectly rigid — it lifts off the
          // stack and narrows as it swings edge-on, peaking right at the
          // end of the turn (rather than at the midpoint of a 180 spin).
          const arc = Math.sin(progress * (Math.PI / 2));
          gsap.set(over, { y: -arc * 16, scaleX: 1 - arc * 0.08 });
          gsap.set(shade, { opacity: arc * 0.65 });
          // Crossfade the destination page in over the closing stretch of
          // the turn, timed to finish exactly as the flipping leaf goes
          // edge-on — a smooth reveal instead of an instant pop.
          gsap.set(under, { opacity: Math.max(0, (progress - 0.6) / 0.4) });
        },
        onComplete: () => {
          currentIndexRef.current = targetIndex;
          // Same flushSync reasoning as above, in reverse: `over` is
          // currently edge-on and invisible (backfaceVisibility: hidden).
          // Resetting its rotateY makes it visible again immediately, so
          // the content swap must already be painted in before that happens
          // — otherwise the *old* page flashes back into view for a frame
          // right as the flip finishes.
          flushSync(() => setOverPageIdx(targetIndex));
          const freshOver = overRef.current;
          const freshShade = overShadeRef.current;
          if (freshOver) gsap.set(freshOver, { rotateY: 0, y: 0, scaleX: 1 });
          if (freshShade) gsap.set(freshShade, { opacity: 0 });
          gsap.set(under, { opacity: 1 });
          isAnimatingRef.current = false;
        },
      });
    }

    // Closes the book, with a quick fade/scale-down of the fullscreen layer
    // — used whenever the reader scrolls/swipes past either end. `immediate`
    // skips the animation entirely, for nav links that need to escape now.
    function closeBook(immediate = false) {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      function finish() {
        currentIndexRef.current = 0;
        flushSync(() => {
          setUnderPageIdx(0);
          setOverPageIdx(0);
          setEntered(false);
        });
        releaseScrollLock("story-gallery");
        isTransitioningRef.current = false;
      }

      const overlay = overlayRef.current;
      if (immediate || !overlay) {
        finish();
        return;
      }
      gsap.to(overlay, { opacity: 0, scale: 0.94, duration: 0.45, ease: "power2.in", onComplete: finish });
    }

    function handleDirection(delta: number) {
      if (!enteredRef.current || isAnimatingRef.current || isTransitioningRef.current) return;
      if (delta > 0) {
        // The cover only opens on a deliberate click, never on scroll —
        // scrolling past it inconsistently was the source of the "book
        // sometimes doesn't open" flakiness.
        if (currentIndexRef.current === 0) return;
        if (currentIndexRef.current < TOTAL_PAGES - 1) {
          goTo(currentIndexRef.current + 1);
        } else {
          closeBook();
        }
      } else {
        // Scrolling back up from chapter one closes the book rather than
        // re-closing the cover — reopening it is a click gesture, not scroll.
        if (currentIndexRef.current > 1) {
          goTo(currentIndexRef.current - 1);
        } else {
          closeBook();
        }
      }
    }

    function onCoverClick() {
      if (enteredRef.current && !isAnimatingRef.current && currentIndexRef.current === 0) {
        goTo(1);
      }
    }

    function onWheel(e: WheelEvent) {
      if (!enteredRef.current) return;
      e.preventDefault();
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;

      // Any wheel activity extends the current gesture's idle window, so the
      // gesture is only considered "over" once events stop for a beat.
      if (gestureIdleTimerRef.current) clearTimeout(gestureIdleTimerRef.current);
      gestureIdleTimerRef.current = setTimeout(() => {
        gestureConsumedRef.current = false;
      }, GESTURE_IDLE_MS);

      if (gestureConsumedRef.current || isAnimatingRef.current) return;
      gestureConsumedRef.current = true;
      handleDirection(e.deltaY);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!enteredRef.current) return;
      if (e.key === "Escape") {
        closeBook();
      }
    }

    function onTouchStart(e: TouchEvent) {
      if (!enteredRef.current) return;
      touchStartYRef.current = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (!enteredRef.current || touchStartYRef.current === null) return;
      e.preventDefault();
    }

    function onTouchEnd(e: TouchEvent) {
      if (!enteredRef.current || touchStartYRef.current === null) return;
      const endY = e.changedTouches[0].clientY;
      const delta = touchStartYRef.current - endY; // positive = swiped up = "next"
      touchStartYRef.current = null;
      if (Math.abs(delta) < SWIPE_THRESHOLD) return;
      handleDirection(delta);
    }

    // Lets nav links (Home/Story/Join/CTAs) escape the book instantly even
    // if it's open mid-read.
    galleryCaptureControl.release = () => {
      if (enteredRef.current) closeBook(true);
    };

    const overlayEl = overlayRef.current;
    overlayEl?.addEventListener("click", onCoverClick);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      if (gestureIdleTimerRef.current) clearTimeout(gestureIdleTimerRef.current);
      overlayEl?.removeEventListener("click", onCoverClick);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      galleryCaptureControl.release = null;
    };
    // Re-runs when `entered` flips so the click-to-open-cover listener can
    // (re)bind to the overlay element, which only exists in the DOM once
    // `entered` is true — everything else here reads enteredRef.current
    // fresh per-call, so it doesn't otherwise need this to re-run.
  }, [entered]);

  // Unmount-only safety net: releases the lock if the component disappears
  // while the book happens to be open, independent of the effect above
  // (which re-runs on every `entered` toggle and isn't a reliable place to
  // detect a true unmount).
  useEffect(() => {
    return () => {
      if (enteredRef.current) releaseScrollLock("story-gallery");
    };
  }, []);

  // Click on the idly-rotating preview book: measures where it currently
  // sits, mounts the fullscreen overlay, then GSAP-tweens the (now
  // full-viewport-sized) cover from that measured rect back down to its
  // natural size/position — reading as the small book zooming up to fill
  // the screen, rather than an abrupt cut.
  function handleEnter() {
    if (enteredRef.current || isTransitioningRef.current) return;
    const previewEl = previewWrapRef.current;
    if (!previewEl) return;

    const startRect = previewEl.getBoundingClientRect();
    isTransitioningRef.current = true;
    acquireScrollLock("story-gallery");
    flushSync(() => setEntered(true));

    const overlay = overlayRef.current;
    const target = overRef.current;
    const under = underRef.current;
    if (!overlay || !target || !under) {
      isTransitioningRef.current = false;
      return;
    }

    const targetRect = target.getBoundingClientRect();
    const scaleX = startRect.width / targetRect.width;
    const scaleY = startRect.height / targetRect.height;
    const originX = startRect.left + startRect.width / 2 - (targetRect.left + targetRect.width / 2);
    const originY = startRect.top + startRect.height / 2 - (targetRect.top + targetRect.height / 2);

    gsap.set(overlay, { opacity: 1 });
    // `under` sits fullscreen and at rest (opacity 1) the instant it mounts —
    // hidden here for the duration of the zoom so it doesn't show the cover
    // at full size behind the still-small `over` layer as it grows into it.
    gsap.set(under, { opacity: 0 });
    gsap.fromTo(
      target,
      { x: originX, y: originY, scaleX, scaleY, transformOrigin: "center center" },
      {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        duration: ZOOM_DURATION,
        ease: "power3.inOut",
        onComplete: () => {
          currentIndexRef.current = 0;
          gsap.set(under, { opacity: 1 });
          isTransitioningRef.current = false;
        },
      }
    );
  }

  function renderPage(pageIdx: number, pageRef: React.Ref<HTMLDivElement>, shadeRef?: React.Ref<HTMLDivElement>) {
    if (pageIdx === 0) return <BookCover ref={pageRef} shadeRef={shadeRef} />;
    return <BookPage ref={pageRef} chapter={storyChapters[pageIdx - 1]} shadeRef={shadeRef} />;
  }

  return (
    <section id="story-gallery" className="relative w-full overflow-hidden bg-[color:var(--bg)]/70 py-28 md:py-36">
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--accent-warm)]/6 blur-[160px]" />
      <div className="pointer-events-none absolute inset-0 vignette-edge" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-8 text-center">
        <p className="mb-5 text-[10px] font-light tracking-[0.5em] text-[color:var(--accent-warm)]/80 uppercase md:text-xs">
          The Noorva Story
        </p>
        <h2 className="font-playfair mb-14 max-w-2xl text-3xl leading-[1.2] font-light text-white/95 md:mb-16 md:text-5xl">
          A story worth turning the page for.
        </h2>

        <button
          type="button"
          onClick={handleEnter}
          aria-label="Open the Noorva story book"
          className="group relative cursor-pointer border-none bg-transparent p-0"
          style={{ perspective: 1800 }}
        >
          <div
            className="pointer-events-none absolute inset-0 -z-10 scale-110 rounded-full opacity-60 blur-[70px] transition-opacity duration-500 group-hover:opacity-90"
            style={{ background: "radial-gradient(circle, rgba(232,180,120,0.35), transparent 70%)" }}
          />
          <div
            ref={previewWrapRef}
            className="relative h-[280px] w-[190px] [--book-w:190px] md:h-[400px] md:w-[270px] md:[--book-w:270px]"
            style={{ visibility: entered ? "hidden" : "visible", transformStyle: "preserve-3d" }}
          >
            <RotatingBookPreview />
          </div>
        </button>

        <button
          type="button"
          onClick={handleEnter}
          className="group relative mt-16 shrink-0 rounded-full p-[1.5px] transition-transform duration-300 hover:scale-105 md:mt-20"
          style={{
            background: "linear-gradient(135deg, #e8b478, #db45d7, #7c5cfc)",
            boxShadow: "0 0 28px rgba(232,180,120,0.35)",
          }}
        >
          <span
            className="btn-glow flex items-center gap-2 rounded-full bg-black/85 px-7 py-3 text-[11px] font-semibold tracking-[0.28em] uppercase backdrop-blur-xl transition-colors duration-300 group-hover:bg-black/70"
            style={{ color: "var(--accent-warm)" }}
          >
            Click to Open
          </span>
        </button>
      </div>

      {entered && (
        <div
          ref={overlayRef}
          className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[color:var(--bg)]"
          style={{ zIndex: 32, opacity: 0 }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
          <div className="pointer-events-none absolute inset-0 vignette-edge" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--accent-warm)]/6 blur-[160px]" />

          <div className="relative h-screen w-full" style={{ perspective: 2600 }}>
            {renderPage(underPageIdx, underRef)}
            {renderPage(overPageIdx, overRef, overShadeRef)}
          </div>
        </div>
      )}
    </section>
  );
}
