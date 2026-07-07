"use client";

import { forwardRef } from "react";
import { MessageCircle } from "lucide-react";
import PhoneScreen, { ScreenHeader, TypingDots } from "./PhoneScreen";

interface ScreenProps {
  active?: boolean;
}

const WAVE_HEIGHTS = [6, 14, 9, 18, 11, 16, 7];

const MentorScreen = forwardRef<HTMLDivElement, ScreenProps>(function MentorScreen({ active = false }, ref) {
  return (
    <PhoneScreen ref={ref} active={active}>
      <ScreenHeader icon={MessageCircle} label="Mentor · Chat" accent="var(--accent-1)" />

      <div className="flex flex-col gap-2.5">
        <div className="max-w-[70%] self-start rounded-2xl rounded-bl-sm bg-white/8 px-3 py-2">
          <p className="text-[10px] leading-snug text-white/75">What should I focus on this week?</p>
        </div>
        <div
          className="max-w-[65%] self-end rounded-2xl rounded-br-sm px-3 py-2"
          style={{ background: "color-mix(in srgb, var(--accent-1) 28%, transparent)" }}
        >
          <p className="text-[10px] leading-snug text-white/85">Start with the one thing you keep avoiding.</p>
        </div>
      </div>

      {/* voice waveform */}
      <div className="mt-1 flex items-end gap-[3px] self-start rounded-2xl bg-white/6 px-3 py-2.5">
        {WAVE_HEIGHTS.map((h, i) => (
          <span
            key={i}
            className="w-[3px] origin-bottom rounded-full"
            style={{
              height: h,
              background: "var(--accent-1)",
              opacity: 0.8,
              animation: active ? `phone-waveform 1.2s ease-in-out ${i * 0.08}s infinite` : undefined,
            }}
          />
        ))}
      </div>

      <div className="flex-1" />

      <div className="self-start rounded-2xl bg-white/8 px-3 py-2">
        <TypingDots active={active} />
      </div>
    </PhoneScreen>
  );
});

export default MentorScreen;
