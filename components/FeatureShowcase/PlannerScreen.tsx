"use client";

import { forwardRef } from "react";
import { CalendarCheck } from "lucide-react";
import PhoneScreen, { ScreenHeader } from "./PhoneScreen";

interface ScreenProps {
  active?: boolean;
}

const RING_R = 16;
const RING_C = 2 * Math.PI * RING_R;
const RING_PROGRESS = 0.68;

const ROWS = [
  { label: "Morning walk", done: true },
  { label: "Review notes", done: true },
  { label: "Call with mentor", done: false },
];

const PlannerScreen = forwardRef<HTMLDivElement, ScreenProps>(function PlannerScreen({ active = false }, ref) {
  const cells = Array.from({ length: 21 }, (_, i) => i === 11);

  return (
    <PhoneScreen ref={ref} active={active}>
      <ScreenHeader icon={CalendarCheck} label="Planner · Tasks" accent="var(--accent-warm)" />

      <div className="flex items-center gap-4">
        <svg width="44" height="44" viewBox="0 0 40 40" className="-rotate-90 shrink-0">
          <circle cx="20" cy="20" r={RING_R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
          <circle
            cx="20"
            cy="20"
            r={RING_R}
            fill="none"
            stroke="var(--accent-warm)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - RING_PROGRESS)}
            style={{
              opacity: active ? 1 : 0.6,
              transition: "opacity 0.6s ease",
              filter: active ? "drop-shadow(0 0 4px var(--accent-warm))" : undefined,
            }}
          />
        </svg>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] tracking-[0.15em] text-white/40 uppercase">Today</span>
          <span className="text-[13px] font-medium text-white/85">68% complete</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((filled, i) => (
          <div
            key={i}
            className="aspect-square rounded-[4px]"
            style={{
              background: filled ? "var(--accent-warm)" : "rgba(255,255,255,0.06)",
              transform: filled && active ? "scale(1.15)" : "scale(1)",
              transition: "transform 0.4s ease",
            }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {ROWS.map((row) => (
          <div key={row.label} className="flex items-center gap-2.5">
            <div
              className="h-3.5 w-3.5 shrink-0 rounded-full border"
              style={{
                borderColor: row.done ? "var(--accent-warm)" : "rgba(255,255,255,0.2)",
                background: row.done ? "var(--accent-warm)" : "transparent",
              }}
            />
            <span className="text-[10px] text-white/60">{row.label}</span>
          </div>
        ))}
      </div>
    </PhoneScreen>
  );
});

export default PlannerScreen;
