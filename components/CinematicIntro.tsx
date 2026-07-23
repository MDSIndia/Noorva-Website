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
  storyGalleryOverlayControl,
} from "./store";

const CosmicCanvas = dynamic(() => import("./CosmicCanvas"), { ssr: false });

// CosmicCanvas's own star-blast resolves into a calm resting field by its
// internal progress ~0.45 (see CosmicCanvas.tsx). Scaling our 0-1 reveal
// progress into that range means the reveal can take however long feels
// right while always finishing on the same settled, calm frame.
const BLAST_SETTLE_P = 0.15;
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

// The phone's bounding box, measured directly on the source photos as a
// fraction of the IMAGE itself (aspect-ratio-invariant). object-fit: cover
// crops a different slice of the image depending on how the viewport's
// aspect ratio compares to the photo's, so a mask fraction calibrated
// against one window size drifts off the actual phone at any other size —
// this is why the mask must be recomputed from the real render box on
// every resize rather than hard-coded once (see useHeroPhoneMask below).
const HERO_PHONE_SOURCE = {
  desktop: { imgW: 1536, imgH: 1024, box: { x1: 0.576, y1: 0.205, x2: 0.729, y2: 0.767 } },
  mobile: { imgW: 853, imgH: 1844, box: { x1: 0.422, y1: 0.187, x2: 0.674, y2: 0.445 } },
};
// Extra breathing room around the hand-measured box, as a fraction of its
// own width/height, so small measurement error still fully encloses the
// phone and its glow bloom (better to mask a little surrounding dark sky
// than to clip the phone and leave a static sliver of it behind).
//
// The bottom edge is intentionally NOT expanded: below the phone is the
// podium it stands on — solid, detailed, and always static, and it must
// never be part of the cutout. The animation below only ever scales the
// cutout about a pivot pinned to this exact bottom edge (see
// transformOrigin) and never translates it, so that edge is mathematically
// fixed on screen at every frame — nothing here has to move to compensate,
// and no podium pixels are ever swept along with the phone.
const HERO_PHONE_MARGIN_SIDE = 0.06;
const HERO_PHONE_MARGIN_TOP = 0.06;
const HERO_PHONE_MARGIN_BOTTOM = 0;

type MaskRect = { x: number; y: number; w: number; h: number; rx: number };

// object-fit: cover scales the image up until it fully covers the
// container, then crops the overflow equally from both edges of whichever
// axis overflows. Any fixed point measured as a fraction of the IMAGE
// (a phone corner, a window) needs this same remapping to land on the
// right spot as a fraction of the CONTAINER — otherwise it drifts off the
// photo's actual content the moment the viewport's aspect ratio differs
// from the image's, since cover crops a different slice each time.
function mapCoverPoint(containerW: number, containerH: number, imgW: number, imgH: number, fx: number, fy: number) {
  const scale = Math.max(containerW / imgW, containerH / imgH);
  const offsetX = (imgW * scale - containerW) / 2;
  const offsetY = (imgH * scale - containerH) / 2;
  return {
    x: (fx * imgW * scale - offsetX) / containerW,
    y: (fy * imgH * scale - offsetY) / containerH,
  };
}

function computeMaskRect(containerW: number, containerH: number, source: { imgW: number; imgH: number; box: { x1: number; y1: number; x2: number; y2: number } }): MaskRect {
  const { imgW, imgH, box } = source;
  const bw = box.x2 - box.x1;
  const bh = box.y2 - box.y1;
  const x1 = box.x1 - bw * HERO_PHONE_MARGIN_SIDE;
  const x2 = box.x2 + bw * HERO_PHONE_MARGIN_SIDE;
  const y1 = box.y1 - bh * HERO_PHONE_MARGIN_TOP;
  const y2 = box.y2 + bh * HERO_PHONE_MARGIN_BOTTOM;

  const topLeft = mapCoverPoint(containerW, containerH, imgW, imgH, x1, y1);
  const bottomRight = mapCoverPoint(containerW, containerH, imgW, imgH, x2, y2);
  const w = bottomRight.x - topLeft.x;
  const h = bottomRight.y - topLeft.y;
  return { x: topLeft.x, y: topLeft.y, w, h, rx: Math.min(w, h) * 0.12 };
}

const FALLBACK_DESKTOP_RECT: MaskRect = { x: 0.585, y: 0.165, w: 0.142, h: 0.6, rx: 0.03 };
const FALLBACK_MOBILE_RECT: MaskRect = { x: 0.4, y: 0.13, w: 0.31, h: 0.36, rx: 0.04 };

