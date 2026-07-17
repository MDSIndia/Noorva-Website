"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { X } from "lucide-react";
import BookPreview3D from "./StoryGallery3D/BookPreview3D";
import StoryCinematic from "./StoryCinematic";
import { galleryCaptureControl, acquireScrollLock, releaseScrollLock } from "./store";
import { storyChapters } from "./storyData";

// Slide 0 is the title/cover; slides 1..N are storyChapters[0..N-1] — same
// ordering StoryCinematic.tsx expects.
const TOTAL_SLIDES = storyChapters.length + 1;

const SLIDE_DURATION = 1.05; // seconds, one crossfade between slides — matches StoryCinematic's own transition duration
const ZOOM_DURATION = 0.9; // seconds, preview -> fullscreen
const WHEEL_THRESHOLD = 2; // ignore near-zero wheel noise
const SWIPE_THRESHOLD = 30; // px, minimum touch swipe to count as a gesture
// Trackpad/inertial wheel scrolling keeps emitting decaying delta events for
// a while after the user's physical gesture ends. Without this, a single
// flick that outlasts SLIDE_DURATION triggers a second, unintended chapter
// transition the instant the first one finishes — the slide visibly changes
// twice for one scroll. A gesture only "ends" once wheel events stop for
// this long, so trailing momentum can't chain into another transition.
const GESTURE_IDLE_MS = 180;

