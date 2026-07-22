"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// public/features/theatre_desktop.png is a static backdrop — a crowd facing
// a big glowing screen in a neon city. On desktop, this section pins the
// viewport (same GSAP+Lenis pattern SmoothScroll.tsx sets up for the rest of
// the site) and crossfades the six persona images through *that screen's own
// rectangle* as the user scrolls.
//
// Below md, there's no theatre backdrop at all: the *_mobile.png assets are
// their own fully-designed vertical slides (title, copy, CTA, and stat cards
// baked into the pixels top-to-bottom) built for a full-bleed portrait
// crop, not a landscape screen-within-a-screen — forcing them (or the
// desktop crop) into the theatre's tiny screen rectangle just clips the
// baked-in text off the sides. So mobile crossfades the plain images
// full-viewport instead, the way this section originally worked.
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

// The screen's own black rectangle (inside its neon bezel), as a fraction
// (0-1) of the full desktop backdrop image — found by probing the actual
// pixels of the crop (sharp). Desktop-only: below md there's no theatre
// backdrop, so no screen rectangle to line up with (see the top-of-file
// comment).
const SCREEN_DESKTOP = { left: 0.2214, top: 0.2441, width: 0.5599, height: 0.4248 };
const BACKDROP_DESKTOP_ASPECT = 1536 / 1024;

/** Where the screen rectangle actually lands on screen, in pixels relative
 *  to the section. `object-cover` scales the backdrop up until it fully
 *  covers the container and crops whichever axis overflows — a plain
 *  percentage-of-container overlay only lines up with the art when the
 *  container's aspect ratio happens to match the image's own, which isn't
 *  true at most real window sizes. This redoes that same cover math by
 *  hand so the overlay can subtract out exactly the crop the browser
 *  applied to the image. */
function useScreenRect(containerRef: React.RefObject<HTMLElement | null>) {
  const [rect, setRect] = useState({ left: 0, top: 0, width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function update() {
      if (!el) return;
      const { width: cw, height: ch } = el.getBoundingClientRect();
      if (cw === 0 || ch === 0) return;
      const imgAspect = BACKDROP_DESKTOP_ASPECT;
      const screen = SCREEN_DESKTOP;
      const containerAspect = cw / ch;

      let renderedW: number, renderedH: number, offsetX: number, offsetY: number;
      if (containerAspect > imgAspect) {
        // Container is relatively wider than the image — cover-scaling by
        // width fills it exactly, so the image overflows (and gets
        // cropped) top/bottom.
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

      setRect({
        left: screen.left * renderedW - offsetX,
        top: screen.top * renderedH - offsetY,
        width: screen.width * renderedW,
        height: screen.height * renderedH,
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

  return rect;
}

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
  const screenRect = useScreenRect(sectionRef);

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
      {/* Desktop: static theatre backdrop */}
      <Image
        src="/features/theatre_desktop.png"
        alt="A crowd facing a glowing screen in a neon city"
        fill
        priority
        className="hidden object-cover md:block"
        sizes="100vw"
      />

      {/* Desktop: the screen's own rectangle — positioned in pixels from
          useScreenRect, which redoes the backdrop's object-cover crop math
          by hand so this lines up with the art at any viewport size (see
          that hook's own comment for why plain percentages don't). */}
      <div
        className="absolute hidden overflow-hidden md:block"
        style={{
          left: screenRect.left,
          top: screenRect.top,
          width: screenRect.width,
          height: screenRect.height,
        }}
      >
        {FEATURES.map((feature, i) => {
          const p = presence(i, progress);
          // Skip mounting fully-hidden slides — with all six stacked at
          // inset-0, next/image would otherwise treat every one of them as
          // "in viewport" and eagerly load all 6 assets at once regardless
          // of which is actually showing.
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
                className="h-full w-full object-cover"
                sizes="60vw"
              />
            </div>
          );
        })}
      </div>

      {/* Mobile: no theatre backdrop — the *_mobile.png assets are their
          own full-bleed vertical slides, so they crossfade edge-to-edge
          instead of being cropped into a landscape screen rectangle. */}
      <div className="absolute inset-0 md:hidden">
        {FEATURES.map((feature, i) => {
          const p = presence(i, progress);
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
                src={feature.mobileSrc}
                alt={`Noorva as ${feature.label}`}
                width={feature.mobileWidth}
                height={feature.mobileHeight}
                priority={i === 0}
                className="h-full w-full object-cover"
                sizes="100vw"
              />
            </div>
          );
        })}
      </div>

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
