"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import BookPage from "./BookPage";
import BookCover from "./BookCover";
import { lenisRef, galleryCaptureControl } from "./store";
import { storyChapters } from "./storyData";

// Page 0 is the cover; pages 1..N are the chapters.
const TOTAL_PAGES = storyChapters.length + 1;

const FLIP_DURATION = 1.1; // seconds, one full page-turn
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
  const sectionRef = useRef<HTMLDivElement>(null);

  // Two stacked page slots. `underRef` always rests flat (rotateY 0) and
  // just has its content silently swapped while hidden behind `overRef`.
  // `overRef` is the one that actually turns — 0deg -> ±180deg around
  // whichever edge matches the nav direction — and vanishes past 90deg via
  // backface-visibility, revealing `under` (already showing the target
  // chapter) sitting flat underneath. `over` is then silently snapped back
  // to 0deg/target content, restoring the resting invariant for next time.
  const underRef = useRef<HTMLDivElement>(null);
  const overRef = useRef<HTMLDivElement>(null);
  const overShadeRef = useRef<HTMLDivElement>(null);
  const [underPageIdx, setUnderPageIdx] = useState(0);
  const [overPageIdx, setOverPageIdx] = useState(0);

  const currentIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const capturedRef = useRef(false);
  const exitingRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const gestureConsumedRef = useRef(false);
  const gestureIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    function enterCapture() {
      if (capturedRef.current || exitingRef.current || !el) return;
      capturedRef.current = true;
      // Snap exactly to the section's top so it perfectly fills the viewport —
      // otherwise a smooth-scroll overshoot would leave the next/previous
      // section peeking in at the edge while "locked".
      const rect = el.getBoundingClientRect();
      const targetY = window.scrollY + rect.top;
      lenisRef.current?.scrollTo(targetY, { immediate: true });
      lenisRef.current?.stop();
      document.body.style.overflow = "hidden";
    }

    // Lets nav links (Home/Story/Join/CTAs) escape the gallery's scroll lock
    // even if it's mid-capture, and briefly suppress re-capture so a long
    // jump that transits *through* the gallery (e.g. Home -> Join) doesn't
    // get trapped again mid-flight. Callers pass 0 when the destination IS
    // the gallery, so arriving at "Story" still captures immediately.
    galleryCaptureControl.release = (suppressMs = 1600) => {
      if (capturedRef.current) {
        capturedRef.current = false;
        document.body.style.overflow = "";
        lenisRef.current?.start();
      }
      galleryCaptureControl.suppressedUntil = Date.now() + suppressMs;
    };

    function exitCapture(direction: "up" | "down") {
      capturedRef.current = false;
      exitingRef.current = true;
      document.body.style.overflow = "";
      lenisRef.current?.start();
      const delta = direction === "down" ? window.innerHeight : -window.innerHeight;
      lenisRef.current?.scrollTo(window.scrollY + delta, {
        duration: 1.1,
        onComplete: () => {
          exitingRef.current = false;
        },
      });
    }

    function goTo(targetIndex: number) {
      if (isAnimatingRef.current) return;
      const from = currentIndexRef.current;
      if (targetIndex === from) return;
      const over = overRef.current;
      const under = underRef.current;
      const shade = overShadeRef.current;
      if (!over || !under || !shade) return;

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
      setUnderPageIdx(targetIndex); // hidden swap — `under` sits flat beneath `over`
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
          setOverPageIdx(targetIndex); // now identical to `under` — invisible swap
          gsap.set(over, { rotateY: 0, y: 0, scaleX: 1 });
          gsap.set(under, { opacity: 1 });
          gsap.set(shade, { opacity: 0 });
          isAnimatingRef.current = false;
        },
      });
    }

    function handleDirection(delta: number) {
      if (!capturedRef.current || isAnimatingRef.current) return;
      if (delta > 0) {
        // The cover only opens on a deliberate click, never on scroll —
        // scrolling past it inconsistently was the source of the "book
        // sometimes doesn't open" flakiness.
        if (currentIndexRef.current === 0) return;
        if (currentIndexRef.current < TOTAL_PAGES - 1) {
          goTo(currentIndexRef.current + 1);
        } else {
          exitCapture("down");
        }
      } else {
        // Scrolling back up from chapter one exits the gallery rather than
        // re-closing the cover — reopening it is a click gesture, not scroll.
        if (currentIndexRef.current > 1) {
          goTo(currentIndexRef.current - 1);
        } else {
          exitCapture("up");
        }
      }
    }

    function onCoverClick() {
      if (capturedRef.current && !isAnimatingRef.current && currentIndexRef.current === 0) {
        goTo(1);
      }
    }
    el.addEventListener("click", onCoverClick);

    function onWheel(e: WheelEvent) {
      if (!capturedRef.current) return;
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

    function onTouchStart(e: TouchEvent) {
      if (!capturedRef.current) return;
      touchStartYRef.current = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (!capturedRef.current || touchStartYRef.current === null) return;
      e.preventDefault();
    }

    function onTouchEnd(e: TouchEvent) {
      if (!capturedRef.current || touchStartYRef.current === null) return;
      const endY = e.changedTouches[0].clientY;
      const delta = touchStartYRef.current - endY; // positive = swiped up = "next"
      touchStartYRef.current = null;
      if (Math.abs(delta) < SWIPE_THRESHOLD) return;
      handleDirection(delta);
    }

    let raf: number;
    function tick() {
      if (!capturedRef.current && el && Date.now() > galleryCaptureControl.suppressedUntil) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 2 && rect.top > -rect.height) {
          enterCapture();
        }
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      if (gestureIdleTimerRef.current) clearTimeout(gestureIdleTimerRef.current);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("click", onCoverClick);
      galleryCaptureControl.release = null;
      if (capturedRef.current) {
        capturedRef.current = false;
        document.body.style.overflow = "";
        lenisRef.current?.start();
      }
    };
  }, []);

  function renderPage(pageIdx: number, pageRef: React.Ref<HTMLDivElement>, shadeRef?: React.Ref<HTMLDivElement>) {
    if (pageIdx === 0) return <BookCover ref={pageRef} shadeRef={shadeRef} />;
    return <BookPage ref={pageRef} chapter={storyChapters[pageIdx - 1]} shadeRef={shadeRef} />;
  }

  return (
    <section
      id="story-gallery"
      ref={sectionRef}
      className="relative flex w-full h-screen items-center justify-center overflow-hidden bg-[color:var(--bg)]/70"
      style={{ zIndex: 25 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
      <div className="pointer-events-none absolute inset-0 vignette-edge" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--accent-warm)]/6 blur-[160px]" />

      <div className="relative h-screen w-full" style={{ perspective: 2600 }}>
        {renderPage(underPageIdx, underRef)}
        {renderPage(overPageIdx, overRef, overShadeRef)}
      </div>
    </section>
  );
}
