"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { X } from "lucide-react";
import BookPreview3D from "./StoryGallery3D/BookPreview3D";
import BookLandingScene from "./StoryGallery3D/BookLandingScene";
import StoryCinematic from "./StoryCinematic";
import { galleryCaptureControl, acquireScrollLock, releaseScrollLock, storyGalleryOverlayControl } from "./store";
import { storyChapters } from "./storyData";

// Slide 0 is the title/cover; slides 1..N are storyChapters[0..N-1] — same
// ordering StoryCinematic.tsx expects.
const TOTAL_SLIDES = storyChapters.length + 1;

// The podium's own top-center point (where the book preview should rest),
// as a fraction (0-1) of each backdrop's full image — found by probing the
// actual pixels (sharp). Also each image's native aspect ratio and roughly
// how wide the podium's stone top reads as a fraction of the image's own
// width, used to size the book preview proportionally to it.
const PODIUM_DESKTOP = { x: 0.5007, y: 0.534, widthFrac: 0.207 };
const PODIUM_PHONE = { x: 0.4995, y: 0.5532, widthFrac: 0.2125 };
const BACKDROP_DESKTOP_ASPECT = 1448 / 1086;
const BACKDROP_PHONE_ASPECT = 941 / 1672;
const MD_BREAKPOINT = 768; // matches the md: Tailwind breakpoint used below

// The phone backdrop is a much taller (portrait) photo than the desktop
// one, so covering a typical (also portrait, but less extreme) phone
// viewport needs far less upscale than covering a landscape desktop
// viewport does — true-to-the-photo podium.widthFrac then lands the book
// at barely ~100px wide on a 390px-wide screen (vs. ~300px on desktop),
// reading as cut-off/undersized rather than a deliberate hero element.
// Flooring it to a fraction of the viewport itself keeps the book a
// legible, tappable size on phones without touching how it's positioned.
const MOBILE_MIN_BOOK_WIDTH_FRAC = 0.4;

// The book preview sits in a box shaped like the book itself (aspect
// 190/280) — see BookPreview3D.tsx's wrapper — but BookPreview3D's own
// CameraFit frames the book with a 14% margin on every side (fitTarget's
// `margin: 0.14`), so the WebGL book only fills the inner ~78% of that box
// rather than the whole thing. Anchoring the box's bottom edge (via
// -translate-y-full below) to the podium's surface therefore leaves the
// *book's* actual rendered bottom floating a visible gap above the podium
// — the invisible box, not the book, is what's touching down. Shifting the
// anchor down by that bottom margin's height moves the box (and hence the
// book) down until the book's own bottom edge is what rests on the podium.
// Keep this in sync with BookPreview3D's fitTarget margin and the box's
// own aspect-[190/280] class if either changes.
const BOOK_BOX_ASPECT = 280 / 190; // height / width, matches aspect-[190/280]
const BOOK_FIT_MARGIN = 0.14; // matches BookPreview3D's fitTarget margin
const BOOK_BOTTOM_GAP_FRAC = BOOK_BOX_ASPECT * (BOOK_FIT_MARGIN / (1 + 2 * BOOK_FIT_MARGIN)); // ~0.161 * bookWidth

/** Where the podium's top-center point actually lands on screen, in pixels
 *  relative to the section, plus how wide the book preview should render
 *  there — both account for the backdrop's own object-cover crop. A full-
 *  screen backdrop gets scaled up by the browser until it covers the
 *  container and whichever axis overflows gets cropped; a plain
 *  percentage-of-container point only lines up with the art when the
 *  container's aspect ratio happens to match the image's own, which isn't
 *  true at most real window sizes (see FeaturesSection.tsx's useScreenRect
 *  for the same fix applied to a full rectangle instead of a point). */
