"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Library, ArrowUpRight } from "lucide-react";
import {
  lenisRef,
  galleryCaptureControl,
  acquireScrollLock,
  releaseScrollLock,
  introRevealControl,
} from "./store";

// Click -> the whole hero (backdrop + text) fades in from a blur, matching
// the site's established "click to reveal" pacing (this used to be a
// CosmicCanvas WebGL star-blast the text faded in over; that's gone now
// that the backdrop is these two static images, but the click-gated reveal
// itself is kept — see WelcomeOverlay.tsx's handoff via introRevealControl).
const REVEAL_DURATION = 1.4; // seconds, click -> fully settled

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

  // The intro is a fixed gate, not a scrollable section — nothing below it
  // should be reachable until the click reveal has actually played out.
  useEffect(() => {
    acquireScrollLock("cosmic-intro");
    return () => releaseScrollLock("cosmic-intro");
  }, []);

  useEffect(() => {
    // Built paused — a click anywhere on the intro plays it once.
    const tl = gsap.timeline({ paused: true });
    tlRef.current = tl;

    tl.fromTo(
      "#ci-reveal",
      { opacity: 0, filter: "blur(16px)" },
      { opacity: 1, filter: "blur(0px)", duration: REVEAL_DURATION, ease: "power2.out" },
      0
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
        <div id="ci-reveal" className="absolute inset-0" style={{ opacity: 0, filter: "blur(16px)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero_section_desktop.png"
            alt="A crowd gathered in a neon city around a glowing phone reading NOORVA — coming soon to your phone"
            className="hidden h-full w-full object-cover md:block"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero_section_mobile.png"
            alt="A crowd gathered in a neon city around a glowing phone reading NOORVA — coming soon to your phone"
            className="block h-full w-full object-cover md:hidden"
          />

          {/* Text overlay — bottom-anchored and centered on mobile (the
              mobile crop's own empty space sits below the crowd), left-
              anchored and vertically centered on desktop (the desktop
              crop's empty space is to the phone's left). */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-end px-6 pb-16 pointer-events-none md:items-start md:justify-center md:px-0 md:pb-0 md:pl-14 lg:pl-24">
            <div id="ci-text-1" className="flex flex-col items-center gap-9 text-center md:items-start md:text-left">
              <p
                className="max-w-md bg-clip-text text-3xl font-bold tracking-[0.1em] text-transparent uppercase md:max-w-xl md:text-5xl lg:max-w-2xl lg:text-6xl whitespace-pre-line"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #ffffff 0%, #3965e5 35%, #7c5cfc 65%, #db45d7 100%)",
                }}
              >
                {typedText || ""}
                {!typingDone && (
                  <span
                    style={{
                      display: "inline-block",
                      width: "2px",
                      marginLeft: "2px",
                      background: "linear-gradient(135deg, #ffffff, #7c5cfc)",
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
