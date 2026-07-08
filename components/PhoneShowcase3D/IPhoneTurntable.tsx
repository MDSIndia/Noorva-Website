"use client";

import { useEffect, useRef } from "react";
import { phoneShowRotation } from "../store";

// Pre-rendered 360deg turntable of a real iPhone — 71 studio-lit frames
// (f00 = face-on, f35 = side profile, f70 = back, looping seamlessly back to
// f00) — instead of a hand-built Three.js mesh trying to fake titanium/glass.
const FRAME_COUNT = 71;
const FRAME_SRCS = Array.from(
  { length: FRAME_COUNT },
  (_, i) => `/images/iphone-turntable/f${String(i).padStart(2, "0")}.webp`
);

interface IPhoneTurntableProps {
  accent: string;
  activeIndex: number;
}

export default function IPhoneTurntable({ accent, activeIndex }: IPhoneTurntableProps) {
  const frameRefs = useRef<(HTMLImageElement | null)[]>([]);
  const shownIndex = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Reads the shared, per-scroll-tick rotation value directly (rather than
  // through React state) and swaps which pre-loaded frame is visible — same
  // "avoid re-rendering on every scrub frame" approach the old useFrame loop
  // used, just driven by rAF instead of R3F's render loop. Runs for the
  // component's whole mounted lifetime — swapping an opacity between two
  // pre-loaded <img>s is cheap enough that gating it on visibility isn't
  // worth the complexity.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const deg = ((phoneShowRotation.value % 360) + 360) % 360;
      const idx = Math.round((deg / 360) * (FRAME_COUNT - 1)) % (FRAME_COUNT - 1);
      if (idx !== shownIndex.current) {
        const prev = frameRefs.current[shownIndex.current];
        const next = frameRefs.current[idx];
        if (prev) prev.style.opacity = "0";
        if (next) next.style.opacity = "1";
        shownIndex.current = idx;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // A quick decaying scale punch whenever the active feature changes,
  // mirroring the old model's pulse() — restarted by keying the animation
  // off activeIndex instead of an imperative ref.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.classList.remove("phone-turntable-pulse");
    void el.offsetWidth; // restart the CSS animation
    el.classList.add("phone-turntable-pulse");
  }, [activeIndex]);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="pointer-events-none absolute h-[70%] w-[70%] rounded-full opacity-60 blur-[90px] transition-colors duration-700"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
      />
      <div
        ref={wrapRef}
        className="phone-turntable-float relative h-full max-h-[640px] w-full max-w-[360px]"
      >
        {FRAME_SRCS.map((src, i) => (
          <img
            key={src}
            ref={(el) => {
              frameRefs.current[i] = el;
            }}
            src={src}
            alt={i === 0 ? "Noorva running on an iPhone" : ""}
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-contain"
            style={{
              opacity: i === 0 ? 1 : 0,
              filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.55))",
            }}
          />
        ))}
      </div>
    </div>
  );
}
