"use client";

// A believable Noorva Video feed screen — real (if invented) video cards
// with source/duration metadata, rendered inside PhoneMockup.

import { Play, BadgeCheck } from "lucide-react";

const VIDEOS = [
  { title: "Why sourdough actually works", source: "Bakehouse Journal", duration: "6:12", verified: true },
  { title: "Kubernetes in 90 seconds", source: "devnotes", duration: "1:30", verified: true },
  { title: "A quieter kind of morning routine", source: "Mara Lin", duration: "4:47", verified: false },
];

export default function VideoScreen() {
  return (
    <div className="flex h-full flex-col pt-9">
      <div className="flex items-center justify-between px-5 pt-2 pb-3">
        <span className="text-[10px] font-medium text-[color:var(--ink-faint)]">9:41</span>
        <span className="text-[10px] font-semibold tracking-[0.15em] text-[color:var(--ink)] uppercase">For You</span>
        <span className="w-6" />
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-hidden px-4">
        {VIDEOS.map((v, i) => (
          <div key={i} className="flex gap-2.5">
            <div className="relative flex h-14 w-20 shrink-0 items-center justify-center rounded-lg glass-soft">
              <Play className="h-4 w-4 text-[color:var(--accent)]" fill="currentColor" strokeWidth={0} />
              <span className="absolute right-1 bottom-1 rounded bg-[color:var(--ink)] px-1 text-[7px] font-medium text-[color:var(--paper)]">
                {v.duration}
              </span>
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="truncate text-[11px] leading-snug font-medium text-[color:var(--ink)]">{v.title}</p>
              <div className="mt-1 flex items-center gap-1">
                <span className="truncate text-[9.5px] text-[color:var(--ink-faint)]">{v.source}</span>
                {v.verified && <BadgeCheck className="h-2.5 w-2.5 shrink-0 text-[color:var(--accent)]" strokeWidth={2.5} />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
