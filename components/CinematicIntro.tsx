"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { Library, ArrowUpRight } from "lucide-react";
import {
  scrollProgress,
  lenisRef,
  galleryCaptureControl,
  acquireScrollLock,
  releaseScrollLock,
  introRevealControl,
} from "./store";

const CosmicCanvas = dynamic(() => import("./CosmicCanvas"), { ssr: false });

// CosmicCanvas's own star-blast resolves into a calm resting field by its
// internal progress ~0.45 (see CosmicCanvas.tsx). Scaling our 0-1 reveal
// progress into that range means the reveal can take however long feels
// right while always finishing on the same settled, calm frame. This had
// drifted to 0.15 — well short of 0.45 — which meant the reveal tween
// finished (and stopped updating scrollProgress.value) while the burst of
// 3600 explosion particles were still ~83% of the way through their
// outward flight and fully opaque; since CosmicCanvas keeps rendering every
// frame forever afterward, that mid-flight burst stayed frozen in place
// indefinitely instead of ever fading into the calm resting field — visible
// through the hero photo's own transparent sky (verified: its alpha
// channel isn't uniformly opaque, since the sky is meant to reveal
// whatever cosmic backdrop sits behind it).
const BLAST_SETTLE_P = 0.45;
const REVEAL_DURATION = 2.0; // seconds, click -> fully settled

// The hero photo + text fade in over the back half of the reveal, once the
// star blast has mostly finished exploding outward — so the blast gets to
// play out mostly unobstructed before the (now opaque, full-bleed) photo
// settles in on top of it, finishing exactly as the blast reaches its calm
// resting frame.
const HERO_FADE_START = REVEAL_DURATION * 0.55;
const HERO_FADE_DURATION = REVEAL_DURATION * 0.45;

// Full heading text split into lines for the typewriter
const HEADING_LINES = ["Intelligence Like", "Never Before In", "Your Hands"];
const HEADING_FULL = HEADING_LINES.join("\n");

// Each hero photo's own native pixel size — needed (not phone-specific) to
// remap the star field's fractional-image coordinates through the same
// object-fit: cover crop math the browser applies, so stars stay pinned to
// the actual sky rather than drifting at other viewport aspect ratios (see
// mapCoverPoint below).
const HERO_IMAGE_SIZE = {
  desktop: { imgW: 1536, imgH: 1024 },
  mobile: { imgW: 853, imgH: 1844 },
};

// object-fit: cover scales the image up until it fully covers the
// container, then crops the overflow equally from both edges of whichever
// axis overflows. Any fixed point measured as a fraction of the IMAGE
// needs this same remapping to land on the right spot as a fraction of the
// CONTAINER — otherwise it drifts off the photo's actual content the
// moment the viewport's aspect ratio differs from the image's, since cover
// crops a different slice each time.
function mapCoverPoint(containerW: number, containerH: number, imgW: number, imgH: number, fx: number, fy: number) {
  const scale = Math.max(containerW / imgW, containerH / imgH);
  const offsetX = (imgW * scale - containerW) / 2;
  const offsetY = (imgH * scale - containerH) / 2;
  return {
    x: (fx * imgW * scale - offsetX) / containerW,
    y: (fy * imgH * scale - offsetY) / containerH,
  };
}

function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cosmos — a scattered starfield twinkling on top of the photo's own sky,
// confined to a region (SkyBounds) and steering clear of the wizard's
// silhouette (ExclusionBox) so none land on his cloak/staff — both measured
// directly on the source photos as fractions of the image itself, same as
// the sky/figure boundaries in the art. Generated (not extracted from real
// pixels) since unlike a skyline's own window lights, there's nothing in
// the photo's sky worth revealing — this paints new twinkling light on top
// of it instead.
type SkyBounds = { xMin: number; xMax: number; yMin: number; yMax: number };
type ExclusionBox = { x1: number; y1: number; x2: number; y2: number };
type Star = { x: number; y: number; size: number; duration: number; delay: number };

