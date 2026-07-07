"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import SpiralGallery from "./SpiralGallery";
import { galleryTransition, lenisRef, galleryCaptureControl } from "./store";
import { storyChapters } from "./storyData";

const FLIP_DURATION = 1.05; // seconds, one full roll-to-next-photo animation
const WHEEL_THRESHOLD = 2; // ignore near-zero wheel noise
const SWIPE_THRESHOLD = 30; // px, minimum touch swipe to count as a gesture

export default function StoryGallerySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [captionVisible, setCaptionVisible] = useState(true);

  const currentIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const capturedRef = useRef(false);
  const exitingRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  // Pause the R3F render loop while the section is far off-screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "300px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

      isAnimatingRef.current = true;
      setCaptionVisible(false);

      const obj = { v: 0 };
      let swapped = false;
      let revealed = false;
      gsap.to(obj, {
        v: 1,
        duration: FLIP_DURATION,
        ease: "power2.inOut",
        onUpdate: () => {
          galleryTransition.fromIndex = from;
          galleryTransition.toIndex = targetIndex;
          galleryTransition.progress = obj.v;
          // Swap the caption's content the instant the shader swaps textures
          // (same 0.5 point), but only start revealing it a little later so
          // its ~0.35s fade-in finishes right as the image finishes settling
          // flat — the two arrive together instead of text visibly lagging
          // behind an already-still photo.
          if (!swapped && obj.v >= 0.5) {
            swapped = true;
            setDisplayIndex(targetIndex);
          }
          if (!revealed && obj.v >= 0.62) {
            revealed = true;
            setCaptionVisible(true);
          }
        },
        onComplete: () => {
          currentIndexRef.current = targetIndex;
          galleryTransition.fromIndex = targetIndex;
          galleryTransition.toIndex = targetIndex;
          galleryTransition.progress = 0;
          isAnimatingRef.current = false;
        },
      });
    }

    function handleDirection(delta: number) {
      if (!capturedRef.current || isAnimatingRef.current) return;
      if (delta > 0) {
        if (currentIndexRef.current < storyChapters.length - 1) {
          goTo(currentIndexRef.current + 1);
        } else {
          exitCapture("down");
        }
      } else {
        if (currentIndexRef.current > 0) {
          goTo(currentIndexRef.current - 1);
        } else {
          exitCapture("up");
        }
      }
    }

    function onWheel(e: WheelEvent) {
      if (!capturedRef.current) return;
      e.preventDefault();
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
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
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      galleryCaptureControl.release = null;
      if (capturedRef.current) {
        capturedRef.current = false;
        document.body.style.overflow = "";
        lenisRef.current?.start();
      }
    };
  }, []);

  const chapter = storyChapters[displayIndex];

  return (
    <section
      id="story-gallery"
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden bg-black"
      style={{ zIndex: 25 }}
    >
      <SpiralGallery frameloop={inView ? "always" : "never"} />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />
      <div className="pointer-events-none absolute inset-0 vignette-edge" />

      <div className="absolute inset-x-0 bottom-0 z-10 px-8 pb-20 md:px-20 md:pb-28">
        <AnimatePresence mode="wait">
          {captionVisible && (
            <motion.div
              key={chapter.index}
              className="max-w-3xl"
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <p className="mb-4 text-[10px] md:text-xs tracking-[0.5em] uppercase text-[color:var(--accent-warm)]/80 font-light">
                {chapter.eyebrow}
              </p>
              <h2 className="font-playfair text-3xl md:text-5xl font-light text-white/92 leading-[1.15] mb-5">
                {chapter.headline}
              </h2>
              <p className="text-base md:text-lg text-white/60 font-light max-w-xl">
                {chapter.body}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
