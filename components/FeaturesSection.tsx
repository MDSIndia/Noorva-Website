"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// public/features/theatre_desktop.png (theatre_phone.png below md) is a
// static backdrop — a crowd facing a big glowing screen in a neon city.
// This section pins the viewport (same GSAP+Lenis pattern SmoothScroll.tsx
// sets up for the rest of the site) and crossfades the six persona images
// through *that screen's own rectangle* as the user scrolls, rather than
// swapping the whole viewport like the previous version did.
interface Feature {
  id: string;
  label: string;
  src: string;
  width: number;
  height: number;
}

const FEATURES: Feature[] = [
  { id: "guide", label: "Guide", src: "/features/guide_desktop.png", width: 1672, height: 941 },
  { id: "mentor", label: "Mentor", src: "/features/mentor_desktop.png", width: 1719, height: 915 },
  { id: "teacher", label: "Teacher", src: "/features/teacher_desktop.png", width: 1672, height: 941 },
  { id: "strategist", label: "Strategist", src: "/features/strategist_desktop.png", width: 1672, height: 941 },
  { id: "designer", label: "Designer", src: "/features/designer_desktop.png", width: 1672, height: 941 },
  { id: "companion", label: "Companion", src: "/features/companion_desktop.png", width: 1672, height: 941 },
];

// The screen's own black rectangle (inside its neon bezel), as a fraction
// (0-1) of the full backdrop image — found by probing the actual pixels of
// each crop (sharp). The desktop and phone backdrops frame the screen at
// different sizes/positions, not just different aspect ratios, so both are
// needed rather than one set of numbers reused across breakpoints.
const SCREEN_DESKTOP = { left: 0.2214, top: 0.2441, width: 0.5599, height: 0.4248 };
const SCREEN_PHONE = { left: 0.1231, top: 0.3525, width: 0.7503, height: 0.2251 };
const BACKDROP_DESKTOP_ASPECT = 1536 / 1024;
const BACKDROP_PHONE_ASPECT = 853 / 1844;
const MD_BREAKPOINT = 768; // matches the md: Tailwind breakpoint used below

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
      const isDesktop = window.innerWidth >= MD_BREAKPOINT;
      const imgAspect = isDesktop ? BACKDROP_DESKTOP_ASPECT : BACKDROP_PHONE_ASPECT;
      const screen = isDesktop ? SCREEN_DESKTOP : SCREEN_PHONE;
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

// How far (as a % of the screen rect's own width) each persona slides per
// full step of progress — the "passing scenery" drift on the crossfade
// below. Large enough that a slide is clearly still under way once a
// neighbor's dwell fades it to invisible, not just a crossfade with a
// barely-perceptible nudge.
const JOURNEY_DRIFT_PCT = 45;

