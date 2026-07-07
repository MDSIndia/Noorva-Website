"use client";

import { useRef, useState } from "react";
import { lenisRef, galleryCaptureControl } from "../store";
import Phone3D from "./Phone3D";
import FeatureContent from "./FeatureContent";
import { useFeatureAnimation } from "./useFeatureAnimation";
import { FEATURES } from "./featuresData";

function goToClosing() {
  galleryCaptureControl.release?.(1600);
  lenisRef.current?.scrollTo("#closing", { duration: 1.4 });
}

export default function FeatureShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const phoneRef = useRef<HTMLDivElement | null>(null);
  const screenWrapRef = useRef<HTMLDivElement | null>(null);
  const screensRef = useRef<(HTMLDivElement | null)[]>([]);
  const contentsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [activeFeature, setActiveFeature] = useState(0);

  useFeatureAnimation(
    { sectionRef, phoneRef, screenWrapRef, screenRefs: screensRef, contentRefs: contentsRef },
    setActiveFeature,
    true
  );

  const leftFeatures = FEATURES.map((f, i) => ({ f, i })).filter(({ f }) => f.textSide === "left");
  const rightFeatures = FEATURES.map((f, i) => ({ f, i })).filter(({ f }) => f.textSide === "right");
  const activeAccent = FEATURES[activeFeature].accent;

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      id="features"
      className="relative h-screen w-full overflow-hidden bg-[color:var(--bg)]/70"
      style={{ zIndex: 28 }}
    >
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2">
        <div className="h-full w-full rounded-full bg-[color:var(--accent-1)]/8 blur-[140px] animate-float-slow" />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center justify-between px-8 lg:px-12">
        <div className="relative hidden h-[320px] w-full max-w-sm md:block">
          {leftFeatures.map(({ f, i }) => (
            <FeatureContent
              key={f.title}
              icon={f.icon}
              title={f.title}
              body={f.body}
              side={f.textSide}
              onCta={goToClosing}
              ref={(el) => {
                contentsRef.current[i] = el;
              }}
            />
          ))}
        </div>

        <Phone3D
          ref={phoneRef}
          glowColor={activeAccent}
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          screenWrapRef={screenWrapRef}
        >
          {FEATURES.map(({ Screen, title }, i) => (
            <Screen
              key={title}
              ref={(el: HTMLDivElement | null) => {
                screensRef.current[i] = el;
              }}
              active={activeFeature === i}
            />
          ))}
        </Phone3D>

        <div className="relative hidden h-[320px] w-full max-w-sm md:block">
          {rightFeatures.map(({ f, i }) => (
            <FeatureContent
              key={f.title}
              icon={f.icon}
              title={f.title}
              body={f.body}
              side={f.textSide}
              onCta={goToClosing}
              ref={(el) => {
                contentsRef.current[i] = el;
              }}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5">
        {FEATURES.map((_, i) => (
          <span
            key={i}
            className="h-[3px] rounded-full transition-all duration-500"
            style={{
              width: activeFeature === i ? 28 : 14,
              background: activeFeature === i ? "var(--accent-warm)" : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>
    </section>
  );
}
