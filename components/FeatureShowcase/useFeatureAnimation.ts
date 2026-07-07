"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ROTATION_FRAMES, ROTATION_FRAME_COUNT } from "./rotationFrames";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// `useEffect` cleanups for an unmounting component run *after* React has
// already committed its own DOM deletions — too late to matter here, since
// FeaturesSection conditionally unmounts this whole section when the
// viewport crosses the mobile breakpoint. ScrollTrigger's pin has by then
// reparented the section into a pin-spacer React doesn't know about, so
// React's deletion (`parent.removeChild(section)`) throws because the
// section's real parent is no longer the one React recorded. `useLayoutEffect`
// cleanup runs synchronously *before* that deletion commit, so `ctx.revert()`
// un-pins and restores the section to its original parent first.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface ShowcaseRefs {
  sectionRef: RefObject<HTMLElement | null>;
  phoneRef: RefObject<HTMLDivElement | null>;
  screenWrapRef: RefObject<HTMLDivElement | null>;
  screenRefs: RefObject<(HTMLDivElement | null)[]>;
  contentRefs: RefObject<(HTMLDivElement | null)[]>;
}

// Horizontal rest position per stop — alternates right/left/right/left so the
// phone always settles on the side opposite its section's text column.
const X_OFFSET = 300;
const PHONE_X = [X_OFFSET, -X_OFFSET, X_OFFSET, -X_OFFSET];

// Mid-flight pose: the phone dips further down the page and shrinks slightly
// while crossing — translate3d/scale only, never top/left, so the crossing
// reads as a real device floating diagonally through space rather than a
// linear slide. The turn itself is real: `applyRotationFrame` below swaps the
// chrome's background image through frames lifted from the source SVG's own
// turntable render, which reads as a genuine perspective rotation instead of
// the flat skew a CSS rotateY() on a single frontal image would produce.
const DIP_Y = 96;
const FLY_SCALE = 0.85;
const LAST_FRAME = ROTATION_FRAME_COUNT - 1;

// Fractions of total scroll progress (0-1). Four holds (one per feature) and
// three transitions between them, summing to exactly 1 — a zero-duration
// anchor tween pinned at position 1 (below) locks the timeline's total
// duration to 1 so these fractions map 1:1 onto scroll progress under
// `scrub`, regardless of the tweens' own shorter natural span.
const HOLD = 0.16;
const TRANS = 0.12;
const HOLD_RANGES: [number, number][] = [
  [0, HOLD],
  [HOLD + TRANS, 2 * HOLD + TRANS],
  [2 * (HOLD + TRANS), 3 * HOLD + 2 * TRANS],
  [3 * (HOLD + TRANS), 4 * HOLD + 3 * TRANS],
];
const TRANS_RANGES: [number, number][] = [
  [HOLD, HOLD + TRANS],
  [2 * HOLD + TRANS, 2 * HOLD + 2 * TRANS],
  [3 * HOLD + 2 * TRANS, 3 * HOLD + 3 * TRANS],
];
const ACTIVE_AT = HOLD_RANGES.map(([start, end]) => (start + end) / 2);

