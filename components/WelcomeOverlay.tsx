"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { lenisRef } from "./store";

const TEXT = "Welcome to Noorva.";
const TYPE_INTERVAL_MS = 85;

const FEMALE_NAME_HINTS = ["female", "zira", "samantha", "aria", "heera", "victoria", "karen", "susan", "tessa", "moira"];

function pickVoice(voices: SpeechSynthesisVoice[]) {
  const preferredNames = [
    "Microsoft David - English (United States)",
    "Microsoft Mark - English (United States)",
    "Google UK English Male",
    "Daniel",
    "Alex",
  ];
  for (const name of preferredNames) {
    const match = voices.find((v) => v.name === name);
    if (match) return match;
  }
  const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
  const maleGuess = englishVoices.find(
    (v) => !FEMALE_NAME_HINTS.some((hint) => v.name.toLowerCase().includes(hint))
  );
  return maleGuess ?? englishVoices[0] ?? voices[0];
}

type Phase = "typing" | "ready" | "dismissed";

export default function WelcomeOverlay() {
  const [revealCount, setRevealCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;

  // Lock page scroll while the overlay is up — body overflow is the reliable
  // blocker (doesn't depend on Lenis having initialized yet), lenis.stop()/
  // start() is kept in sync alongside it so Lenis's own state doesn't drift.
  useEffect(() => {
    if (phase === "dismissed") {
      document.body.style.overflow = "";
      lenisRef.current?.start();
    } else {
      document.body.style.overflow = "hidden";
      lenisRef.current?.stop();
    }
  }, [phase]);

  // Typewriter reveal — runs on a fixed pace independent of whether speech
  // actually plays, so the intro never hangs if TTS is unavailable/blocked.
  useEffect(() => {
    if (phase !== "typing") return;
    const id = setInterval(() => {
      setRevealCount((c) => (c >= TEXT.length ? c : c + 1));
    }, TYPE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "typing" && revealCount >= TEXT.length) setPhase("ready");
  }, [revealCount, phase]);

  // Speech — best effort, started alongside the typing so the two roughly
  // track together. Chromium silently drops a speak() call fired in the
  // exact instant after a reload, so nudge it with cancel()+resume() and a
  // short delay, and retry if it never actually starts.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;
    const startedRef = { current: false };
    const attemptedRef = { current: false };
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let initialTimer: ReturnType<typeof setTimeout> | undefined;

    function attemptSpeak() {
      if (startedRef.current || attemptedRef.current) return;
      attemptedRef.current = true;

      synth.cancel();
      synth.resume();

      const utterance = new SpeechSynthesisUtterance(TEXT);
      const voice = pickVoice(synth.getVoices());
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95;
      utterance.pitch = 0.92;
      utterance.volume = 1;

      utterance.onstart = () => {
        startedRef.current = true;
      };
      utterance.onerror = () => {
        attemptedRef.current = false;
      };

      synth.speak(utterance);

      retryTimer = setTimeout(() => {
        if (!startedRef.current) attemptedRef.current = false;
      }, 1000);
    }

    function scheduleInitialAttempt() {
      initialTimer = setTimeout(attemptSpeak, 300);
    }

    if (synth.getVoices().length > 0) {
      scheduleInitialAttempt();
    } else {
      synth.addEventListener("voiceschanged", scheduleInitialAttempt, { once: true });
    }

    // Chrome sometimes rejects the gesture-less attempt outright with a
    // "not-allowed" error (autoplay policy) instead of just staying silent.
    // attemptSpeak() is a no-op once speech has actually started, so it's
    // safe to hang this off every interaction as a retry net.
    const interactionEvents = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    interactionEvents.forEach((evt) => window.addEventListener(evt, attemptSpeak, { passive: true }));

    return () => {
      clearTimeout(retryTimer);
      clearTimeout(initialTimer);
      synth.removeEventListener("voiceschanged", scheduleInitialAttempt);
      interactionEvents.forEach((evt) => window.removeEventListener(evt, attemptSpeak));
      synth.cancel();
    };
  }, []);

  // Any interaction while typing skips straight to the "ready" state; any
  // interaction once ready dismisses the overlay and hands off to the page.
  useEffect(() => {
    function handleInteraction() {
      if (phaseRef.current === "typing") {
        setRevealCount(TEXT.length);
        setPhase("ready");
      } else if (phaseRef.current === "ready") {
        setPhase("dismissed");
      }
    }
    const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    events.forEach((evt) => window.addEventListener(evt, handleInteraction, { passive: true }));
    return () => events.forEach((evt) => window.removeEventListener(evt, handleInteraction));
  }, []);

  return (
    <AnimatePresence>
      {phase !== "dismissed" && (
        <motion.div
          key="welcome-overlay"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, rgba(124,92,252,0.12), transparent 60%)" }}
          />

          <div className="relative mb-8 flex h-20 w-20 items-center justify-center md:h-24 md:w-24">
            <motion.div
              className="pointer-events-none absolute inset-0 -z-10 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(124,92,252,0.55), transparent 70%)" }}
              animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.55, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.35, 1] }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <Image src="/NoorvaLogo.png" alt="Noorva" width={40} height={40} className="opacity-95" />
            </motion.div>
          </div>

          <p className="relative px-8 text-center font-playfair text-3xl font-light tracking-[0.05em] text-white/90 md:text-5xl">
            {TEXT.slice(0, revealCount)}
            {phase === "typing" && (
              <span className="ml-1 inline-block h-[0.9em] w-[2px] translate-y-[0.1em] animate-pulse bg-white/70 align-middle" />
            )}
          </p>

          <AnimatePresence>
            {phase === "ready" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute bottom-14 flex flex-col items-center gap-2"
              >
                <span className="text-[10px] font-light uppercase tracking-[0.44em] text-white/40">
                  Scroll to open
                </span>
                <div className="h-8 w-px animate-pulse bg-gradient-to-b from-white/25 to-transparent" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
