"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import BookPreview3D from "./StoryGallery3D/BookPreview3D";
import BookReader3D from "./StoryGallery3D/BookReader3D";
import type { PageAnim } from "./StoryGallery3D/PageMesh";
import { galleryCaptureControl, acquireScrollLock, releaseScrollLock } from "./store";
import { storyChapters } from "./storyData";

// Page 0 is the cover; pages 1..N are the chapters — same ordering as
// BookReader3D's PORTRAIT_PAGE_SOURCES/LANDSCAPE_PAGE_SOURCES.
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

export default function StoryGallerySection() {
  // The clickable, idly-rotating book sitting in normal page flow before
  // it's opened — its measured rect is the FLIP-animation's start point.
  const previewWrapRef = useRef<HTMLDivElement>(null);
  // The fixed fullscreen layer that appears once opened.
  const overlayRef = useRef<HTMLDivElement>(null);
  // zoomWrapRef is what the preview->fullscreen zoom actually CSS-transforms
  // (scale/position), the same way the old DOM version transformed the
  // `over` cover element directly. readerWrapRef (nested inside it) hosts
  // the actual <Canvas> and is deliberately never transformed itself — see
  // the comment at its JSX for why that split matters.
  const zoomWrapRef = useRef<HTMLDivElement>(null);
  const readerWrapRef = useRef<HTMLDivElement>(null);

  // Two stacked page slots, mirroring the original CSS version's under/over
  // convention exactly: `under` always rests flat showing the destination
  // page, silently swapped while hidden behind `over`. `over` is the one
  // that actually turns (see PageMesh/CurlPageMaterial) and vanishes past
  // ~92deg via backface culling, revealing `under` (already showing the
  // target chapter) underneath. `over` is then silently reset to
  // progress=0/target texture, restoring the resting invariant for next time.
  const underAnimRef = useRef<PageAnim>({ progress: 0, direction: 1, opacity: 1 });
  const overAnimRef = useRef<PageAnim>({ progress: 0, direction: 1, opacity: 1 });
  const [underPageIdx, setUnderPageIdx] = useState(0);
  const [overPageIdx, setOverPageIdx] = useState(0);
  const [entered, setEntered] = useState(false);
  const [inView, setInView] = useState(false);
  const enteredRef = useRef(false);

  const currentIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const isTransitioningRef = useRef(false); // guards the open/close zoom itself
  // Lets handleEnter (defined outside the gesture-wiring effect below) invoke
  // the same goTo used by wheel/touch/keyboard, so a single click on the
  // preview can zoom to fullscreen AND immediately flip open to chapter 1 —
  // instead of requiring a second click on the fullscreen cover.
  const goToRef = useRef<((targetIndex: number) => void) | null>(null);
  // Holds the "now safe to start the zoom" continuation — invoked from
  // BookReader3D's onReady (fired once R3F has actually created its WebGL
  // context and measured its container), not a fixed timer. See handleEnter
  // for why a blind delay wasn't reliable across cold vs. warm page loads.
  const startZoomRef = useRef<(() => void) | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const gestureConsumedRef = useRef(false);
  const gestureIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Read once at mount, matching CosmicBackground.tsx's existing convention.
  // A full page-curl swings through a fairly large, sweeping motion — kept
  // as-is (still a real page turn, not swapped for a plain crossfade) but
  // sped up and flattened to a linear ease, since duration/easing drama is
  // exactly what prefers-reduced-motion asks to dial back.
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    enteredRef.current = entered;
  }, [entered]);

  // Pauses the fullscreen reader's WebGL render loop while its section is
  // off-screen — same IntersectionObserver + frameloop pattern already used
  // by PhoneShowcase3D and BookPreview3D.
  useEffect(() => {
    const el = overlayRef.current?.parentElement;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "200px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [entered]);

  useEffect(() => {
    // `thenClose`: used when backing out of chapter one by scroll — flips
    // the cover page shut (curling backward, the mirror of a forward turn)
    // and only once that settles does closeBook() run, so the exit reads as
    // one continuous "the book is closing" motion instead of chapter one's
    // content abruptly fading/shrinking away mid-page.
    function goTo(targetIndex: number, thenClose = false) {
      if (isAnimatingRef.current) return;
      const from = currentIndexRef.current;
      if (targetIndex === from) return;

      const forward = targetIndex > from;
      const direction = forward ? 1 : -1;

      isAnimatingRef.current = true;

      // `under` reveals the destination immediately (it's hidden behind
      // `over` until `over` curls away); `over` keeps showing the page
      // we're turning FROM, animating out.
      flushSync(() => {
        setUnderPageIdx(targetIndex);
        setOverPageIdx(from);
      });
      overAnimRef.current.progress = 0;
      overAnimRef.current.direction = direction;
      overAnimRef.current.opacity = 1;

      const proxy = { progress: 0 };
      let flipFinished = false;
      // Guards against GSAP's onComplete never firing — observed under heavy
      // main-thread contention from the actively-rendering WebGL canvas,
      // which can stall GSAP's own requestAnimationFrame-driven ticker well
      // past a tween's nominal duration (see the identical safety net in
      // handleEnter's zoom, where this was first diagnosed: a 900ms tween's
      // onComplete hadn't fired even 1.6s later). Without this, isAnimatingRef
      // gets stuck true, silently blocking every future page turn.
      const finishFlip = () => {
        if (flipFinished) return;
        flipFinished = true;
        gsap.killTweensOf(proxy);
        currentIndexRef.current = targetIndex;
        // `over` is edge-on/invisible at progress=1 (backface-culled) —
        // safe to silently snap it back to the resting state and swap its
        // texture to the target page, ready as the "from" page for
        // whichever direction the next flip goes.
        setOverPageIdx(targetIndex);
        overAnimRef.current.progress = 0;
        isAnimatingRef.current = false;
        if (thenClose) closeBook();
      };

      gsap.to(proxy, {
        progress: 1,
        duration: reducedMotionRef.current ? FLIP_DURATION * 0.35 : FLIP_DURATION,
        // inOut eases gently into the turn and, just as importantly, gently
        // out of it — power2.in accelerated the whole way and then stopped
        // dead at full speed, which read as an abrupt snap rather than a
        // smooth turn settling into place. Flattened to linear under
        // reduced-motion, alongside the shorter duration above.
        ease: reducedMotionRef.current ? "none" : "power2.inOut",
        onUpdate: () => {
          overAnimRef.current.progress = proxy.progress;
        },
        onComplete: finishFlip,
      });
      const flipDurationMs = (reducedMotionRef.current ? FLIP_DURATION * 0.35 : FLIP_DURATION) * 1000;
      setTimeout(finishFlip, flipDurationMs + 2500);
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
        // landing back on an interactive cover — reopening it is a click
        // gesture, not scroll. But it should still look like the book
        // closing: flip chapter one shut first (goTo(0, true) — curling
        // backward, the mirror of a forward turn), THEN fade/scale out,
        // rather than chapter one's content abruptly vanishing mid-page.
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
  // full-viewport-sized) reader canvas from that measured rect back down to
  // its natural size/position — reading as the small book zooming up to
  // fill the screen, rather than an abrupt cut. `under` stays hidden
  // (opacity 0) for the duration so the cover at full size doesn't show
  // through behind the still-small `over` layer as it grows into it.
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

    overAnimRef.current.progress = 0;
    overAnimRef.current.opacity = 1;
    underAnimRef.current.opacity = 0;
    gsap.set(overlay, { opacity: 1 });

    // R3F's <Canvas> measures its container's size at mount via its own
    // ResizeObserver — if the zoom's tiny starting scale is already applied
    // by the time that fires, it permanently locks onto that tiny size (a
    // transform change doesn't fire ResizeObserver again). Keeping zoomWrap
    // invisible-but-untransformed until BookReader3D's onReady confirms R3F
    // has actually created its WebGL context (and therefore already
    // measured its container) avoids the race entirely, rather than
    // guessing a fixed delay: a hardcoded wait tuned against a warm dev
    // server reliably passed on subsequent loads but was NOT long enough on
    // a genuinely cold first load (all of this session's changed files
    // compiling for the first time), which reproduced the exact
    // "permanently stuck small in the corner" bug this was meant to fix.
    // Two nested rAFs was tried even earlier and also wasn't reliable —
    // ResizeObserver callbacks run in their own timing phase that can land
    // after a same-frame rAF chain.
    gsap.set(zoomWrap, { opacity: 0 });

    let started = false;
    const startZoom = () => {
      if (started) return;
      started = true;
      startZoomRef.current = null;

      const targetRect = zoomWrap.getBoundingClientRect();
      const scaleX = startRect.width / targetRect.width;
      const scaleY = startRect.height / targetRect.height;
      const originX = startRect.left + startRect.width / 2 - (targetRect.left + targetRect.width / 2);
      const originY = startRect.top + startRect.height / 2 - (targetRect.top + targetRect.height / 2);

      let openFinished = false;
      // Guards against GSAP's onComplete never firing. Confirmed via direct
      // instrumentation: with the fullscreen reader's WebGL canvas actively
      // rendering (frameloop "always"), the heavy per-frame render cost can
      // starve the main thread badly enough to stall GSAP's own
      // requestAnimationFrame-driven ticker — a 900ms tween's onComplete was
      // observed not firing even 1.6s later. Without this safety net,
      // isTransitioningRef gets stuck true forever, and closeBook()'s own
      // guard then silently no-ops on every future Escape/scroll/nav-escape
      // attempt — the book becomes permanently unclosable.
      const finishOpening = () => {
        if (openFinished) return;
        openFinished = true;
        gsap.killTweensOf(zoomWrap);
        gsap.set(zoomWrap, { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1 });
        currentIndexRef.current = 0;
        underAnimRef.current.opacity = 1;
        isTransitioningRef.current = false;
        // A single click on the preview now takes the reader all the way
        // to chapter one — zoom to fullscreen, then straight into the
        // opening page-turn — instead of landing on the closed cover and
        // waiting for a second click. A short beat (skipped/shortened
        // under reduced motion, matching this component's other timings)
        // lets the zoom's arrival register before the cover starts
        // turning, rather than the two motions blurring into one.
        // enteredRef is re-checked since the book could have been closed
        // (Escape, nav-link escape) during this delay.
        setTimeout(
          () => {
            if (enteredRef.current) goToRef.current?.(1);
          },
          reducedMotionRef.current ? 60 : 220
        );
      };

      gsap.fromTo(
        zoomWrap,
        { x: originX, y: originY, scaleX, scaleY, opacity: 1, transformOrigin: "center center" },
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
    };

    startZoomRef.current = startZoom;
    // Safety net only — onReady should always fire first in practice. Guards
    // against a pathological case (e.g. a WebGL context creation failure)
    // where onReady never fires and the reader would otherwise hang
    // invisible forever.
    setTimeout(startZoom, 4000);
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
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
          <div className="pointer-events-none absolute inset-0 vignette-edge" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--accent-warm)]/6 blur-[160px]" />

          {/* zoomWrapRef is what handleEnter's GSAP transform actually
              scales/translates — readerWrapRef (the Canvas's immediate
              container) stays untransformed and always at its natural full
              size, so R3F measures it correctly at mount instead of latching
              onto the zoom's scaled-down starting size (transforms don't
              fire ResizeObserver, so a Canvas that mounts mid-scale never
              gets a chance to re-measure once the scale animates back to 1). */}
          <div ref={zoomWrapRef} className="h-screen w-full">
            <div ref={readerWrapRef} className="relative h-screen w-full">
              <BookReader3D
                underIndex={underPageIdx}
                overIndex={overPageIdx}
                underAnimRef={underAnimRef}
                overAnimRef={overAnimRef}
                frameloop={inView ? "always" : "never"}
                onReady={() => startZoomRef.current?.()}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
