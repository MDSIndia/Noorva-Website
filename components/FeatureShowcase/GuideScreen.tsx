"use client";

import { forwardRef } from "react";
import { Compass } from "lucide-react";
import PhoneScreen, { ScreenHeader } from "./PhoneScreen";

interface ScreenProps {
  active?: boolean;
  initiallyVisible?: boolean;
}

const PATH_STEPS = [true, true, false];

const GuideScreen = forwardRef<HTMLDivElement, ScreenProps>(function GuideScreen(
  { active = false, initiallyVisible = false },
  ref
) {
  return (
    <PhoneScreen ref={ref} active={active} initiallyVisible={initiallyVisible}>
      <ScreenHeader icon={Compass} label="Guide · Path" accent="var(--accent-2)" />

      {/* user question */}
      <div className="flex justify-end">
        <div className="relative max-w-[78%] rounded-2xl rounded-br-sm bg-white/10 px-3 py-2">
          <p className="text-[10px] leading-snug text-white/80">
            Which path is right for me?
            <span
              className="ml-0.5 inline-block h-[10px] w-[1.5px] translate-y-[2px] bg-white/60"
              style={{ animation: active ? "phone-cursor-blink 1s steps(1) infinite" : undefined }}
            />
          </p>
        </div>
      </div>

      {/* AI thinking */}
      <div className="flex items-center gap-1.5 self-start rounded-2xl bg-white/8 px-3 py-2">
        <span className="text-[9px] text-white/40">Thinking</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1 w-1 rounded-full bg-white/40"
            style={{ animation: active ? `phone-typing-dot 1.1s ease-in-out ${i * 0.15}s infinite` : undefined }}
          />
        ))}
      </div>

      {/* suggested path */}
      <div className="relative flex-1 pt-1 pl-2">
        <div
          className="absolute top-1 bottom-1 left-[19px] w-px"
          style={{ background: "linear-gradient(to bottom, var(--accent-2), transparent)", opacity: 0.6 }}
        />
        <div className="flex flex-col gap-4">
          {PATH_STEPS.map((done, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                style={{
                  borderColor: done ? "var(--accent-2)" : "rgba(255,255,255,0.15)",
                  background: done ? "color-mix(in srgb, var(--accent-2) 25%, transparent)" : "transparent",
                }}
              >
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: done ? "var(--accent-2)" : "rgba(255,255,255,0.3)" }}
                />
              </div>
              <div className="h-2 max-w-[70%] flex-1 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      {/* progress + continue */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1 w-1 rounded-full"
              style={{ background: i === 0 ? "var(--accent-2)" : "rgba(255,255,255,0.2)" }}
            />
          ))}
        </div>
        <div
          className="rounded-full px-3 py-1.5 text-[9px] font-medium text-white/90"
          style={{ background: "color-mix(in srgb, var(--accent-2) 30%, transparent)" }}
        >
          Continue
        </div>
      </div>
    </PhoneScreen>
  );
});

export default GuideScreen;