export default function StoryGallerySection() {
  // The clickable, idly-rotating book sitting in normal page flow before
  // it's opened — its measured rect is the FLIP-animation's start point.
  const previewWrapRef = useRef<HTMLDivElement>(null);
  // The fixed fullscreen layer that appears once opened.
  const overlayRef = useRef<HTMLDivElement>(null);
  // zoomWrapRef is what the preview->fullscreen zoom actually CSS-transforms
  // (scale/position) — a plain DOM wrapper around StoryCinematic, so unlike
  // the earlier WebGL reader there's no Canvas/ResizeObserver measurement
  // race to guard against; the zoom can start as soon as this mounts.
  const zoomWrapRef = useRef<HTMLDivElement>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [entered, setEntered] = useState(false);
  const enteredRef = useRef(false);

  const currentIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const isTransitioningRef = useRef(false); // guards the open/close zoom itself
  // Lets handleEnter (defined outside the gesture-wiring effect below) invoke
  // the same goTo used by wheel/touch/keyboard, so a single click on the
  // preview can zoom to fullscreen AND immediately advance to chapter one —
  // instead of requiring a second click on the fullscreen cover slide.
  const goToRef = useRef<((targetIndex: number) => void) | null>(null);
  // Exposes the animated closeBook to the visible close button below — on
  // mobile there's no Escape key, and swiping all the way past either end
  // of the book to close it isn't discoverable, so an explicit tap target
  // is the only reliable exit once several chapters deep.
  const closeBookRef = useRef<(() => void) | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const gestureConsumedRef = useRef(false);
  const gestureIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Read once at mount, matching CosmicBackground.tsx's existing convention.
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    enteredRef.current = entered;
  }, [entered]);

  useEffect(() => {
    // `thenClose`: used when backing out of chapter one by scroll — crossfades
    // back to the cover slide and only once that settles does closeBook() run,
    // so the exit reads as one continuous "closing" motion instead of chapter
    // one's content abruptly shrinking away mid-read.
    function goTo(targetIndex: number, thenClose = false) {
      if (isAnimatingRef.current) return;
      const from = currentIndexRef.current;
      if (targetIndex === from) return;

      isAnimatingRef.current = true;
      currentIndexRef.current = targetIndex;
      setCurrentIndex(targetIndex);

      const duration = (reducedMotionRef.current ? SLIDE_DURATION * 0.35 : SLIDE_DURATION) * 1000;
      setTimeout(() => {
        isAnimatingRef.current = false;
        if (thenClose) closeBook();
      }, duration);
    }
    goToRef.current = goTo;

    // Closes the book, with a quick fade/scale-down of the fullscreen layer
    // — used whenever the reader scrolls/swipes past either end. `immediate`
    // skips the animation entirely, for nav links that need to escape now.
    function closeBook(immediate = false) {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      function finish() {
        currentIndexRef.current = 0;
        flushSync(() => {
          setCurrentIndex(0);
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
    closeBookRef.current = () => closeBook();

    function handleDirection(delta: number) {
      if (!enteredRef.current || isAnimatingRef.current || isTransitioningRef.current) return;
      if (delta > 0) {
        // The cover only opens on a deliberate click, never on scroll —
        // scrolling past it inconsistently was the source of the "book
        // sometimes doesn't open" flakiness.
        if (currentIndexRef.current === 0) return;
        if (currentIndexRef.current < TOTAL_SLIDES - 1) {
          goTo(currentIndexRef.current + 1);
        } else {
          closeBook();
        }
      } else {
        // Scrolling back up from chapter one closes the book rather than
        // landing back on an interactive cover — reopening it is a click
        // gesture, not scroll. But it should still look like it's closing:
        // crossfade back to the cover slide first (goTo(0, true)), THEN
        // fade/scale out, rather than chapter one's content abruptly
        // vanishing mid-read.
        if (currentIndexRef.current > 1) {
          goTo(currentIndexRef.current - 1);
        } else if (currentIndexRef.current === 1) {
          goTo(0, true);
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
  // full-viewport-sized) cinematic wrapper from that measured rect back down
  // to its natural size/position — reading as the small book zooming up to
  // fill the screen, rather than an abrupt cut.
  function handleEnter() {
    if (enteredRef.current || isTransitioningRef.current) return;
    const previewEl = previewWrapRef.current;
    if (!previewEl) return;

    const startRect = previewEl.getBoundingClientRect();
    isTransitioningRef.current = true;
    acquireScrollLock("story-gallery");
    flushSync(() => setEntered(true));

    const overlay = overlayRef.current;
    const zoomWrap = zoomWrapRef.current;
    if (!overlay || !zoomWrap) {
      isTransitioningRef.current = false;
      return;
    }

    gsap.set(overlay, { opacity: 1 });

    // flushSync above already committed the DOM, so zoomWrap's real
    // fullscreen rect is measurable right away — unlike the old WebGL
    // reader, a plain DOM wrapper has no ResizeObserver-vs-transform race to
    // wait out here.
    const targetRect = zoomWrap.getBoundingClientRect();
    const scaleX = startRect.width / targetRect.width;
    const scaleY = startRect.height / targetRect.height;
    const originX = startRect.left + startRect.width / 2 - (targetRect.left + targetRect.width / 2);
    const originY = startRect.top + startRect.height / 2 - (targetRect.top + targetRect.height / 2);

    let openFinished = false;
    // Guards against GSAP's onComplete never firing under heavy main-thread
    // contention — the identical safety net used throughout this file's
    // history for every GSAP-driven transition.
    const finishOpening = () => {
      if (openFinished) return;
      openFinished = true;
      gsap.killTweensOf(zoomWrap);
      gsap.set(zoomWrap, { x: 0, y: 0, scaleX: 1, scaleY: 1 });
      currentIndexRef.current = 0;
      isTransitioningRef.current = false;
      // A single click on the preview now takes the reader all the way to
      // chapter one — zoom to fullscreen, then straight into the opening
      // crossfade — instead of landing on the cover slide and waiting for a
      // second click. A short beat (skipped/shortened under reduced motion)
      // lets the zoom's arrival register before the first chapter appears,
      // rather than the two motions blurring into one. enteredRef is
      // re-checked since the book could have been closed (Escape, nav-link
      // escape) during this delay.
      setTimeout(
        () => {
          if (enteredRef.current) goToRef.current?.(1);
        },
        reducedMotionRef.current ? 60 : 220
      );
    };

    gsap.fromTo(
      zoomWrap,
      { x: originX, y: originY, scaleX, scaleY, transformOrigin: "center center" },
      {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        duration: reducedMotionRef.current ? ZOOM_DURATION * 0.35 : ZOOM_DURATION,
        ease: reducedMotionRef.current ? "none" : "power3.inOut",
        onComplete: finishOpening,
      }
    );
    const zoomDurationMs = (reducedMotionRef.current ? ZOOM_DURATION * 0.35 : ZOOM_DURATION) * 1000;
    setTimeout(finishOpening, zoomDurationMs + 2500);
  }

  return (
    <section id="story-gallery" className="relative w-full overflow-hidden bg-[color:var(--bg)]/70 py-28 md:py-36">
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--accent-warm)]/6 blur-[160px]" />
      <div className="pointer-events-none absolute inset-0 vignette-edge" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-8 text-center">
        <p className="mb-5 text-[10px] font-light tracking-[0.5em] text-[color:var(--accent-warm)]/80 uppercase md:text-xs">
          The Noorva Story
        </p>
        <h2 className="font-playfair text-balance mb-14 max-w-xl text-4xl leading-[1.2] font-light whitespace-normal text-white/95 md:mb-16 md:max-w-none md:whitespace-nowrap md:text-5xl">
          The Book Preserved since Ancient Times
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #e8b478 0%, #f4d9a8 50%, #e8b478 100%)",
              filter: "drop-shadow(0 0 24px rgba(232,180,120,0.4))",
            }}
          >
            with Unwavering Care.
          </span>
        </h2>

        <button
          type="button"
          onClick={handleEnter}
          aria-label="Open the Noorva story book"
          className="group relative cursor-pointer border-none bg-transparent p-0"
        >
          <div
            className="pointer-events-none absolute inset-0 -z-10 scale-110 rounded-full opacity-60 blur-[70px] transition-opacity duration-500 group-hover:opacity-90"
            style={{ background: "radial-gradient(circle, rgba(232,180,120,0.35), transparent 70%)" }}
          />
          <div
            ref={previewWrapRef}
            className="relative h-[280px] w-[190px] md:h-[400px] md:w-[270px]"
            style={{ visibility: entered ? "hidden" : "visible" }}
          >
            <BookPreview3D />
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
          {/* Explicit close control — Escape and swiping past either end
              both already close the book, but neither is discoverable on a
              touch device (no keyboard, and swiping back through every
              already-read chapter just to exit isn't obvious), so this is
              the only reliably reachable exit once several chapters deep.
              Pinned below the header at every breakpoint, not just top-right
              — Header.tsx's own nav wrapper spans the full viewport width
              (`inset-x-0`) for hit-testing even though its visible pill is
              centered/right-aligned within it, so anything placed inside
              that same top band anywhere across the width gets its clicks
              swallowed by the wrapper's z-40, not just directly under the
              pill itself. */}
          <button
            type="button"
            onClick={() => closeBookRef.current?.()}
            aria-label="Close the Noorva story book"
            className="fixed top-20 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/70 backdrop-blur-xl transition-colors duration-300 hover:text-[color:var(--accent-warm)] sm:right-4 md:top-24 md:right-6 md:h-10 md:w-10"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>

          <div ref={zoomWrapRef} className="h-screen w-full">
            <StoryCinematic currentIndex={currentIndex} />
          </div>
        </div>
      )}
    </section>
  );
}