function toStars(rand: () => number, count: number, sky: SkyBounds, exclude: ExclusionBox): Star[] {
  const stars: Star[] = [];
  let guard = 0;
  while (stars.length < count && guard < count * 25) {
    guard++;
    const x = sky.xMin + rand() * (sky.xMax - sky.xMin);
    const y = sky.yMin + rand() * (sky.yMax - sky.yMin);
    if (x > exclude.x1 && x < exclude.x2 && y > exclude.y1 && y < exclude.y2) continue;
    stars.push({ x, y, size: 1 + rand() * 1.6, duration: 2.6 + rand() * 3.4, delay: rand() * 6 });
  }
  return stars;
}

// Wizard's own bounding box (staff + cloak), padded slightly — found by
// probing the actual photos. Desktop: the figure stands right-of-center
// with open sky on both sides. Mobile: he stands on a cliff edge that fills
// most of the right/lower frame, leaving open sky mainly to the left and a
// narrow band above his head.
const DESKTOP_SKY: SkyBounds = { xMin: 0.02, xMax: 0.98, yMin: 0.02, yMax: 0.66 };
const DESKTOP_WIZARD_BOX: ExclusionBox = { x1: 0.5, y1: 0.12, x2: 0.87, y2: 1 };
const MOBILE_SKY: SkyBounds = { xMin: 0.02, xMax: 0.98, yMin: 0.02, yMax: 0.62 };
const MOBILE_WIZARD_BOX: ExclusionBox = { x1: 0.4, y1: 0.1, x2: 1, y2: 1 };

const DESKTOP_STARS = toStars(mulberry32(2718), 110, DESKTOP_SKY, DESKTOP_WIZARD_BOX);
const MOBILE_STARS = toStars(mulberry32(9001), 70, MOBILE_SKY, MOBILE_WIZARD_BOX);

