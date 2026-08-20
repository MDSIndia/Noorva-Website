"use client";

// A believable Companion chat screen — real conversational copy in chat
// bubbles, not a label under an icon — rendered inside PhoneMockup.

import { Mic } from "lucide-react";

const MESSAGES = [
  { from: "noorva", text: "Morning. You've got the Kessler review at 2 — want a quick recap first?" },
  { from: "user", text: "yes please" },
  { from: "noorva", text: "Three open items, all yours. I'll remind you at 1:45." },
];

export default function CompanionScreen() {
  return (
    <div className="flex h-full flex-col pt-9">
      <div className="flex items-center justify-between px-5 pt-2 pb-3">
        <span className="text-[10px] font-medium text-[color:var(--ink-faint)]">9:41</span>
        <span className="text-[10px] font-semibold tracking-[0.15em] text-[color:var(--ink)] uppercase">Noorva</span>
        <span className="w-6" />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-hidden px-4">
        {MESSAGES.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[11.5px] leading-snug ${
                m.from === "user"
                  ? "rounded-br-sm bg-[color:var(--ink)] text-[color:var(--paper)]"
                  : "rounded-bl-sm border border-[color:var(--line)] bg-[color:var(--paper-dim)] text-[color:var(--ink)]"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-[color:var(--line)] px-4 py-3">
        <div className="flex-1 rounded-full border border-[color:var(--line)] px-3.5 py-2 text-[10px] text-[color:var(--ink-faint)]">
          Ask Noorva anything…
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundImage: "var(--accent-gradient)" }}>
          <Mic className="h-3.5 w-3.5 text-white" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
