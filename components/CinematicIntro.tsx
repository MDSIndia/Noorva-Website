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
import HeroLogoPortal from "./HeroLogoPortal";

const CosmicCanvas = dynamic(() => import("./CosmicCanvas"), { ssr: false });

// CosmicCanvas's own star-blast resolves into a calm resting field by its
// internal progress ~0.45 (see CosmicCanvas.tsx). Scaling our 0-1 reveal
// progress into that range means the reveal can take however long feels
// right while always finishing on the same settled, calm frame.
const BLAST_SETTLE_P = 0.45;
const REVEAL_DURATION = 3.4; // seconds, click -> fully settled

// Full heading text split into lines for the typewriter
const HEADING_LINES = ["Intelligence Like", "Never Before In", "Your Hands"];
const HEADING_FULL = HEADING_LINES.join("\n");

// How much of the click-to-begin transition clip actually plays before
// cutting to the star-blast/glow reveal underneath — the source file is
// ~19s, but only the first burst of it is used here.
const TRANSITION_VIDEO_SECONDS = 5;

export default function CinematicIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPlayedRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [typedText, setTypedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Click -> transition clip plays -> fades out -> star-blast/glow reveal
  // starts underneath -> hero content fades in. `showTransition` gates
  // the clip's own mount/visibility; the fade-out + handoff to the
  // existing reveal timeline happens on a fixed timer (below) rather
  // than the video's own `ended` event, since only the first few seconds
  // of the (much longer) source clip are meant to play.
  const [showTransition, setShowTransition] = useState(false);
  const transitionVideoRef = useRef<HTMLVideoElement>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    // Built paused — a click anywhere on the intro plays it once, replacing
    // the old scroll-scrubbed reveal with a click-triggered one. The
    // underlying CosmicCanvas is agnostic to what drives `scrollProgress`,
    // so swapping the trigger is just a matter of who calls tl.play().
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

    // hero text + phone fade in partway through the blast, then hold —
    // this becomes the static landing content once the reveal finishes.
    // Typing used to wait for the WHOLE timeline (including the tail end
    // of the star blast after the text had already faded in) before
    // starting — the heading sat there fully visible but blank for that
    // stretch, reading as a stall. Starting it off this tween's own
    // onComplete instead means it begins the instant the text finishes
    // fading in, not after the rest of the reveal also finishes.
    tl.fromTo(
      "#ci-text-1",
      { opacity: 0, y: 24, filter: "blur(12px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: REVEAL_DURATION * 0.5,
        ease: "power2.out",
        onComplete: startTyping,
      },
      REVEAL_DURATION * 0.35
    );

    return () => {
      tl.kill();
    };
  }, [startTyping]);

  const handleReveal = useCallback(() => {
    if (hasPlayedRef.current) return;
    hasPlayedRef.current = true;
    gsap.to("#ci-click-hint", { opacity: 0, duration: 0.3 });
    setShowTransition(true);
  }, []);

  // Drives the transition clip once it mounts: play it, then after
  // TRANSITION_VIDEO_SECONDS fade it out and hand off to the existing
  // star-blast/glow timeline underneath (which still owns releasing the
  // scroll lock on its own completion, unchanged from before).
  useEffect(() => {
    if (!showTransition) return;
    transitionVideoRef.current?.play().catch(() => {});
    transitionTimerRef.current = setTimeout(() => {
      gsap.to("#ci-transition-video", {
        opacity: 0,
        duration: 0.6,
        ease: "power1.out",
        onComplete: () => {
          setShowTransition(false);
          tlRef.current?.eventCallback("onComplete", () => {
            releaseScrollLock("cosmic-intro");
          });
          tlRef.current?.play();
        },
      });
    }, TRANSITION_VIDEO_SECONDS * 1000);
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, [showTransition]);

  // Cleanup typing timer on unmount
  useEffect(() => () => { if (typingRef.current) clearTimeout(typingRef.current); }, []);

  // Let WelcomeOverlay trigger this same reveal from its own dismiss click,
  // so the star blast starts immediately instead of needing a second click.
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

        {/* Desktop (md+): unchanged — full-bleed video with the heading/
            buttons overlaid on top of it via the absolute inset-0 panel
            further down.
            Mobile: the video is no longer cropped to fill the screen —
            it sits in a block sized to its own 16:9 aspect ratio (so the
            whole frame is visible, nothing cut off), with the content
            panel following below it in normal flow instead of overlaid,
            which is why the same #ci-text-1 panel switches from
            `md:absolute md:inset-0` (overlay) to a plain flow block
            beneath the video on mobile. */}
        <div className="relative flex h-full flex-col md:block">
          {/* mt-20 (reset at md, where the video is a full-bleed background
              the header is meant to float over) — Header.tsx's logo/nav
              pills are a `fixed top-3` overlay independent of this section's
              own layout, so without this the mobile video block's own top
              edge (aspect-video box starting at y=0) sits directly under/
              behind them instead of clearing them. */}
          <div className="relative mt-20 w-full aspect-video overflow-hidden md:absolute md:inset-0 md:mt-0 md:aspect-auto md:h-full">
            <HeroLogoPortal />

            {/* Click hint — pinned to the bottom edge of the video block
                itself, so it sits correctly whether that block is the
                small mobile aspect-ratio box or the full-screen desktop
                background. */}
            <div
              id="ci-click-hint"
              className="absolute inset-x-0 bottom-4 z-20 flex flex-col items-center gap-3 pointer-events-none md:bottom-10"
              style={{ opacity: 1 }}
            >
              <span className="text-[10px] tracking-[0.44em] uppercase text-white/35 font-light">
                Click anywhere to begin
              </span>
              <div className="h-2 w-2 rounded-full border border-white/40 animate-ping" />
            </div>
          </div>

          {/* Hero content — fades in as the star blast settles, then stays
              put as the page's static landing once the reveal finishes. */}
          <div
            id="ci-text-1"
            className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10 px-8 py-8 text-center pointer-events-auto md:absolute md:inset-0 md:flex-none md:py-0 md:pointer-events-none"
            style={{ opacity: 0, filter: "blur(12px)" }}
          >
            <div className="flex flex-col items-center gap-9 md:pointer-events-auto">
              <p
                className="max-w-md text-3xl font-bold tracking-[0.1em] text-white uppercase md:max-w-xl md:text-5xl lg:max-w-2xl lg:text-6xl whitespace-pre-line"
                style={{
                  // Highlights the heading against the busy video behind
                  // it — a soft brand-color glow plus a dark contact
                  // shadow for a hard edge of contrast.
                  textShadow:
                    "0 0 40px rgba(124,92,252,0.65), 0 0 80px rgba(0,85,255,0.4), 0 4px 24px rgba(0,0,0,0.85)",
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

              <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-row">
                <button
                  onClick={() => goTo("#story-gallery")}
                  className="group relative shrink-0 rounded-full p-[1.5px] transition-transform duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #3965e5, #7c5cfc, #db45d7)",
                    boxShadow: "0 0 28px rgba(124,92,252,0.4)",
                  }}
                >
                  <span className="btn-glow flex items-center gap-1.5 rounded-full bg-black/85 px-4 py-2 text-[9px] font-semibold tracking-[0.22em] text-white uppercase backdrop-blur-xl transition-colors duration-300 group-hover:bg-black/70 sm:px-7 sm:py-3 sm:text-[11px] sm:tracking-[0.28em] sm:gap-2">
                    <Library className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={1.75} />
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
                    className="btn-glow flex items-center gap-1.5 rounded-full bg-black/85 px-4 py-2 text-[9px] font-semibold tracking-[0.22em] uppercase backdrop-blur-xl transition-colors duration-300 group-hover:bg-black/70 sm:px-7 sm:py-3 sm:text-[11px] sm:tracking-[0.28em] sm:gap-2"
                    style={{ color: "var(--accent-warm)" }}
                  >
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={1.75} />
                    Join Noorva
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Click-to-begin transition clip — covers everything else
            (highest z-index in this section) while it plays, then fades
            out to reveal the star-blast/glow timeline starting
            underneath. Mounted only once actually needed, not
            preloaded ahead of the click. */}
        {showTransition && (
          <div id="ci-transition-video" className="absolute inset-0 z-50 bg-black">
            <video
              ref={transitionVideoRef}
              src="/entry-animation-video.mp4"
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