// Pixel geometry of the journey-progress track below, kept as constants
// (not measured) since the traveling marker needs to land on the same
// pitch as the dots at every scroll position, not just resync on resize —
// matches the track's own w-7 (28px) + gap-2 (8px) Tailwind classes.
const JOURNEY_DOT_WIDTH_PX = 28;
const JOURNEY_DOT_GAP_PX = 8;
const JOURNEY_DOT_PITCH_PX = JOURNEY_DOT_WIDTH_PX + JOURNEY_DOT_GAP_PX;

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
      {/* Static backdrop */}
      <Image
        src="/features/theatre_desktop.png"
        alt="A crowd facing a glowing screen in a neon city"
        fill
        priority
        className="hidden object-cover md:block"
        sizes="100vw"
      />
      <Image
        src="/features/theatre_phone.png"
        alt="A crowd facing a glowing screen in a neon city"
        fill
        priority
        className="block object-cover md:hidden"
        sizes="100vw"
      />

      {/* The screen's own rectangle — positioned in pixels from
          useScreenRect, which redoes the backdrop's object-cover crop math
          by hand so this lines up with the art at any viewport size (see
          that hook's own comment for why plain percentages don't). */}
      <div
        className="absolute overflow-hidden"
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
          // Each persona slides in from one side and out the other as its
          // own dwell window passes — rather than just crossfading in
          // place, this reads as scenery going by on a route stop-to-stop,
          // not a static slideshow. The screen rect's own overflow-hidden
          // clips it at the bezel, so the slide never escapes the "screen".
          // A slight vertical dip + tilt rides along with the horizontal
          // drift — a pure translateX reads as a flat slide; adding the
          // other two axes (both settling back to 0 at rest, same as the
          // scale/blur already did) sells it as something drifting past
          // in three dimensions, not a card on rails.
          const drift = (i - progress) * JOURNEY_DRIFT_PCT;
          const dip = (1 - p) * 3.5;
          const tilt = (i - progress) * 1.4;
          return (
            <div
              key={feature.id}
              className="absolute inset-0"
              style={{
                opacity: p,
                zIndex: i,
                transform: `translate(${drift}%, ${dip}%) rotate(${tilt}deg) scale(${1 + (1 - p) * 0.04})`,
                filter: `blur(${(1 - p) * 6}px)`,
              }}
            >
              <Image
                src={feature.src}
                alt={`Noorva as ${feature.label}`}
                width={feature.width}
                height={feature.height}
                priority={i === 0}
                className="h-full w-full object-contain"
                sizes="60vw"
              />
            </div>
          );
        })}
      </div>

      {/* Journey progress — a connected path (not just isolated dots) with
          a glowing marker that travels smoothly along it as the pinned
          scroll advances, plus the current stop's own name crossfading in
          step with the persona itself (same presence() curve as the main
          crossfade above, not a separate re-derived one). Housed in its own
          frosted pill so it reads as one HUD element sitting on top of the
          scene, not loose text and dots floating over the art. */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 rounded-full border border-white/10 bg-black/30 px-6 py-3 backdrop-blur-md">
        <div className="relative hidden h-4 w-48 md:block">
          {FEATURES.map((feature, i) => {
            const p = presence(i, progress);
            return (
              <span
                key={feature.id}
                className="absolute inset-0 flex items-center justify-center text-center text-[10px] font-medium tracking-[0.2em] whitespace-nowrap text-white uppercase"
                style={{ opacity: p, transform: `translateY(${(1 - p) * 8}px)` }}
              >
                {feature.label}
              </span>
            );
          })}
        </div>
        <div className="relative flex gap-2">
          {FEATURES.map((feature, i) => (
            <span key={feature.id} className="h-[3px] w-7 overflow-hidden rounded-full bg-white/15">
              {/* The lit portion of each dot is a slice of one continuous
                  brand-color gradient (not a flat white fill) — its own
                  background-position shifts per dot so the color reads as
                  one road running under the whole track, the same blue ->
                  violet -> pink already used on the CTA buttons, rather
                  than every segment independently fading white. */}
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${Math.max(0, Math.min(1, 1 - Math.abs(progress - i))) * 100}%`,
                  backgroundImage: "linear-gradient(90deg, #3965e5, #7c5cfc, #db45d7)",
                  backgroundSize: `${FEATURES.length * 100}% 100%`,
                  backgroundPosition: `${(i / (FEATURES.length - 1)) * 100}% 0`,
                  boxShadow: "0 0 6px 1px rgba(124,92,252,0.8)",
                }}
              />
            </span>
          ))}
          {/* Traveling marker — a soft comet-style glow (layered box-shadow
              standing in for a directional trail) riding the same gradient
              as the track it's crossing, plus a slow pulse so it reads as
              alive even mid-dwell when its position itself isn't moving. */}
          <div
            className="absolute top-1/2 h-2.5 w-2.5 rounded-full journey-marker"
            style={{
              left: progress * JOURNEY_DOT_PITCH_PX + JOURNEY_DOT_WIDTH_PX / 2,
              background: "radial-gradient(circle, #ffffff, var(--accent-1))",
              boxShadow:
                "0 0 8px 2px rgba(255,255,255,0.9), 0 0 16px 6px rgba(124,92,252,0.75), 0 0 28px 10px rgba(219,69,215,0.35)",
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes journey-marker-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.25); }
        }
        .journey-marker {
          animation: journey-marker-pulse 1.8s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
