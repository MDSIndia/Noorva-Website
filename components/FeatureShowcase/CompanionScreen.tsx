"use client";

import { forwardRef } from "react";
import { HeartHandshake } from "lucide-react";
import PhoneScreen, { ScreenHeader } from "./PhoneScreen";

interface ScreenProps {
  active?: boolean;
}

const ENTRIES = [
  { label: "Morning reflection", tag: "Journal" },
  { label: "Coffee with Sam", tag: "Memory" },
  { label: "Weekly insight", tag: "Insight" },
];

const CompanionScreen = forwardRef<HTMLDivElement, ScreenProps>(function CompanionScreen({ active = false }, ref) {
  return (
    <PhoneScreen ref={ref} active={active}>
      <ScreenHeader icon={HeartHandshake} label="Companion · Memories" accent="var(--accent-warm)" />

      {/* photo tiles */}
      <div className="flex gap-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-14 flex-1 rounded-xl"
            style={{ background: "linear-gradient(135deg, var(--accent-1), var(--accent-warm))", opacity: 0.5 + i * 0.15 }}
          />
        ))}
      </div>

      {/* timeline */}
      <div className="flex flex-col gap-2">
        {ENTRIES.map((entry, i) => (
          <div
            key={entry.label}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <span className="text-[10px] text-white/70">{entry.label}</span>
            <span className="text-[8px] tracking-[0.1em] text-white/35 uppercase">{entry.tag}</span>
          </div>
        ))}
      </div>

      {/* insight */}
      <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-2.5">
        <p className="text-[9px] leading-snug text-white/50">
          &quot;You&apos;ve checked in every morning this week.&quot;
        </p>
      </div>
    </PhoneScreen>
  );
});

export default CompanionScreen;
