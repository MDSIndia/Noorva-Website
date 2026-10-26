"use client";

// Drop-in replacement for <PhoneMockup><CompanionScreen /></PhoneMockup> (or
// <VideoScreen />, with screen="video"): the 3D titanium phone
// (components/PhoneShowcase3D) showing the Companion chat or the Video feed. The Canvas is client-only and only renders while on screen.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Scene from "../PhoneShowcase3D/Scene";

const noopSubscribe = () => () => {};

export default function Phone3D({ className = "", screen = "chat" }: { className?: string; screen?: "chat" | "video" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  // False during SSR/hydration so the WebGL canvas (and its window access) only ever mounts in the browser.
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative mx-auto aspect-[9/14] w-full max-w-[300px] sm:max-w-[360px] ${className}`}>
      <div className="pointer-events-none absolute inset-6 -z-10 rounded-[3rem] opacity-[0.35] blur-3xl" style={{ backgroundImage: "var(--accent-gradient)" }} />
      {isClient && <Scene active={active} screen={screen} />}
    </div>
  );
}
