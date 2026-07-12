"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lenisRef as sharedLenisRef } from "./store";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Reset scroll to top and disable browser scroll restoration on refresh
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    }

    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;
    sharedLenisRef.current = lenis;
    lenis.scrollTo(0, { immediate: true });

    // Lenis virtualizes scroll position rather than using native window
    // scrolling, but ScrollTrigger's pin:true (used by PhoneShowcase3D's
    // scroll-scrubbed sequence) defaults to reading/writing native scroll —
    // without these two lines the two systems fight over scroll position
    // during a pin, producing a visible jitter/wobble in the whole page each
    // frame rather than a rock-steady pinned section. This is the standard
    // Lenis+GSAP integration (per both projects' own docs): drive Lenis from
    // GSAP's own ticker instead of a separate rAF loop (so they're always in
    // the same frame), and tell ScrollTrigger to recompute on every Lenis
    // scroll tick instead of only on native scroll events.
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      sharedLenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
