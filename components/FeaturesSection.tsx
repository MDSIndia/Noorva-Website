"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Each source image (public/features/*_desktop.png, *_mobile.png) is
// already a complete, fully-designed slide — title, copy, and CTA are baked
// into the pixels. This section pins the viewport (same GSAP+Lenis pattern
// SmoothScroll.tsx sets up for the rest of the site) and crossfades through
// all six full-screen as the user scrolls, rather than adding any of our
// own caption/icon chrome on top.
interface Feature {
  id: string;
  label: string;
  desktopSrc: string;
  desktopWidth: number;
  desktopHeight: number;
  mobileSrc: string;
  mobileWidth: number;
  mobileHeight: number;
}

const FEATURES: Feature[] = [
  {
    id: "guide",
    label: "Guide",
    desktopSrc: "/features/guide_desktop.png",
    desktopWidth: 1672,
    desktopHeight: 941,
    mobileSrc: "/features/guide_mobile.png",
    mobileWidth: 864,
    mobileHeight: 1821,
  },
  {
    id: "mentor",
    label: "Mentor",
    desktopSrc: "/features/mentor_desktop.png",
    desktopWidth: 1719,
    desktopHeight: 915,
    mobileSrc: "/features/mentor_mobile.png",
    mobileWidth: 864,
    mobileHeight: 1821,
  },
  {
    id: "teacher",
    label: "Teacher",
    desktopSrc: "/features/teacher_desktop.png",
    desktopWidth: 1672,
    desktopHeight: 941,
    mobileSrc: "/features/teacher_mobile.png",
    mobileWidth: 853,
    mobileHeight: 1844,
  },
  {
    id: "strategist",
    label: "Strategist",
    desktopSrc: "/features/strategist_desktop.png",
    desktopWidth: 1672,
    desktopHeight: 941,
    mobileSrc: "/features/strategist_mobile.png",
    mobileWidth: 864,
    mobileHeight: 1821,
  },
  {
    id: "designer",
    label: "Designer",
    desktopSrc: "/features/designer_desktop.png",
    desktopWidth: 1672,
    desktopHeight: 941,
    mobileSrc: "/features/designer_mobile.png",
    mobileWidth: 853,
    mobileHeight: 1844,
  },
  {
    id: "companion",
    label: "Companion",
    desktopSrc: "/features/companion_desktop.png",
    desktopWidth: 1672,
    desktopHeight: 941,
    mobileSrc: "/features/companion_mobile.png",
    mobileWidth: 864,
    mobileHeight: 1821,
  },
];

// How much scroll distance the pinned sequence consumes, in viewport
// heights, spread across the 5 hand-offs between 6 images. Tune by feel.
const PIN_VH_MULTIPLIER = 7;

// Each image gets a full-opacity "dwell" window centered on its own index
// (0, 1, 2…), and fades linearly over the gap between dwell windows — since
// neighboring images are 1 unit apart, so each one's fade ramp has to run
// all the way out to d = 1 - DWELL_HALF (not just to the 0.5 midpoint) to
// reach the point where the *next* image's own dwell begins — that makes
// the two ramps cross at exactly 50% opacity each at the midpoint, a true
// crossfade. Ending the ramp at 0.5 instead (an earlier version's bug) made
// both images hit 0 opacity simultaneously right at the midpoint — a
// visible black gap on every transition instead of an overlap.
const DWELL_HALF = 0.3;
function presence(index: number, progress: number) {
  const d = Math.abs(progress - index);
  const fadeEnd = 1 - DWELL_HALF;
  if (d <= DWELL_HALF) return 1;
  if (d >= fadeEnd) return 0;
  return 1 - (d - DWELL_HALF) / (fadeEnd - DWELL_HALF);
}

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const proxy = { p: 0 };
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + window.innerHeight * PIN_VH_MULTIPLIER,
        pin: true,
        scrub: 0.35,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    tl.to(proxy, {
      p: FEATURES.length - 1,
      duration: 1,
      ease: "none",
      onUpdate: () => setProgress(proxy.p),
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section id="features" ref={sectionRef} className="relative h-screen w-full overflow-hidden bg-black">
      {FEATURES.map((feature, i) => {
        const p = presence(i, progress);
        // Skip mounting fully-hidden slides — with all six stacked at
        // inset-0, next/image would otherwise treat every one of them as
        // "in viewport" and eagerly load all 12 desktop/mobile assets at
        // once regardless of which is actually showing.
        if (p <= 0.001 && i !== 0) return null;
        return (
          <div
            key={feature.id}
            className="absolute inset-0"
            style={{
              opacity: p,
              zIndex: i,
              transform: `scale(${1 + (1 - p) * 0.04})`,
              filter: `blur(${(1 - p) * 6}px)`,
            }}
          >
            <Image
              src={feature.desktopSrc}
              alt={`Noorva as ${feature.label}`}
              width={feature.desktopWidth}
              height={feature.desktopHeight}
              priority={i === 0}
              className="hidden h-full w-full object-cover md:block"
              sizes="100vw"
            />
            <Image
              src={feature.mobileSrc}
              alt={`Noorva as ${feature.label}`}
              width={feature.mobileWidth}
              height={feature.mobileHeight}
              priority={i === 0}
              className="block h-full w-full object-cover md:hidden"
              sizes="100vw"
            />
          </div>
        );
      })}

      {/* Scroll-progress dots — purely a "you're partway through" cue, no
          labels, so nothing competes with the baked-in text in the art. */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {FEATURES.map((feature, i) => (
          <span key={feature.id} className="h-[3px] w-7 overflow-hidden rounded-full bg-white/15">
            <span
              className="block h-full rounded-full bg-white"
              style={{ width: `${Math.max(0, 1 - Math.abs(progress - i)) * 100}%` }}
            />
          </span>
        ))}
      </div>
    </section>
  );
}