// A handful of the backdrop photo's own building windows, made to switch
// off and back on. The photo's city already glows steadily — real window
// dots picked straight out of its pixels (see below) — so rather than
// paint new fake lights on top, each of these gets a small dark "shutter"
// that normally hides that one real window and briefly turns transparent,
// revealing the actual bright pixel underneath. That's what makes it read
// as someone inside flipping a switch instead of a sparkle effect, and why
// it stays pixel-aligned to real windows instead of floating in the sky.
//
// Coordinates were extracted (not hand-picked) by scanning both hero photos
// with a one-off script: find small connected bright blobs, then drop
// anything that's part of a much bigger bright shape (a rune panel's frame
// and glyphs, a ship, the globe), anything inside a rune panel's bounding
// box specifically (its tick marks/text are themselves small blobs), and
// anything with no other window roughly above/below it on the same facade
// (a ship's cockpit lights float alone in open sky; real windows always
// have neighbors stacked up the tower). A random subset of what's left was
// kept so only some windows ever flicker, matching how a real skyline looks.
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

type BuildingLight = { x: number; y: number; variant: number; duration: number; delay: number };

function toBuildingLights(rand: () => number, coords: [number, number][]): BuildingLight[] {
  return coords.map(([x, y]) => ({
    x,
    y,
    variant: 1 + Math.floor(rand() * 5),
    duration: 4 + rand() * 8,
    delay: rand() * 10,
  }));
}

// Fractional [x, y] coordinates of real window lights in each photo —
// extracted by scanning for small isolated bright blobs, then explicitly
// rejecting anything that's part of a rune panel, ship, the globe, the
// phone, or the podium/bridge below the buildings (see the one-off
// detection script for the full method).
const DESKTOP_WINDOW_COORDS: [number, number][] = [[0.7708,0.3057],[0.1882,0.2754],[0.8841,0.2842],[0.7793,0.3721],[0.9583,0.1416],[0.028,0.4287],[0.8587,0.3828],[0.0723,0.3652],[0.1061,0.3818],[0.972,0.2939],[0.0456,0.4365],[0.9382,0.1104],[0.0781,0.334],[0.0319,0.3848],[0.0553,0.3418],[0.0573,0.4424],[0.8776,0.3457],[0.9733,0.2324],[0.0768,0.4434],[0.2064,0.3252],[0.8763,0.2822],[0.9616,0.3379],[0.1921,0.3818],[0.0775,0.4238],[0.9707,0.2441],[0.9583,0.4014],[0.8906,0.3203],[0.069,0.3184],[0.0742,0.0234],[0.9622,0.4453],[0.1895,0.3809],[0.0384,0.1504],[0.9648,0.2197],[0.9434,0.4102],[0.2012,0.3779],[0.0775,0.3799],[0.0723,0.4043],[0.1823,0.3418],[0.0775,0.3955],[0.209,0.4336],[0.0286,0.4473],[0.9915,0.416],[0.8815,0.3955],[0.0547,0.4111],[0.1882,0.3135],[0.0716,0.4404],[0.7923,0.4482],[0.9909,0.3574],[0.2585,0.083],[0.0358,0.3555],[0.0293,0.2402],[0.8861,0.0361],[0.1868,0.3311],[0.873,0.4453],[0.9603,0.2568],[0.9727,0.3096],[0.1882,0.4355],[0.9922,0.4258],[0.9967,0.3525],[0.8945,0.3516],[0.1068,0.3564],[0.1836,0.2979],[0.2057,0.3809],[0.9414,0.4355],[0.1745,0.2959],[0.069,0.0508],[0.0384,0.3379],[0.8802,0.3174],[0.0527,0.4326],[0.929,0.1016],[0.2109,0.4404],[0.9909,0.374],[0.2174,0.4473],[0.0404,0.3672],[0.7747,0.3018],[0.1816,0.2598],[0.7786,0.1953],[0.1842,0.4141],[0.9616,0.4365],[0.1771,0.4258],[0.8835,0.2988],[0.1042,0.3184],[0.8633,0.2959],[0.0247,0.3809],[0.1087,0.3174],[0.0664,0.3486],[0.0163,0.293],[0.0599,0.4004],[0.0404,0.4346],[0.8783,0.4443],[0.0365,0.3682],[0.8607,0.4316],[0.1738,0.332],[0.9635,0.4023],[0.0508,0.3379],[0.179,0.4248],[0.8906,0.2871],[0.1842,0.4482],[0.0339,0.3398],[0.9714,0.2676]];
const MOBILE_WINDOW_COORDS: [number, number][] = [[0.9097,0.237],[0.9086,0.1231],[0.9355,0.353],[0.9215,0.1632],[0.0785,0.3004],[0.143,0.1996],[0.1794,0.3476],[0.8476,0.2467],[0.0774,0.3406],[0.1383,0.2261],[0.9379,0.3341],[0.0211,0.231],[0.9074,0.3118],[0.9015,0.346],[0.7503,0.2126],[0.0176,0.3059],[0.9226,0.2137],[0.0188,0.2533],[0.9496,0.1567],[0.0868,0.1453],[0.163,0.1931],[0.8406,0.2316],[0.1208,0.2636],[0.9168,0.365],[0.7843,0.2305],[0.8863,0.1095],[0.0668,0.3129],[0.9285,0.2148],[0.7714,0.3037],[0.2122,0.2912],[0.9086,0.1133],[0.2016,0.0895],[0.8628,0.2261],[0.0492,0.1448],[0.211,0.3476],[0.0305,0.1985],[0.0797,0.1296],[0.075,0.0846],[0.9215,0.2066],[0.9379,0.2419],[0.9601,0.2467],[0.7937,0.0287],[0.2145,0.3021],[0.8042,0.3227],[0.7526,0.3373],[0.1712,0.2451],[0.0645,0.0803],[0.0317,0.1405],[0.1524,0.1708],[0.9695,0.3281],[0.7503,0.0759],[0.075,0.1074],[0.8464,0.237],[0.0528,0.2863],[0.9578,0.2126],[0.0516,0.3617],[0.8511,0.2549],[0.9074,0.3053],[0.9226,0.1985],[0.9144,0.1551],[0.1536,0.1958],[0.1536,0.1567],[0.0516,0.3297],[0.0164,0.3216],[0.9379,0.2522]];