export default function CinematicIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const hasPlayedRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [typedText, setTypedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Star positions, remapped through the same object-fit: cover math the
  // browser applies to the backdrop (see mapCoverPoint) — without this
  // they're plotted as if the raw photo fraction were a container
  // fraction, which only lines up by coincidence and otherwise drifts at
  // other viewport aspect ratios.
  const [desktopStarPos, setDesktopStarPos] = useState<{ x: number; y: number }[]>(
    () => DESKTOP_STARS.map((s) => ({ x: s.x, y: s.y }))
  );
  const [mobileStarPos, setMobileStarPos] = useState<{ x: number; y: number }[]>(
    () => MOBILE_STARS.map((s) => ({ x: s.x, y: s.y }))
  );

  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;
    const recompute = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      setDesktopStarPos(
        DESKTOP_STARS.map((s) => mapCoverPoint(width, height, HERO_IMAGE_SIZE.desktop.imgW, HERO_IMAGE_SIZE.desktop.imgH, s.x, s.y))
      );
      setMobileStarPos(
        MOBILE_STARS.map((s) => mapCoverPoint(width, height, HERO_IMAGE_SIZE.mobile.imgW, HERO_IMAGE_SIZE.mobile.imgH, s.x, s.y))
      );
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function goTo(target: string) {
    galleryCaptureControl.release?.(target === "#story-gallery" ? 0 : 1600);
    lenisRef.current?.scrollTo(target, { duration: 1.4 });
  }

  // The WebGL scene is expensive to keep rendering forever — pause its render
  // loop once the section scrolls out of view (it's the biggest lag source
  // once the user is deep into the story chapters below).
  const [inView, setInView] = useState(true);
  // Also don't start rendering frames until the click reveal actually fires.
  // cosmic-intro is the very first section, so `inView` is already true on
  // initial mount, before the user has clicked anything — without this, the
  // WebGL scene (6000-star field, camera rig, fog) renders every frame the
  // entire time WelcomeOverlay's own typewriter is running on top of it
  // (WelcomeOverlay is opaque, so none of this is even visible yet), which
  // was competing with that typewriter's setInterval ticks for main-thread
  // time and made the "Welcome to Noorva" text visibly stutter/lag.
  const [revealStarted, setRevealStarted] = useState(false);

  // Mounting CosmicCanvas at all — separate from frameloop above — pays a
  // real one-time cost: dynamically importing Three.js/R3F, creating the
  // WebGL context, and compiling every material's shaders (confirmed via
  // CPU profiling: getProgramInfoLog/texSubImage2D during this mount was
  // the single largest source of main-thread time on page load, over 1s of
  // it). That cost lands in whatever main-thread turn the mount happens to
  // run in — if that's the same turn as WelcomeOverlay's own typewriter
  // re-renders, the two visibly collide and the letter-by-letter reveal
  // stutters even though the canvas itself is still invisible underneath
  // it. requestIdleCallback is NOT a reliable way to defer past that
  // window: it fires during idle *gaps*, and the typewriter itself is
  // bursty (idle between each ~85ms tick), so idle callback can fire almost
  // immediately and still land mid-typing. A fixed delay comfortably past
  // WelcomeOverlay's own typing duration (19 chars * 85ms ≈ 1.6s) is what
  // actually guarantees no overlap.
  const [canvasMounted, setCanvasMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCanvasMounted(true), 2200);
    return () => clearTimeout(t);
  }, []);

  // Once the blast has faded to its calm resting frame (see
  // BLAST_SETTLE_P), everything CosmicCanvas draws is at opacity 0 — so
  // continuing frameloop="always" forever after just re-renders an
  // invisible scene every frame for no reason. useLiveProgress's own
  // exponential smoothing needs a little real time to catch up to the
  // frozen target after the tween ends, hence the extra buffer past
  // REVEAL_DURATION before actually pausing it.
  const [canvasSettled, setCanvasSettled] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The intro is a fixed gate, not a scrollable section — nothing below it
  // should be reachable until the click reveal has actually played out.
  useEffect(() => {
    acquireScrollLock("cosmic-intro");
    return () => releaseScrollLock("cosmic-intro");
  }, []);

  useEffect(() => {
    // Built paused — a click anywhere on the intro plays it once, driving
    // the CosmicCanvas star-blast via the shared scrollProgress store value
    // (CosmicCanvas is agnostic to what feeds that value — it used to be
    // scroll position, now it's this click-triggered tween).
    const tl = gsap.timeline({ paused: true });
    tlRef.current = tl;

    tl.to(
      { v: 0 },
      {
        v: 1,
        duration: REVEAL_DURATION,
        ease: "power1.out",
        onUpdate: function () {
          scrollProgress.value = this.targets()[0].v * BLAST_SETTLE_P;
        },
      },
      0
    );

    tl.fromTo(
      "#ci-reveal",
      { opacity: 0, filter: "blur(16px)" },
      { opacity: 1, filter: "blur(0px)", duration: HERO_FADE_DURATION, ease: "power2.out" },
      HERO_FADE_START
    );

    return () => {
      tl.kill();
    };
  }, []);

  const startTyping = useCallback(() => {
    let i = 0;
    const type = () => {
      i++;
      setTypedText(HEADING_FULL.slice(0, i));
      if (i < HEADING_FULL.length) {
        // Slightly slower on spaces/newlines for a natural rhythm
        const ch = HEADING_FULL[i - 1];
        const delay = ch === " " || ch === "\n" ? 60 : 38;
        typingRef.current = setTimeout(type, delay);
      } else {
        setTypingDone(true);
      }
    };
    typingRef.current = setTimeout(type, 0);
  }, []);

  const handleReveal = useCallback(() => {
    if (hasPlayedRef.current) return;
    hasPlayedRef.current = true;
    // Guarantees the canvas is mounted by the time this plays even if the
    // user clicks before the idle-deferred mount above has fired on its own.
    setCanvasMounted(true);
    setRevealStarted(true);
    gsap.to("#ci-click-hint", { opacity: 0, duration: 0.3 });
    tlRef.current?.eventCallback("onComplete", () => {
      releaseScrollLock("cosmic-intro");
      startTyping();
      setTimeout(() => setCanvasSettled(true), 1000);
    });
    tlRef.current?.play();
  }, [startTyping]);

  // Cleanup typing timer on unmount
  useEffect(() => () => { if (typingRef.current) clearTimeout(typingRef.current); }, []);

  // Let WelcomeOverlay trigger this same reveal from its own dismiss click,
  // so the reveal starts immediately instead of needing a second click.
  useEffect(() => {
    introRevealControl.play = handleReveal;
    return () => {
      introRevealControl.play = null;
    };
  }, [handleReveal]);

  return (
    <section
      id="cosmic-intro"
      ref={containerRef}
      onClick={handleReveal}
      className="relative w-full h-screen overflow-hidden cursor-pointer"
      style={{ zIndex: 30 }}
    >
      <div className="absolute inset-0 overflow-hidden">
        {canvasMounted && <CosmicCanvas frameloop={inView && revealStarted && !canvasSettled ? "always" : "never"} />}

        {/* Click hint — outside the reveal wrapper below since it's what's
            visible BEFORE the reveal, and fades out on its own on click. */}
        <div
          id="ci-click-hint"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 pointer-events-none"
          style={{ opacity: 1 }}
        >
          <span className="text-[10px] tracking-[0.44em] uppercase text-white/35 font-light">
            Click anywhere to begin
          </span>
          <div className="h-2 w-2 rounded-full border border-white/40 animate-ping" />
        </div>

        {/* Backdrop + text fade in together on click, then hold as the
            page's static landing. */}
        <div id="ci-reveal" ref={revealRef} className="absolute inset-0" style={{ opacity: 0, filter: "blur(16px)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero_section_desktop.png"
            alt="A robed figure with a staff standing atop a mountain, gazing out at a starry cosmic sky over a sunset horizon"
            className="hidden h-full w-full object-cover md:block"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero_section_mobile.png"
            alt="A robed figure with a staff standing atop a mountain, gazing out at a starry cosmic sky over a sunset horizon"
            className="block h-full w-full object-cover md:hidden"
          />

          {/* Cosmos — a scattered starfield twinkling on top of the photo's
              own sky (see toStars above for how it's kept off the wizard's
              silhouette); each star gets its own soft glow and randomized
              twinkle duration/delay so the sky reads as alive rather than a
              static overlay. */}
          <div className="absolute inset-0 z-[1] hidden overflow-hidden pointer-events-none md:block">
            {DESKTOP_STARS.map((s, i) => (
              <span
                key={i}
                className="hero-star"
                style={{
                  left: `${(desktopStarPos[i]?.x ?? s.x) * 100}%`,
                  top: `${(desktopStarPos[i]?.y ?? s.y) * 100}%`,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  animationDuration: `${s.duration}s`,
                  animationDelay: `${s.delay}s`,
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0 z-[1] block overflow-hidden pointer-events-none md:hidden">
            {MOBILE_STARS.map((s, i) => (
              <span
                key={i}
                className="hero-star"
                style={{
                  left: `${(mobileStarPos[i]?.x ?? s.x) * 100}%`,
                  top: `${(mobileStarPos[i]?.y ?? s.y) * 100}%`,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  animationDuration: `${s.duration}s`,
                  animationDelay: `${s.delay}s`,
                }}
              />
            ))}
          </div>
          <style>{`
            /* A soft glowing point painted onto the photo's own open sky —
               reads as a distant star rather than a drawn-on circle thanks
               to the radial-gradient glow (vs. a flat dot) and the
               randomized twinkle timing per star. */
            .hero-star {
              position: absolute;
              border-radius: 50%;
              transform: translate(-50%, -50%);
              background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(200,215,255,0.55) 45%, rgba(200,215,255,0) 75%);
              animation-name: hero-star-twinkle;
              animation-timing-function: ease-in-out;
              animation-iteration-count: infinite;
              will-change: opacity, transform;
            }
            @keyframes hero-star-twinkle {
              0%, 100% { opacity: 0.25; transform: translate(-50%, -50%) scale(0.85); }
              50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
            }
          `}</style>

          {/* Text overlay — bottom-anchored and centered on mobile (the
              mobile crop's own empty space sits below the crowd), left-
              anchored and vertically centered on desktop (the desktop
              crop's empty space is to the phone's left). */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-end px-6 pb-36 pointer-events-none md:items-start md:justify-center md:px-0 md:pb-0 md:pl-14 lg:pl-24">
            <div id="ci-text-1" className="flex flex-col items-center gap-9 text-center md:items-start md:text-left">
              <p
                className="max-w-md text-3xl font-bold tracking-[0.1em] uppercase md:max-w-xl md:text-5xl lg:max-w-2xl lg:text-6xl whitespace-pre-line"
                style={{
                  // Just the lead-in of the heading stays plain white; the
                  // rest shifts into the Noorva logo's own blue -> pink ->
                  // violet, so the brand colors read as the line "arriving"
                  // rather than tinting the whole heading uniformly.
                  backgroundImage: "linear-gradient(135deg, #ffffff 0%, #ffffff 28%, var(--accent-2) 48%, #db45d7 72%, var(--accent-1) 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                }}
              >
                {typedText || ""}
                {!typingDone && (
                  <span
                    style={{
                      display: "inline-block",
                      width: "2px",
                      marginLeft: "2px",
                      background: "#ffffff",
                      animation: "ci-blink 0.75s step-end infinite",
                      verticalAlign: "middle",
                      height: "0.85em",
                    }}
                  />
                )}
              </p>
              <style>{`
                @keyframes ci-blink {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0; }
                }
              `}</style>

              <div className="pointer-events-auto flex flex-col items-center gap-4 sm:flex-row md:items-start md:justify-start">
                <button
                  onClick={() => goTo("#story-gallery")}
                  className="group relative shrink-0 rounded-full p-[1.5px] transition-transform duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #3965e5, #7c5cfc, #db45d7)",
                    boxShadow: "0 0 28px rgba(124,92,252,0.4)",
                  }}
                >
                  <span className="btn-glow flex items-center gap-2 rounded-full bg-black/85 px-6 py-3 text-[12px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-xl transition-colors duration-300 group-hover:bg-black/70 sm:px-7 sm:py-3 sm:text-[11px] sm:tracking-[0.28em] sm:gap-2">
                    <Library className="h-4 w-4 sm:h-4 sm:w-4" strokeWidth={1.75} />
                    Noorva Book
                  </span>
                </button>

                <button
                  onClick={() => goTo("#closing")}
                  className="group relative shrink-0 rounded-full p-[1.5px] transition-transform duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #e8b478, #db45d7, #7c5cfc)",
                    boxShadow: "0 0 28px rgba(232,180,120,0.4)",
                  }}
                >
                  <span
                    className="btn-glow flex items-center gap-2 rounded-full bg-black/85 px-6 py-3 text-[12px] font-semibold tracking-[0.24em] uppercase backdrop-blur-xl transition-colors duration-300 group-hover:bg-black/70 sm:px-7 sm:py-3 sm:text-[11px] sm:tracking-[0.28em] sm:gap-2"
                    style={{ color: "var(--accent-warm)" }}
                  >
                    <ArrowUpRight className="h-4 w-4 sm:h-4 sm:w-4" strokeWidth={1.75} />
                    Join Noorva
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