// Cinematic product-showcase reveal: one phone, one continuous pinned
// timeline (Hero -> Feature1 -> travel -> Feature2 -> travel -> ... ->
// Feature4). The phone flies between four alternating left/right rest poses
// while its screen and the section's text column crossfade in sync — never
// teleporting, never touching top/left.
export function useFeatureAnimation(
  { sectionRef, phoneRef, screenWrapRef, screenRefs, contentRefs }: ShowcaseRefs,
  onActiveChange: (index: number) => void,
  enabled: boolean
) {
  const onActiveChangeRef = useRef(onActiveChange);
  useEffect(() => {
    onActiveChangeRef.current = onActiveChange;
  });

  useIsomorphicLayoutEffect(() => {
    if (!enabled) return;
    const section = sectionRef.current;
    const phone = phoneRef.current;
    const screenWrap = screenWrapRef.current;
    const screens = screenRefs.current;
    const contents = contentRefs.current;
    if (!section || !phone || !screenWrap || screens.some((s) => !s) || contents.some((t) => !t)) return;

    let lastActive = -1;
    function setActive(i: number) {
      if (lastActive === i) return;
      lastActive = i;
      onActiveChangeRef.current(i);
    }

    // Swaps the chrome's background image to the frame matching `progress`
    // (0-1) along the turn. `outbound` sweeps frontal -> most-rotated as
    // progress climbs (leg 1); the reverse sweep back to frontal (leg 2)
    // just passes `1 - progress`.
    let lastFrameIndex = -1;
    function applyRotationFrame(progress: number) {
      const index = Math.round(progress * LAST_FRAME);
      if (index === lastFrameIndex) return;
      lastFrameIndex = index;
      phone!.style.setProperty("--phone-frame-bg", `url(${ROTATION_FRAMES[index]})`);
    }

    // Scoped so cleanup can fully revert the pin/spacer DOM mutation (not
    // just kill the tween) — plain `tl.kill()` leaves an orphaned pin-spacer
    // behind under React Strict Mode's dev-only double effect invocation.
    const ctx = gsap.context(() => {
      gsap.set(phone, { x: PHONE_X[0], y: 0, scale: 1 });
      gsap.set(screenWrap, { opacity: 1 });
      screens.forEach((el, i) => gsap.set(el, { opacity: i === 0 ? 1 : 0, scale: i === 0 ? 1 : 0.96 }));
      contents.forEach((el, i) => gsap.set(el, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 20 }));

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + window.innerHeight * 5,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to({}, { duration: 1 }, 0);

      for (let t = 0; t < 3; t++) {
        const [start, end] = TRANS_RANGES[t];
        const mid = (start + end) / 2;
        const fromIdx = t;
        const toIdx = t + 1;

        // Leg 1: settled pose -> mid-flight peak (crossing center, diving
        // down, shrinking, turning frontal -> side-on using the real
        // turntable frames).
        tl.to(
          phone,
          {
            x: 0,
            y: DIP_Y,
            scale: FLY_SCALE,
            ease: "power2.inOut",
            duration: mid - start,
            onUpdate: function () {
              applyRotationFrame(this.progress());
            },
          },
          start
        );
        // Leg 2: peak -> next settled pose (turning back to frontal, scale
        // returning to rest, opposite side, settling naturally).
        tl.to(
          phone,
          {
            x: PHONE_X[toIdx],
            y: 0,
            scale: 1,
            ease: "power2.inOut",
            duration: end - mid,
            onUpdate: function () {
              applyRotationFrame(1 - this.progress());
            },
          },
          mid
        );

        // The screen crop only lines up with the frontal frame, so the whole
        // viewport (not just its content) hides while the chrome is turned.
        tl.to(screenWrap, { opacity: 0, ease: "power2.out", duration: mid - start }, start);
        tl.to(screenWrap, { opacity: 1, ease: "power2.in", duration: end - mid }, mid);

        tl.to(screens[fromIdx]!, { opacity: 0, scale: 1.04, ease: "power2.out", duration: mid - start }, start);
        tl.to(screens[toIdx]!, { opacity: 1, scale: 1, ease: "power2.out", duration: end - mid }, mid);

        tl.to(contents[fromIdx]!, { opacity: 0, y: -20, ease: "power2.out", duration: mid - start }, start);
        tl.to(contents[toIdx]!, { opacity: 1, y: 0, ease: "power2.out", duration: end - mid }, mid);
      }

      ACTIVE_AT.forEach((at, i) => {
        tl.call(() => setActive(i), [], at);
      });
    });

    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      ctx.revert();
    };
  }, [enabled, sectionRef, phoneRef, screenWrapRef, screenRefs, contentRefs]);
}