const DESKTOP_BUILDING_LIGHTS = toBuildingLights(mulberry32(1337), DESKTOP_WINDOW_COORDS);
const MOBILE_BUILDING_LIGHTS = toBuildingLights(mulberry32(4242), MOBILE_WINDOW_COORDS);

export default function CinematicIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const hasPlayedRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [typedText, setTypedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phoneRectDesktop, setPhoneRectDesktop] = useState<MaskRect>(FALLBACK_DESKTOP_RECT);
  const [phoneRectMobile, setPhoneRectMobile] = useState<MaskRect>(FALLBACK_MOBILE_RECT);
  // Building-light positions, remapped through the same object-fit: cover
  // math as the phone mask (see mapCoverPoint) — without this they're
  // plotted as if the raw photo fraction were a container fraction, which
  // only lines up by coincidence and otherwise drifts onto the globe,
  // podium or bridge depending on the viewport's aspect ratio.
  const [desktopLightPos, setDesktopLightPos] = useState<{ x: number; y: number }[]>(
    () => DESKTOP_WINDOW_COORDS.map(([x, y]) => ({ x, y }))
  );
  const [mobileLightPos, setMobileLightPos] = useState<{ x: number; y: number }[]>(
    () => MOBILE_WINDOW_COORDS.map(([x, y]) => ({ x, y }))
  );
  // Bumped on every recompute and baked into the mask ids below. Chromium
  // doesn't reliably repaint a CSS `mask-image: url(#id)` when the
  // referenced SVG mask's own rect attributes are mutated in place after a
  // resize — the DOM ends up with the correct new geometry, but the mask
  // visually keeps using the old one until something else forces a
  // repaint. Changing the id on every recompute makes each resize
  // reference a brand-new mask resource instead of mutating an existing
  // one, which sidesteps the stale-repaint bug entirely.
  const [maskVersion, setMaskVersion] = useState(0);

  // Keep the phone mask locked to the actual photo regardless of the
  // viewport's aspect ratio (see computeMaskRect for why this can't just be
  // a fixed percentage).
  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;
    const recompute = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      const desktopRect = computeMaskRect(width, height, HERO_PHONE_SOURCE.desktop);
      const mobileRect = computeMaskRect(width, height, HERO_PHONE_SOURCE.mobile);
      setPhoneRectDesktop(desktopRect);
      setPhoneRectMobile(mobileRect);
      setDesktopLightPos(
        DESKTOP_WINDOW_COORDS.map(([x, y]) => mapCoverPoint(width, height, HERO_PHONE_SOURCE.desktop.imgW, HERO_PHONE_SOURCE.desktop.imgH, x, y))
      );
      setMobileLightPos(
        MOBILE_WINDOW_COORDS.map(([x, y]) => mapCoverPoint(width, height, HERO_PHONE_SOURCE.mobile.imgW, HERO_PHONE_SOURCE.mobile.imgH, x, y))
      );
      setMaskVersion((v) => v + 1);
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
    gsap.to("#ci-click-hint", { opacity: 0, duration: 0.3 });
    tlRef.current?.eventCallback("onComplete", () => {
      releaseScrollLock("cosmic-intro");
      startTyping();
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
        <CosmicCanvas frameloop={inView ? "always" : "never"} />

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
          {/* Hard-edged SVG masks (not feathered CSS gradients) — a
              feathered edge shows a translucent blend band between the
              static backdrop and the floating cutout wherever they no
              longer overlap, which reads as double-exposed ghosting the
              instant the phone lifts off its rest position. A crisp cut is
              invisible here since it falls on the phone's own glowing
              edge against plain dark sky/floor.

              The rect geometry comes from state (computeMaskRect), not a
              fixed percentage, so the cut stays locked to the phone
              regardless of the viewport's aspect ratio. */}
          <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
            <defs>
              <mask id={`ci-phone-hole-desktop-${maskVersion}`} maskContentUnits="objectBoundingBox">
                <rect x="0" y="0" width="1" height="1" fill="white" />
                <rect x={phoneRectDesktop.x} y={phoneRectDesktop.y} width={phoneRectDesktop.w} height={phoneRectDesktop.h} rx={phoneRectDesktop.rx} fill="black" />
              </mask>
              <mask id={`ci-phone-show-desktop-${maskVersion}`} maskContentUnits="objectBoundingBox">
                <rect x={phoneRectDesktop.x} y={phoneRectDesktop.y} width={phoneRectDesktop.w} height={phoneRectDesktop.h} rx={phoneRectDesktop.rx} fill="white" />
              </mask>
              <mask id={`ci-phone-hole-mobile-${maskVersion}`} maskContentUnits="objectBoundingBox">
                <rect x="0" y="0" width="1" height="1" fill="white" />
                <rect x={phoneRectMobile.x} y={phoneRectMobile.y} width={phoneRectMobile.w} height={phoneRectMobile.h} rx={phoneRectMobile.rx} fill="black" />
              </mask>
              <mask id={`ci-phone-show-mobile-${maskVersion}`} maskContentUnits="objectBoundingBox">
                <rect x={phoneRectMobile.x} y={phoneRectMobile.y} width={phoneRectMobile.w} height={phoneRectMobile.h} rx={phoneRectMobile.rx} fill="white" />
              </mask>
            </defs>
          </svg>

          {/* The backdrop's phone is masked OUT here (see the inline
              mask-image below) — the floating cutout further down is the
              only copy that renders it, so it can genuinely hover instead
              of just sitting there glowing in place. The mask-image is set
              inline (not via the shared CSS classes below) because the id
              it points at changes on every resize — see maskVersion. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero_section_desktop.png"
            alt="A crowd gathered in a neon city around a glowing phone reading NOORVA — coming soon to your phone"
            className="hidden h-full w-full object-cover md:block"
            style={{
              WebkitMaskImage: `url(#ci-phone-hole-desktop-${maskVersion})`,
              maskImage: `url(#ci-phone-hole-desktop-${maskVersion})`,
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero_section_mobile.png"
            alt="A crowd gathered in a neon city around a glowing phone reading NOORVA — coming soon to your phone"
            className="block h-full w-full object-cover md:hidden"
            style={{
              WebkitMaskImage: `url(#ci-phone-hole-mobile-${maskVersion})`,
              maskImage: `url(#ci-phone-hole-mobile-${maskVersion})`,
            }}
          />

          {/* Building window lights — a dark "shutter" sits over a handful
              of the backdrop photo's own real windows, normally hiding them
              and briefly going transparent to reveal the actual bright
              pixel underneath. Masked with the same phone-hole cutout as
              the backdrop so none of them land on the phone itself. Each
              picks one of five on/off patterns (see bl-flicker-N below) and
              a randomized duration/delay so windows switch independently
              instead of in unison. */}
          <div
            className="absolute inset-0 z-[1] hidden overflow-hidden pointer-events-none md:block"
            style={{
              WebkitMaskImage: `url(#ci-phone-hole-desktop-${maskVersion})`,
              maskImage: `url(#ci-phone-hole-desktop-${maskVersion})`,
            }}
          >
            {DESKTOP_BUILDING_LIGHTS.map((l, i) => (
              <div
                key={i}
                className={`building-light bl-v${l.variant}`}
                style={{
                  left: `${(desktopLightPos[i]?.x ?? l.x) * 100}%`,
                  top: `${(desktopLightPos[i]?.y ?? l.y) * 100}%`,
                  animationDuration: `${l.duration}s`,
                  animationDelay: `${l.delay}s`,
                }}
              />
            ))}
          </div>
          <div
            className="absolute inset-0 z-[1] block overflow-hidden pointer-events-none md:hidden"
            style={{
              WebkitMaskImage: `url(#ci-phone-hole-mobile-${maskVersion})`,
              maskImage: `url(#ci-phone-hole-mobile-${maskVersion})`,
            }}
          >
            {MOBILE_BUILDING_LIGHTS.map((l, i) => (
              <div
                key={i}
                className={`building-light bl-v${l.variant}`}
                style={{
                  left: `${(mobileLightPos[i]?.x ?? l.x) * 100}%`,
                  top: `${(mobileLightPos[i]?.y ?? l.y) * 100}%`,
                  animationDuration: `${l.duration}s`,
                  animationDelay: `${l.delay}s`,
                }}
              />
            ))}
          </div>

          {/* Floating phone — same photo, cropped to just the phone via
              mask-image, animated with a slow zoom in/out pulse anchored to
              its own base (see transformOrigin) so only the phone itself
              ever appears to move — the podium beneath is outside the
              crop entirely and never shifts. Sits in the exact hole
              punched out of the backdrop above, so at rest (scale 1) it
              lines up pixel-for-pixel and only the animation reveals it's
              a separate layer. */}
          <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero_section_desktop.png"
              alt=""
              aria-hidden
              className="hero-phone-cutout-desktop hidden h-full w-full object-cover md:block"
              style={{
                WebkitMaskImage: `url(#ci-phone-show-desktop-${maskVersion})`,
                maskImage: `url(#ci-phone-show-desktop-${maskVersion})`,
                transformOrigin: `${(phoneRectDesktop.x + phoneRectDesktop.w / 2) * 100}% ${(phoneRectDesktop.y + phoneRectDesktop.h) * 100}%`,
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero_section_mobile.png"
              alt=""
              aria-hidden
              className="hero-phone-cutout-mobile block h-full w-full object-cover md:hidden"
              style={{
                WebkitMaskImage: `url(#ci-phone-show-mobile-${maskVersion})`,
                maskImage: `url(#ci-phone-show-mobile-${maskVersion})`,
                transformOrigin: `${(phoneRectMobile.x + phoneRectMobile.w / 2) * 100}% ${(phoneRectMobile.y + phoneRectMobile.h) * 100}%`,
              }}
            />
          </div>

          {/* A gentle bob/drift + glow on the flying figures — additive
              overlays rather than moved pixels, since isolating them from
              the photo the way the phone is isolated above would clip
              their limbs (they're smaller and closer to the frame edge). */}
          <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden">
            <div className="absolute inset-0 hidden md:block">
              <div className="hero-fly hero-fly-a-desktop" />
              <div className="hero-fly hero-fly-b-desktop" />
            </div>
            <div className="absolute inset-0 block md:hidden">
              <div className="hero-fly hero-fly-a-mobile" />
              <div className="hero-fly hero-fly-b-mobile" />
            </div>
          </div>
          <style>{`
            @keyframes hero-phone-hover {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.06); }
            }
            .hero-phone-cutout-desktop {
              animation: hero-phone-hover 4.2s ease-in-out infinite;
              will-change: transform;
            }
            .hero-phone-cutout-mobile {
              animation: hero-phone-hover 4.2s ease-in-out infinite;
              will-change: transform;
            }
            @keyframes hero-fly-bob-a {
              0%, 100% { transform: translate(0, 0) rotate(0deg); }
              50% { transform: translate(-4px, -9px) rotate(-2deg); }
            }
            @keyframes hero-fly-bob-b {
              0%, 100% { transform: translate(0, 0) rotate(0deg); }
              50% { transform: translate(4px, -6px) rotate(2deg); }
            }
            @keyframes hero-fly-glow {
              0%, 100% { opacity: 0.55; }
              50% { opacity: 1; }
            }
            .hero-fly {
              position: absolute;
              background: radial-gradient(ellipse at center, rgba(225,210,255,0.75) 0%, rgba(190,160,255,0.35) 45%, transparent 72%);
              mix-blend-mode: screen;
              filter: blur(2px);
              will-change: transform, opacity;
            }
            .hero-fly-a-desktop {
              left: 39%; top: 33%; width: 13%; height: 18%;
              animation: hero-fly-bob-a 3.8s ease-in-out infinite, hero-fly-glow 3.4s ease-in-out infinite;
            }
            .hero-fly-b-desktop {
              left: 77%; top: 15%; width: 7%; height: 8%;
              animation: hero-fly-bob-b 4.3s ease-in-out infinite, hero-fly-glow 3.4s ease-in-out infinite;
              animation-delay: 0.5s, 0s;
            }
            .hero-fly-a-mobile {
              left: 20%; top: 19%; width: 22%; height: 10%;
              animation: hero-fly-bob-a 3.8s ease-in-out infinite, hero-fly-glow 3.4s ease-in-out infinite;
            }
            .hero-fly-b-mobile {
              left: 69%; top: 9%; width: 12%; height: 6%;
              animation: hero-fly-bob-b 4.3s ease-in-out infinite, hero-fly-glow 3.4s ease-in-out infinite;
              animation-delay: 0.5s, 0s;
            }
            /* A small dark shutter pinned exactly on top of one real window
               in the photo. At rest it fully covers that window (the "off"
               look); the keyframes below briefly drop it to opacity 0,
               unmasking the actual bright pixel underneath (the "on" look).
               No synthetic glow is drawn — the light you see on is the
               photo's own, so it's always correctly colored and positioned. */
            .building-light {
              position: absolute;
              width: 6px;
              height: 6px;
              border-radius: 1.5px;
              transform: translate(-50%, -50%);
              background: #060310;
              filter: blur(0.6px);
              opacity: 0.94;
              animation-timing-function: steps(1, end);
              animation-iteration-count: infinite;
              will-change: opacity;
            }
            /* Each variant covers the window for most of the cycle, then
               uncovers it for one (or a couple of short) stretches — a
               light being switched on and later off, not a flickering bulb. */
            @keyframes bl-flicker-1 {
              0%, 100% { opacity: 0.94; }
              12% { opacity: 0.94; }
              14% { opacity: 0; }
              46% { opacity: 0; }
              48% { opacity: 0.94; }
            }
            @keyframes bl-flicker-2 {
              0%, 100% { opacity: 0; }
              2% { opacity: 0.94; }
              38% { opacity: 0.94; }
              40% { opacity: 0; }
              72% { opacity: 0; }
              74% { opacity: 0.94; }
            }
            @keyframes bl-flicker-3 {
              0%, 100% { opacity: 0.94; }
              20% { opacity: 0.94; }
              22% { opacity: 0; }
              30% { opacity: 0; }
              32% { opacity: 0.94; }
              64% { opacity: 0.94; }
              66% { opacity: 0; }
              80% { opacity: 0; }
              82% { opacity: 0.94; }
            }
            @keyframes bl-flicker-4 {
              0%, 100% { opacity: 0.94; }
              55% { opacity: 0.94; }
              57% { opacity: 0; }
              97% { opacity: 0; }
              99% { opacity: 0.94; }
            }
            @keyframes bl-flicker-5 {
              0%, 100% { opacity: 0; }
              8% { opacity: 0.94; }
              48% { opacity: 0.94; }
              50% { opacity: 0; }
              58% { opacity: 0; }
              60% { opacity: 0.94; }
              90% { opacity: 0.94; }
              92% { opacity: 0; }
            }
            .bl-v1 { animation-name: bl-flicker-1; }
            .bl-v2 { animation-name: bl-flicker-2; }
            .bl-v3 { animation-name: bl-flicker-3; }
            .bl-v4 { animation-name: bl-flicker-4; }
            .bl-v5 { animation-name: bl-flicker-5; }
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
                  // The story-gallery temple scene is a hidden overlay, not
                  // a normal scroll-flow section (see StoryGallerySection.tsx
                  // and storyGalleryOverlayControl's own comment in store.ts)
                  // — this reveals it directly instead of scrolling to it.
                  onClick={() => storyGalleryOverlayControl.open?.()}
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
