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

export default function CinematicIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPlayedRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [typedText, setTypedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    tlRef.current?.eventCallback("onComplete", () => {
      releaseScrollLock("cosmic-intro");
    });
    tlRef.current?.play();
  }, []);

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

        {/* Full-screen hero video — layers on top of the star canvas
            behind it; the heading/buttons below sit on top of this in
            turn via z-10. */}
        <div className="absolute inset-0 z-[5]">
          <HeroLogoPortal />
        </div>

        {/* Click hint */}
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

        {/* Hero content — fades in as the star blast settles, then stays put
            as the page's static landing once the reveal finishes. On
            mobile the content starts from the vertical middle of the
            screen rather than being dead-centered — the portrait hero
            clip's own busiest imagery (the hand/energy-ring subject)
            sits in its upper half, with a calmer blurred continuation
            below, so anchoring the text block's top edge at mid-screen
            lands it over that calmer lower portion instead of
            overlapping the subject. Desktop keeps the original
            dead-center framing (its landscape clip doesn't have that
            same upper/lower split). */}
        <div className="absolute inset-0 flex items-start justify-center pt-[46vh] z-10 pointer-events-none md:items-center md:pt-0">
          <div
            id="ci-text-1"
            className="flex flex-col items-center gap-10 px-8 text-center"
            style={{ opacity: 0, filter: "blur(12px)" }}
          >
            <div className="flex flex-col items-center gap-9">
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

              <div className="pointer-events-auto flex flex-col items-center gap-4 sm:flex-row lg:flex-row">
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
      </div>
    </section>
  );
}
