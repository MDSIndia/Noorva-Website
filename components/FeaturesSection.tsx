"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { acquireScrollLock, releaseScrollLock, lenisRef } from "./store";

gsap.registerPlugin(ScrollTrigger);

// Two acts, one section. Act one: the theatre establishing shot holds,
// static, with its screen showing a preview of "Guide" — the visitor has to
// click it. Act two: that click zooms the screen rectangle itself out to
// fill the viewport (the backdrop crowd/bezel fading out underneath as it
// grows, so it reads as the camera pushing THROUGH the screen rather than a
// cut), and once it lands full-bleed, scroll takes over — flowing forward
// through the remaining personas as full-bleed scenes, each one crossfading
// in with a forward zoom + rise, like flying past one into the next.
interface Persona {
  id: string;
  label: string;
  desktopSrc: string;
  mobileSrc: string;
}

const PERSONAS: Persona[] = [
  { id: "guide", label: "Guide", desktopSrc: "/features/guide_desktop.png", mobileSrc: "/features/guide_mobile.png" },
  { id: "mentor", label: "Mentor", desktopSrc: "/features/mentor_desktop.png", mobileSrc: "/features/mentor_mobile.png" },
  { id: "teacher", label: "Teacher", desktopSrc: "/features/teacher_desktop.png", mobileSrc: "/features/teacher_mobile.png" },
  { id: "strategist", label: "Strategist", desktopSrc: "/features/strategist_desktop.png", mobileSrc: "/features/strategist_mobile.png" },
  { id: "designer", label: "Designer", desktopSrc: "/features/designer_desktop.png", mobileSrc: "/features/designer_mobile.png" },
  { id: "companion", label: "Companion", desktopSrc: "/features/companion_desktop.png", mobileSrc: "/features/companion_mobile.png" },
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

// The screen's own center, as a fraction of the backdrop — used as each
// backdrop image's transform-origin so the click-triggered camera push (see
// handleStart) scales the whole image up around that exact point, rather
// than around the image's default center. That's what makes the crowd/city
// rush outward and away as the scale grows, instead of the backdrop just
// zooming toward its own middle regardless of where the screen actually
// sits in frame.
const SCREEN_CENTER_DESKTOP = `${(SCREEN_DESKTOP.left + SCREEN_DESKTOP.width / 2) * 100}% ${(SCREEN_DESKTOP.top + SCREEN_DESKTOP.height / 2) * 100}%`;
const SCREEN_CENTER_PHONE = `${(SCREEN_PHONE.left + SCREEN_PHONE.width / 2) * 100}% ${(SCREEN_PHONE.top + SCREEN_PHONE.height / 2) * 100}%`;

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
// heights, spread across the 5 hand-offs between 6 personas. Tune by feel.
const PIN_VH_MULTIPLIER = 7;

// Per step of progress: how far a persona zooms in (as it's flown past) or
// shrinks back (as it's approached), and how far it rises vertically —
// together these read as flying forward through the sequence rather than a
// flat crossfade.
const JOURNEY_ZOOM_PAST_PCT = 35;
const JOURNEY_ZOOM_APPROACH_PCT = 6;
const JOURNEY_RISE_PCT = 10;

// Pixel geometry of the journey-progress track below, kept as constants
// (not measured) since the traveling marker needs to land on the same
// pitch as the dots at every scroll position, not just resync on resize —
// matches the track's own w-7 (28px) + gap-2 (8px) Tailwind classes.
const JOURNEY_DOT_WIDTH_PX = 28;
const JOURNEY_DOT_GAP_PX = 8;
const JOURNEY_DOT_PITCH_PX = JOURNEY_DOT_WIDTH_PX + JOURNEY_DOT_GAP_PX;

// Each persona gets a full-opacity "dwell" window centered on its own index
// (0, 1, 2…), and fades linearly over the gap between dwell windows — since
// neighboring personas are 1 unit apart, each one's fade ramp has to run all
// the way out to d = 1 - DWELL_HALF (not just to the 0.5 midpoint) to reach
// the point where the *next* persona's own dwell begins — that makes the two
// ramps cross at exactly 50% opacity each at the midpoint, a true
// crossfade. Ending the ramp at 0.5 instead (an earlier version's bug) made
// both personas hit 0 opacity simultaneously right at the midpoint — a
// visible black gap on every transition instead of an overlap.
const DWELL_HALF = 0.3;
function presence(index: number, progress: number) {
  const d = Math.abs(progress - index);
  const fadeEnd = 1 - DWELL_HALF;
  if (d <= DWELL_HALF) return 1;
  if (d >= fadeEnd) return 0;
  return 1 - (d - DWELL_HALF) / (fadeEnd - DWELL_HALF);
}

// The click-to-start transition: light rays shooting outward from the
// screen's own center, standing in for "flowing" into the journey between
// the theatre holding and the first persona appearing — each ray is a
// separate rotated wrapper (fixed angle) around an inner bar that grows
// from a point to its own length/width via CSS keyframes (see
// features-flow-ray-shoot below), so the rotation itself never needs to be
// animated. Angles are evenly spaced with a small hand-picked jitter, and
// length/width alternate long-thin/short-thick, so the burst reads as an
// organic flare instead of a perfect uniform pinwheel; duration/delay here
// must stay in sync with that keyframe's own duration (0.8s) and with
// handleStart's timeline.
const FLOW_RAYS = [
  { angle: 4, delay: 0, length: 58, width: 2 },
  { angle: 34, delay: 0.07, length: 30, width: 1.5 },
  { angle: 61, delay: 0.02, length: 50, width: 2.5 },
  { angle: 93, delay: 0.09, length: 34, width: 1.5 },
  { angle: 124, delay: 0.04, length: 60, width: 2 },
  { angle: 152, delay: 0.11, length: 28, width: 1.5 },
  { angle: 183, delay: 0.01, length: 55, width: 2.5 },
  { angle: 214, delay: 0.08, length: 32, width: 1.5 },
  { angle: 242, delay: 0.03, length: 62, width: 2 },
  { angle: 271, delay: 0.12, length: 30, width: 1.5 },
  { angle: 301, delay: 0.05, length: 52, width: 2.5 },
  { angle: 332, delay: 0.02, length: 36, width: 1.5 },
];

// Deterministic PRNG for the star-particle field below — same mulberry32
// used elsewhere in the codebase (CinematicIntro's own starfield/window
// lights) for reproducible "generated, not hand-picked" scatter.
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

// The blast's own scattering debris — a supernova throwing stars outward
// rather than just a lens flare, which is what actually reads as "cosmos"
// instead of a plain camera-flare burst. Each particle flies outward along
// its own angle (see .features-flow-particle's use of the --dist custom
// property) to a random distance, fading in/out over its own randomized
// duration so the field disperses unevenly rather than as one uniform ring.
const FLOW_PARTICLE_COUNT = 46;
const flowParticleRand = mulberry32(2601);
const FLOW_PARTICLES = Array.from({ length: FLOW_PARTICLE_COUNT }, () => ({
  angle: flowParticleRand() * 360,
  distance: 16 + flowParticleRand() * 42,
  size: 1.5 + flowParticleRand() * 2.5,
  delay: flowParticleRand() * 0.3,
  duration: 0.6 + flowParticleRand() * 0.45,
}));

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const guideRevealRef = useRef<HTMLDivElement>(null);
  const hasClickedRef = useRef(false);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const [entered, setEntered] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const screenRect = useScreenRect(sectionRef);

  const handleStart = useCallback(() => {
    if (hasClickedRef.current) return;
    hasClickedRef.current = true;
    acquireScrollLock("features-journey");

    gsap.to("#features-click-hint", { opacity: 0, duration: 0.2 });

    // The camera push: the backdrop scales up around the screen's own
    // center (see SCREEN_CENTER_DESKTOP/PHONE, set as each image's
    // transform-origin) while blurring and fading, so the crowd and city
    // rush outward and past as if the camera is physically moving toward
    // that point — not just a shape growing in place. Accelerating
    // ("power2.in") rather than easing out, since a camera picking up speed
    // reads as a push, where a decelerating fade would just read as a dissolve.
    gsap.to(".features-theatre-backdrop", {
      scale: 2.6,
      filter: "blur(14px)",
      opacity: 0,
      duration: 1,
      ease: "power2.in",
    });
    gsap.to(screenRef.current, {
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
      duration: 1.1,
      ease: "power2.inOut",
    });
    // The ray burst is held back until the camera push above is almost
    // done, so it reads as a flash of light at the moment of arriving at
    // the screen rather than firing at the click itself — mounting late
    // (rather than mounting immediately and delaying its CSS animation)
    // since the keyframes self-play the instant the overlay appears.
    const rayTimer = setTimeout(() => setTransitioning(true), 620);
    // Guide only fades in once the ray burst has mostly run its course
    // (that animation's own duration is 0.8s, starting at 620ms) — the flow
    // reads as its own beat between the push and the persona appearing,
    // rather than overlapping it from the start.
    gsap.to(guideRevealRef.current, {
      opacity: 1,
      duration: 0.5,
      delay: 1.0,
      ease: "power2.out",
      onComplete: () => {
        clearTimeout(rayTimer);
        setEntered(true);
        setTransitioning(false);
        releaseScrollLock("features-journey");
      },
    });
  }, []);

  useEffect(() => {
    if (!entered) return;
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
      p: PERSONAS.length - 1,
      duration: 1,
      ease: "none",
      onUpdate: () => setProgress(proxy.p),
    });
    scrollTriggerRef.current = tl.scrollTrigger ?? null;

    return () => {
      scrollTriggerRef.current = null;
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [entered]);

  // Rewinds the pinned scroll back to the journey's own start (still
  // pinned, so the personas visibly crossfade back down to Guide as the
  // scroll animates) and only then drops the pin and resets to the
  // pre-click theatre — closing straight into an unpinned mid-journey
  // scroll position would leave the page's scroll offset pointing at
  // whatever now-nonexistent spot the removed pin spacer used to occupy.
  const handleClose = useCallback(() => {
    if (!entered) return;
    const start = scrollTriggerRef.current?.start ?? 0;
    lenisRef.current?.scrollTo(start, {
      duration: 1,
      onComplete: () => {
        hasClickedRef.current = false;
        setProgress(0);
        setEntered(false);
        setTransitioning(false);
      },
    });
  }, [entered]);

  return (
    <section id="features" ref={sectionRef} className="relative h-screen w-full overflow-hidden bg-black">
      {/* Exits the journey back to the theatre's click-to-start gate — the
          only reliable way out once pinned, since scrolling past it is
          blocked by design while the journey itself plays out. Same fixed
          top-right placement/style as StoryGallerySection's own close
          button, for a consistent "exit this takeover" affordance
          sitewide. */}
      {entered && (
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close the persona journey"
          className="fixed top-20 right-3 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/70 backdrop-blur-xl transition-colors duration-300 hover:text-[color:var(--accent-warm)] sm:right-4 md:top-24 md:right-6 md:h-10 md:w-10"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      )}

      {!entered && (
        <>
          <Image
            src="/features/theatre_desktop.png"
            alt="A crowd facing a glowing screen in a neon city"
            fill
            priority
            className="features-theatre-backdrop hidden object-cover md:block"
            style={{ transformOrigin: SCREEN_CENTER_DESKTOP }}
            sizes="100vw"
          />
          <Image
            src="/features/theatre_phone.png"
            alt="A crowd facing a glowing screen in a neon city"
            fill
            priority
            className="features-theatre-backdrop block object-cover md:hidden"
            style={{ transformOrigin: SCREEN_CENTER_PHONE }}
            sizes="100vw"
          />

          {/* The screen's own rectangle — positioned in pixels from
              useScreenRect, which redoes the backdrop's object-cover crop
              math by hand so this lines up with the art at any viewport
              size (see that hook's own comment for why plain percentages
              don't). GSAP tweens these same left/top/width/height values
              straight to fullscreen on click. */}
          <div
            ref={screenRef}
            onClick={handleStart}
            className="absolute cursor-pointer overflow-hidden bg-black"
            style={{
              left: screenRect.left,
              top: screenRect.top,
              width: screenRect.width,
              height: screenRect.height,
            }}
          >
            {/* Guide itself stays hidden until the click — the screen reads
                as a dark, waiting monitor, not a preview of what's inside —
                and fades in partway through the zoom-to-fullscreen tween
                below (see handleStart), landing at full opacity right as
                the screen finishes growing to fill the viewport. */}
            <div ref={guideRevealRef} className="absolute inset-0" style={{ opacity: 0 }}>
              <Image
                src={PERSONAS[0].desktopSrc}
                alt={`Noorva as ${PERSONAS[0].label}`}
                fill
                priority
                className="hidden object-cover md:block"
                sizes="60vw"
              />
              <Image
                src={PERSONAS[0].mobileSrc}
                alt={`Noorva as ${PERSONAS[0].label}`}
                fill
                priority
                className="block object-cover md:hidden"
                sizes="60vw"
              />
            </div>
            <div
              id="features-click-hint"
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3"
            >
              <span className="text-[10px] font-medium tracking-[0.44em] text-white/80 uppercase">
                Click to begin the journey
              </span>
              <div className="h-2 w-2 animate-ping rounded-full border border-white/60" />
            </div>
          </div>
        </>
      )}

      {entered &&
        PERSONAS.map((persona, i) => {
          const p = presence(i, progress);
          // Skip mounting fully-hidden personas — with all of them stacked
          // at inset-0, next/image would otherwise treat every one as "in
          // viewport" and eagerly load every asset at once regardless of
          // which is actually showing.
          if (p <= 0.001 && i !== 0) return null;
          // Personas already passed zoom in and rise further away, as if
          // flown past; personas still ahead sit slightly shrunk and low,
          // as if approaching — together with the crossfade this reads as
          // forward motion through the sequence rather than a flat
          // slideshow.
          const distancePast = Math.max(0, progress - i);
          const distanceAhead = Math.max(0, i - progress);
          const scale = 1 + (distancePast * JOURNEY_ZOOM_PAST_PCT) / 100 - (distanceAhead * JOURNEY_ZOOM_APPROACH_PCT) / 100;
          const rise = -(progress - i) * JOURNEY_RISE_PCT;
          const blur = Math.min(10, (distancePast + distanceAhead) * 5);
          return (
            <div
              key={persona.id}
              className="absolute inset-0"
              style={{
                opacity: p,
                zIndex: i,
                transform: `translateY(${rise}%) scale(${scale})`,
                filter: `blur(${blur}px)`,
              }}
            >
              <Image
                src={persona.desktopSrc}
                alt={`Noorva as ${persona.label}`}
                fill
                priority={i === 0}
                className="hidden object-cover md:block"
                sizes="100vw"
              />
              <Image
                src={persona.mobileSrc}
                alt={`Noorva as ${persona.label}`}
                fill
                priority={i === 0}
                className="block object-cover md:hidden"
                sizes="100vw"
              />
            </div>
          );
        })}

      {/* Journey progress — a connected path (not just isolated dots) with
          a glowing marker that travels smoothly along it as the pinned
          scroll advances, plus the current stop's own name crossfading in
          step with the persona itself (same presence() curve as the main
          crossfade above, not a separate re-derived one). Housed in its own
          frosted pill so it reads as one HUD element sitting on top of the
          scene, not loose text and dots floating over the art. Only
          relevant once the journey itself has begun. */}
      {entered && (
        <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 rounded-full border border-white/10 bg-black/30 px-6 py-3 backdrop-blur-md">
          <div className="relative hidden h-4 w-48 md:block">
            {PERSONAS.map((persona, i) => {
              const p = presence(i, progress);
              return (
                <span
                  key={persona.id}
                  className="absolute inset-0 flex items-center justify-center text-center text-[10px] font-medium tracking-[0.2em] whitespace-nowrap text-white uppercase"
                  style={{ opacity: p, transform: `translateY(${(1 - p) * 8}px)` }}
                >
                  {persona.label}
                </span>
              );
            })}
          </div>
          <div className="relative flex gap-2">
            {PERSONAS.map((persona, i) => (
              <span key={persona.id} className="h-[3px] w-7 overflow-hidden rounded-full bg-white/15">
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
                    backgroundSize: `${PERSONAS.length * 100}% 100%`,
                    backgroundPosition: `${(i / (PERSONAS.length - 1)) * 100}% 0`,
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
      )}

      {/* The click-to-start transition itself — a cosmos blast: an instant
          white pop at the screen's own center, a shockwave ring, a softer
          colored bloom, a dozen light rays at varying lengths, and a field
          of star-particle debris scattering outward like a supernova —
          covering the full viewport (not just the still-growing screen
          rect) so the flow reads as an actual explosion at the moment of
          arriving, not just a shape fading in. Unmounts once handleStart's
          timeline completes (see setTransitioning(false)), rather than
          sitting in the DOM idle for the rest of the journey. */}
      {transitioning && (
        <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
          <div className="features-flow-glow" />
          <div className="features-flow-ring" />
          <div className="features-flow-core" />
          {FLOW_RAYS.map((ray, i) => (
            <div
              key={`ray-${i}`}
              className="absolute top-1/2 left-1/2 h-0 w-0"
              style={{ transform: `rotate(${ray.angle}deg)` }}
            >
              <span
                className="features-flow-ray"
                style={{
                  animationDelay: `${ray.delay}s`,
                  height: `${ray.length}vmax`,
                  width: `${ray.width}px`,
                  left: `${-ray.width / 2}px`,
                }}
              />
            </div>
          ))}
          {FLOW_PARTICLES.map((particle, i) => (
            <div
              key={`particle-${i}`}
              className="absolute top-1/2 left-1/2 h-0 w-0"
              style={{ transform: `rotate(${particle.angle}deg)` }}
            >
              <span
                className="features-flow-particle"
                style={
                  {
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    marginLeft: `${-particle.size / 2}px`,
                    animationDelay: `${particle.delay}s`,
                    animationDuration: `${particle.duration}s`,
                    "--flow-particle-dist": `${particle.distance}vmax`,
                  } as React.CSSProperties
                }
              />
            </div>
          ))}
        </div>
      )}
      <style>{`
        @keyframes journey-marker-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.25); }
        }
        .journey-marker {
          animation: journey-marker-pulse 1.8s ease-in-out infinite;
        }
        /* The instant "pop" — a tiny, very bright point that flashes and
           overshoots outward in the first fraction of a second, before the
           softer bloom/ring/rays below have visibly grown at all. This is
           what gives the blast a hard onset instead of everything just
           easing in together. */
        @keyframes features-flow-core-pop {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(5); }
        }
        .features-flow-core {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 24px 8px rgba(255,255,255,0.95), 0 0 46px 18px rgba(200,180,255,0.6);
          animation: features-flow-core-pop 0.3s ease-out forwards;
        }
        @keyframes features-flow-glow-burst {
          0% { width: 6px; height: 6px; opacity: 1; }
          40% { opacity: 0.8; }
          100% { width: 38vmax; height: 38vmax; opacity: 0; }
        }
        .features-flow-glow {
          position: absolute;
          left: 50%;
          top: 50%;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, #ffffff 0%, rgba(124,92,252,0.9) 40%, rgba(219,69,215,0) 72%);
          filter: blur(2px);
          animation: features-flow-glow-burst 0.7s cubic-bezier(0.15, 0.8, 0.3, 1) forwards;
        }
        /* A thin ring expanding outward alongside the glow — the shockwave
           read that a soft filled bloom alone doesn't give, since a ring's
           own edge is what the eye tracks as it races outward. */
        @keyframes features-flow-ring-expand {
          0% { width: 8px; height: 8px; opacity: 0.9; border-width: 3px; }
          55% { opacity: 0.55; }
          100% { width: 62vmax; height: 62vmax; opacity: 0; border-width: 0.5px; }
        }
        .features-flow-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.85);
          box-shadow: 0 0 14px 2px rgba(124,92,252,0.7), inset 0 0 14px 2px rgba(219,69,215,0.5);
          transform: translate(-50%, -50%);
          animation: features-flow-ring-expand 0.85s cubic-bezier(0.1, 0.7, 0.25, 1) forwards;
        }
        /* Each ray lives inside a wrapper rotated to a fixed angle (see the
           FLOW_RAYS map above) — only length/opacity animate here, so the
           rotation itself never has to move mid-keyframe. Growing from the
           wrapper's own (0,0) pivot (top left, matching its own left/top:50%
           point in the section) outward reads as light shooting away from
           the screen's center rather than a bar just fading in in place.
           Length/width come from FLOW_RAYS as inline style overrides, so
           rays vary rather than reading as a uniform pinwheel. */
        @keyframes features-flow-ray-shoot {
          0% { opacity: 0; transform: scaleY(0.05); }
          18% { opacity: 1; }
          62% { opacity: 0.7; }
          100% { opacity: 0; transform: scaleY(1); }
        }
        .features-flow-ray {
          position: absolute;
          top: 0;
          transform-origin: top center;
          background: linear-gradient(to bottom, #ffffff 0%, #7c5cfc 16%, #db45d7 42%, transparent 78%);
          filter: blur(1px);
          opacity: 0;
          animation: features-flow-ray-shoot 0.8s cubic-bezier(0.15, 0.8, 0.3, 1) forwards;
        }
        /* Debris — each particle lives in its own rotated wrapper (fixed
           angle, from FLOW_PARTICLES) around a dot that flies straight
           outward to its own --flow-particle-dist, like a supernova
           throwing stars rather than a lens flare's static rays. Varied
           per-particle delay/duration (not one shared animation) is what
           makes the field disperse unevenly instead of as a single ring. */
        @keyframes features-flow-particle-fly {
          0% { opacity: 0; transform: translateY(0) scale(0.4); }
          12% { opacity: 1; }
          75% { opacity: 0.85; }
          100% { opacity: 0; transform: translateY(calc(-1 * var(--flow-particle-dist))) scale(1); }
        }
        .features-flow-particle {
          position: absolute;
          top: 0;
          left: 0;
          border-radius: 50%;
          background: radial-gradient(circle, #ffffff 0%, rgba(210, 200, 255, 0.9) 55%, rgba(124, 92, 252, 0) 100%);
          box-shadow: 0 0 5px 1px rgba(255,255,255,0.85);
          opacity: 0;
          animation-name: features-flow-particle-fly;
          animation-timing-function: cubic-bezier(0.1, 0.7, 0.25, 1);
          animation-fill-mode: forwards;
        }
      `}</style>
    </section>
  );
}