function usePodiumPoint(containerRef: React.RefObject<HTMLElement | null>) {
  const [point, setPoint] = useState({ x: 0, y: 0, bookWidth: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function update() {
      if (!el) return;
      const { width: cw, height: ch } = el.getBoundingClientRect();
      if (cw === 0 || ch === 0) return;
      const isDesktop = window.innerWidth >= MD_BREAKPOINT;
      const imgAspect = isDesktop ? BACKDROP_DESKTOP_ASPECT : BACKDROP_PHONE_ASPECT;
      const podium = isDesktop ? PODIUM_DESKTOP : PODIUM_PHONE;
      const containerAspect = cw / ch;

      let renderedW: number, renderedH: number, offsetX: number, offsetY: number;
      if (containerAspect > imgAspect) {
        renderedW = cw;
        renderedH = cw / imgAspect;
        offsetX = 0;
        offsetY = (renderedH - ch) / 2;
      } else {
        renderedH = ch;
        renderedW = ch * imgAspect;
        offsetY = 0;
        offsetX = (renderedW - cw) / 2;
      }

      const trueBookWidth = podium.widthFrac * renderedW;
      const bookWidth = isDesktop ? trueBookWidth : Math.max(trueBookWidth, cw * MOBILE_MIN_BOOK_WIDTH_FRAC);
      setPoint({
        x: podium.x * renderedW - offsetX,
        y: podium.y * renderedH - offsetY + bookWidth * BOOK_BOTTOM_GAP_FRAC,
        bookWidth,
      });
    }

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [containerRef]);

  return point;
}

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
  // Observed so BookLandingScene (see warmLanding below) can start
  // mounting well before the user could plausibly reach the "open" click —
  // scrolling, reading the heading/copy above the book takes several
  // seconds on its own, which is the whole window this is racing to fill.
  const sectionRef = useRef<HTMLElement>(null);
  // The full-screen podium stage — usePodiumPoint measures this to place
  // the book preview on the backdrop's podium regardless of viewport size.
  const stageRef = useRef<HTMLDivElement>(null);
  const podiumPoint = usePodiumPoint(stageRef);
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
  // The fullscreen "book falls onto the desk and opens" cinematic that
  // plays ahead of the DOM reader — its own fixed layer, crossfaded out
  // once BookLandingScene reports the cover is opening (handleLandingOpened).
  const landingWrapRef = useRef<HTMLDivElement>(null);

  // Whether the whole temple/podium scene is showing at all — this section
  // is hidden by default (not reachable by scrolling; see the root
  // <section>'s fixed/opacity styling below) and only appears as a full-
  // screen overlay once storyGalleryOverlayControl.open() fires, wired up
  // to the hero's "Noorva Book" button and the header's "Story" link.
  const [overlayOpen, setOverlayOpen] = useState(false);
  const overlayOpenRef = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [entered, setEntered] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
  // Flips true once, the first time this section comes near the viewport,
  // and never resets — it's what actually mounts BookLandingScene (well
  // ahead of `showLanding`, which just toggles that already-mounted
  // scene's visibility). Its Canvas/Environment/cover textures take real
  // time to spin up (a second independent WebGL context warming up its own
  // GPU-side texture/shadow state, even when the underlying files are
  // browser-cached from the idle preview's own identical assets) — mounted
  // fresh at click time, that cost landed as a dead multi-second freeze
  // between the click and any visible motion. Mounting it early instead
  // means that cost is paid while the user is still scrolling/reading, not
  // after they've already clicked expecting something to happen.
  const [warmLanding, setWarmLanding] = useState(false);
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
    // Reduced-motion visitors never mount BookLandingScene at all (see
    // handleEnter below), so there's nothing worth pre-warming for them.
    if (reducedMotionRef.current) return;
    const el = sectionRef.current;
    if (!el) return;
    // This section is a fixed inset-0 overlay (see the root <section> below)
    // rather than normal scroll-flow content now, so it geometrically
    // overlaps the viewport — and this observer reports "intersecting" —
    // from the moment it mounts, whether or not overlayOpen is actually
    // true yet. That's fine: it just means BookLandingScene now warms up
    // essentially on page load instead of waiting for scroll proximity,
    // which is exactly what's wanted once the scene can be reached
    // immediately from the hero rather than only after scrolling to it.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWarmLanding(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    enteredRef.current = entered;
  }, [entered]);

  useEffect(() => {
    overlayOpenRef.current = overlayOpen;
  }, [overlayOpen]);

  // Registered for CinematicIntro's "Noorva Book" button and Header's
  // "Story" nav link (see storyGalleryOverlayControl's own comment) — both
  // just need to reveal the overlay; scroll gets frozen on the background
  // page for the same reason the reader itself freezes it (acquireScrollLock),
  // under a distinct owner key so the two locks release independently
  // (closing the reader shouldn't also drop the outer overlay's lock, and
  // vice versa).
  useEffect(() => {
    storyGalleryOverlayControl.open = () => {
      acquireScrollLock("story-gallery-overlay");
      setOverlayOpen(true);
    };
    return () => {
      storyGalleryOverlayControl.open = null;
    };
  }, []);

  function handleCloseOverlay() {
    setOverlayOpen(false);
    releaseScrollLock("story-gallery-overlay");
  }

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
      if (e.key !== "Escape") return;
      if (enteredRef.current) {
        closeBook();
      } else if (overlayOpenRef.current) {
        // Reader isn't open yet — just the podium stage — so Escape backs
        // all the way out of the overlay instead of doing nothing.
        handleCloseOverlay();
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

    // Lets nav links (Home/Join/CTAs) escape the book instantly even if it's
    // open mid-read, or back out of the podium overlay entirely if the
    // reader itself was never opened — otherwise clicking e.g. "Join" while
    // this overlay is showing would try to Lenis-scroll a background page
    // that's still scroll-locked underneath it.
    galleryCaptureControl.release = () => {
      if (enteredRef.current) closeBook(true);
      else if (overlayOpenRef.current) handleCloseOverlay();
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
      if (overlayOpenRef.current) releaseScrollLock("story-gallery-overlay");
    };
  }, []);

  // Click on the idly-rotating preview book. Two paths:
  // - Normal: play the fall-onto-the-desk-and-open cinematic
  //   (BookLandingScene, a separate fullscreen WebGL scene) and crossfade
  //   into the DOM reader once its cover is partway open — see
  //   handleLandingOpened below.
  // - prefers-reduced-motion: skip straight to the original FLIP zoom from
  //   the preview's own measured screen position (handleEnterZoom),
  //   unchanged from before the landing cinematic existed — a book
  //   tumbling/falling in from off-screen is exactly the kind of motion
  //   that setting exists to avoid.
  function handleEnter() {
    if (enteredRef.current || isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    if (reducedMotionRef.current) {
      handleEnterZoom();
      return;
    }

    acquireScrollLock("story-gallery");
    setShowLanding(true);
  }

  // Fires partway through BookLandingScene's cover-open swing (not on its
  // full completion) — instead of a flat crossfade, the DOM reader grows
  // OUT of the open book: it starts small, roughly where the book sits
  // under BookLandingScene's own top-down framing (CAMERA_TOP in
  // BookLandingScene.tsx), and scales up to fill the viewport, while the
  // 3D landing layer dissolves away underneath it — reading as the camera
  // diving into the page rather than a cut to a different screen. The
  // landing layer's own fade and the zoom's completion are deliberately on
  // separate timers (see below) so the chapter-one auto-advance can't start
  // compounding with the zoom still visibly in progress.
  function handleLandingOpened() {
    flushSync(() => setEntered(true));
    const overlay = overlayRef.current;
    const landing = landingWrapRef.current;
    const zoomWrap = zoomWrapRef.current;

    // No reducedMotionRef branching in this function — handleEnter never
    // calls BookLandingScene (and so never reaches this callback) for that
    // preference, routing to handleEnterZoom instead.
    const scheduleChapterOne = () => {
      // A single click on the preview now takes the reader all the way to
      // chapter one — land/open/zoom, then straight into the opening
      // crossfade — instead of stopping on the cover slide and waiting for
      // a second click. A short beat lets the zoom's arrival register
      // before the first chapter appears. enteredRef is re-checked since
      // the book could have been closed (Escape, nav-link escape) during
      // this delay.
      setTimeout(() => {
        if (enteredRef.current) goToRef.current?.(1);
      }, 220);
    };

    if (overlay && zoomWrap) {
      gsap.set(overlay, { opacity: 1 });

      // Approximates where the open book sits on screen during
      // BookLandingScene's top-down shot — a centered rect matching the
      // book's own portrait aspect ratio (BOOK_W/BOOK_H from BookModel.tsx)
      // rather than a real measured element (there is none; the book is a
      // WebGL object, not DOM). Pixel-perfect alignment isn't the goal —
      // just growing from a plausible "on the table" size and position
      // instead of popping in at full screen.
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const bookAspect = 1.2 / 1.78;
      let startW = vh * 0.62 * bookAspect;
      let startH = vh * 0.62;
      if (startW > vw * 0.82) {
        startW = vw * 0.82;
        startH = startW / bookAspect;
      }
      const startLeft = (vw - startW) / 2;
      const startTop = (vh - startH) / 2 + vh * 0.03;

      const targetRect = zoomWrap.getBoundingClientRect();
      const scaleX = startW / targetRect.width;
      const scaleY = startH / targetRect.height;
      const originX = startLeft + startW / 2 - (targetRect.left + targetRect.width / 2);
      const originY = startTop + startH / 2 - (targetRect.top + targetRect.height / 2);

      const zoomDuration = 1.15;
      let zoomFinished = false;
      // Guards against GSAP's onComplete never firing under heavy
      // main-thread contention — the identical safety net used throughout
      // this file's history for every GSAP-driven transition.
      const finishZoom = () => {
        if (zoomFinished) return;
        zoomFinished = true;
        gsap.killTweensOf(zoomWrap);
        gsap.set(zoomWrap, { x: 0, y: 0, scaleX: 1, scaleY: 1 });
        currentIndexRef.current = 0;
        isTransitioningRef.current = false;
        scheduleChapterOne();
      };

      gsap.fromTo(
        zoomWrap,
        { x: originX, y: originY, scaleX, scaleY, transformOrigin: "center center" },
        {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          duration: zoomDuration,
          ease: "power3.inOut",
          onComplete: finishZoom,
        }
      );
      setTimeout(finishZoom, zoomDuration * 1000 + 2500);
    } else {
      currentIndexRef.current = 0;
      isTransitioningRef.current = false;
      scheduleChapterOne();
    }

    if (landing) {
      gsap.to(landing, { opacity: 0, duration: 0.7, ease: "power2.out", onComplete: () => setShowLanding(false) });
    } else {
      setShowLanding(false);
    }
  }

  // The original click -> FLIP zoom from the preview's own measured rect
  // straight to fullscreen. Kept verbatim for prefers-reduced-motion, which
  // bypasses the fall/open cinematic above entirely.
  function handleEnterZoom() {
    const previewEl = previewWrapRef.current;
    if (!previewEl) {
      isTransitioningRef.current = false;
      return;
    }

    const startRect = previewEl.getBoundingClientRect();
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
    <section
      id="story-gallery"
      ref={sectionRef}
      // Hidden by default and pulled out of normal scroll flow — this used
      // to be a plain in-flow section reachable by scrolling past the hero;
      // now it only appears when storyGalleryOverlayControl.open() fires
      // (the hero's "Noorva Book" button, the header's "Story" link), as a
      // full-screen overlay on top of whatever the visitor was already
      // looking at. overflow-y-auto (not a hard viewport clip) because the
      // stage below is deliberately taller than 100vh — see its own comment.
      // z-[35] sits above ordinary page content but below Header's own nav
      // pill (z-40/50), so navigation stays reachable while this is open,
      // matching the same relationship the reader/landing layers below
      // already have with Header.
      className="fixed inset-0 z-[35] w-full overflow-x-hidden overflow-y-auto bg-[color:var(--bg)]/70 transition-opacity duration-500 ease-out"
      style={{
        opacity: overlayOpen ? 1 : 0,
        visibility: overlayOpen ? "visible" : "hidden",
        pointerEvents: overlayOpen ? "auto" : "none",
      }}
    >
      <div className="pointer-events-none absolute inset-0 vignette-edge" />

      {/* Close the whole overlay and return to wherever the visitor was —
          only while just the podium stage is showing; once the book's
          actually open, the reader below has its own close button (and
          closing it lands back here, where this button reappears). */}
      {!entered && (
        <button
          type="button"
          onClick={handleCloseOverlay}
          aria-label="Close the Noorva story"
          className="fixed top-20 right-3 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/70 backdrop-blur-xl transition-colors duration-300 hover:text-[color:var(--accent-warm)] sm:right-4 md:top-24 md:right-6 md:h-10 md:w-10"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      )}

      {/* Stage — public/book_bg_desktop.png (book_bg_mobile.png below md) is
          a temple chamber with a stone podium built into the art itself,
          filling the full viewport. The heading and "Click to Open" button
          overlay the bottom of this same image (a scrim behind them keeps
          them legible) rather than sitting in their own flow block above
          it — that previously pushed the image mostly below the fold,
          since the section's total height was heading-height + a full
          100vh image stacked after it. Since the backdrop is
          object-cover'd edge-to-edge, the browser crops whichever axis
          overflows depending on the viewport's aspect ratio —
          usePodiumPoint redoes that same crop math by hand so the book
          preview stays exactly on the podium's surface (and sized to it)
          at any viewport size, instead of drifting the way a plain
          percentage position would (see that hook's own comment, and
          FeaturesSection.tsx's useScreenRect for the same fix applied to a
          full rectangle instead of a point). Taller than the viewport
          (120vh) for a more cinematic, zoomed-in crop of the temple art;
          the outer <section> scrolls internally (overflow-y-auto above) so
          the heading/CTA anchored to its bottom stays reachable. */}
      <div ref={stageRef} className="relative z-10 h-[120vh] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/book_bg_mobile.png"
          alt="A stone podium inside an ancient torch-lit temple chamber"
          className="absolute inset-0 block h-full w-full object-cover md:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/book_bg_desktop.png"
          alt="A stone podium inside an ancient torch-lit temple chamber"
          className="absolute inset-0 hidden h-full w-full object-cover md:block"
        />

        {/* Bottom scrim — keeps the overlaid heading/button legible
            against the (often bright, torch-lit) floor in the art. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent" />

        <button
          type="button"
          onClick={handleEnter}
          aria-label="Open the Noorva story book"
          className="group absolute -translate-x-1/2 -translate-y-full cursor-pointer border-none bg-transparent p-0"
          style={{ left: podiumPoint.x, top: podiumPoint.y, width: podiumPoint.bookWidth || undefined }}
        >
          <div
            className="pointer-events-none absolute inset-0 -z-10 scale-150 rounded-full opacity-60 blur-[70px] transition-opacity duration-500 group-hover:opacity-90"
            style={{ background: "radial-gradient(circle, rgba(232,180,120,0.35), transparent 70%)" }}
          />
          <div
            ref={previewWrapRef}
            className="relative aspect-[190/280] w-full"
            style={{ visibility: entered || showLanding ? "hidden" : "visible" }}
          >
            <BookPreview3D />
          </div>
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 mx-auto flex max-w-6xl flex-col items-center px-8 pb-12 text-center md:pb-16">
          <p className="mb-5 text-[10px] font-light tracking-[0.5em] text-[color:var(--accent-warm)]/80 uppercase md:text-xs">
            The Noorva Story
          </p>
          <h2 className="font-playfair text-balance mb-8 max-w-xl text-4xl leading-[1.2] font-light whitespace-normal text-white/95 md:max-w-none md:whitespace-nowrap md:text-5xl">
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
            className="group pointer-events-auto relative shrink-0 rounded-full p-[1.5px] transition-transform duration-300 hover:scale-105"
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
      </div>

      {/* Fullscreen fall/land/open cinematic. Mounted once `warmLanding`
          fires (well before any click — see that state's own comment)
          and stays mounted from then on; `showLanding` only toggles its
          visibility, covering (and, once open, crossfading out to reveal)
          the `entered` DOM reader beneath it. Kept invisible+non-
          interactive rather than unmounted while idle specifically so its
          Canvas never has to cold-start again on a second or third open in
          the same visit. */}
      {warmLanding && (
        <div
          ref={landingWrapRef}
          className="fixed inset-0 overflow-hidden bg-[color:var(--bg)]"
          style={{
            zIndex: 33,
            opacity: showLanding ? 1 : 0,
            visibility: showLanding ? "visible" : "hidden",
            pointerEvents: "none",
          }}
        >
          <BookLandingScene active={showLanding} onOpened={handleLandingOpened} />
        </div>
      )}

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
