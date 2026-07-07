"use client";

import { useEffect, useState } from "react";

// null = unknown (SSR/first paint, matchMedia unavailable server-side) — callers
// should treat null the same as true so there's no hydration mismatch.
export default function useIsMobile(breakpoint = 1024): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
