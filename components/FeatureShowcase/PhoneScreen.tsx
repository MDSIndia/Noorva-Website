"use client";

import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";

interface PhoneScreenProps {
  children: React.ReactNode;
  active?: boolean;
  /** Renders at rest (opacity 1) instead of the crossfade-hidden initial state — for standalone use outside the scroll journey (e.g. the hero). */
  initiallyVisible?: boolean;
}

const PhoneScreen = forwardRef<HTMLDivElement, PhoneScreenProps>(function PhoneScreen(
  { children, active = false, initiallyVisible = false },
  ref
) {
  return (
    <div
      ref={ref}
      className="absolute inset-0 flex flex-col gap-3 p-3.5"
      style={initiallyVisible ? { opacity: 1, transform: "scale(1)" } : { opacity: 0, transform: "scale(0.96)" }}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
});

export default PhoneScreen;

export function ScreenHeader({ icon: Icon, label, accent }: { icon: LucideIcon; label: string; accent: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10"
        style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)` }}
      >
        <Icon className="h-3 w-3" style={{ color: accent }} strokeWidth={2} />
      </div>
      <span className="text-[9px] font-semibold tracking-[0.2em] text-white/50 uppercase">{label}</span>
    </div>
  );
}

export function TypingDots({ active, color = "rgba(255,255,255,0.4)" }: { active: boolean; color?: string }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: color,
            animation: active ? `phone-typing-dot 1.1s ease-in-out ${i * 0.15}s infinite` : undefined,
          }}
        />
      ))}
    </div>
  );
}
