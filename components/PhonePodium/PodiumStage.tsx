"use client";

import Image from "next/image";
import { FEATURES, ACCENT_HEX } from "../FeatureShowcase/featuresData";

interface PodiumStageProps {
  activeIndex: number;
}

const DEFAULT_ACCENT = "#4fa8d5";
const PODIUM_METAL_TOP = "#28304e";
const PODIUM_METAL_BOTTOM = "#12162a";

// Widest at the base, narrowing toward the top — the same "stepped plinth"
// silhouette as the 3D podium (Podium.tsx's TIER_SPECS), just drawn as flat
// stacked bars instead of extruded cylinders.
const TIERS = [
  { widthPct: 100, height: 14 },
  { widthPct: 74, height: 12 },
  { widthPct: 50, height: 10 },
];

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function PodiumStage({ activeIndex }: PodiumStageProps) {
  const activeFeature = FEATURES[activeIndex];
  const accentHex = ACCENT_HEX[activeFeature.accent] ?? DEFAULT_ACCENT;

  return (
    <div className="relative flex h-full w-full items-end justify-center">
      {/* Ground glow — a soft blurred halo tinted to the active feature's
          accent, standing in for the 3D version's additive ground disc. */}
      <div
        className="podium-glow pointer-events-none absolute bottom-[8%] left-1/2 h-14 w-48 -translate-x-1/2 rounded-full blur-2xl sm:h-20 sm:w-64"
        style={{ backgroundColor: accentHex }}
      />

      {/* Light beam rising from the podium's top step to meet the phone —
          a solid tinted bar masked to a soft upward taper (mask-image, not a
          gradient background, so its color stays smoothly transition-able —
          see the header logo's shimmer for the same masking trick). */}
      <div
        className="podium-beam pointer-events-none absolute bottom-[19%] left-1/2 h-[30%] w-20 -translate-x-1/2 blur-md sm:w-28"
        style={{
          backgroundColor: accentHex,
          maskImage: "linear-gradient(to top, black 0%, rgba(0,0,0,0.35) 55%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, black 0%, rgba(0,0,0,0.35) 55%, transparent 100%)",
        }}
      />

      {/* Stepped plinth — three stacked pill-shaped bars, narrowest on top,
          each with a glowing top rim tinted to the active accent. */}
      <div className="absolute bottom-[8%] left-1/2 flex w-[62%] max-w-[260px] -translate-x-1/2 flex-col-reverse items-center sm:w-[52%]">
        {TIERS.map((tier, i) => (
          <div
            key={i}
            className="podium-ring relative -mt-px rounded-full border-t-2"
            style={{
              width: `${tier.widthPct}%`,
              height: tier.height,
              background: `linear-gradient(180deg, ${PODIUM_METAL_TOP}, ${PODIUM_METAL_BOTTOM})`,
              borderColor: accentHex,
              boxShadow: `0 -2px 18px 1px ${hexToRgba(accentHex, 0.65)}, inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}
          />
        ))}
      </div>

      {/* The phones — all four mounted at once (cheap for flat DOM/CSS,
          unlike the WebGL version), crossfaded via opacity/transform so the
          swap itself is a smooth CSS transition, not a mount/unmount. */}
      <div className="relative z-10 mb-[20%] aspect-[715/1496] h-[62%] sm:h-[68%]">
        {FEATURES.map((feature, i) => {
          const isActive = i === activeIndex;
          const featureAccent = ACCENT_HEX[feature.accent] ?? DEFAULT_ACCENT;
          return (
            <div
              key={feature.title}
              className={`phone-slot absolute inset-0 ${isActive ? "opacity-100" : "pointer-events-none translate-y-3 scale-[0.94] opacity-0"}`}
            >
              {/* Two independently-timed loops, nested rather than combined
                  into one keyframe — a jellyfish's drift and its rhythmic
                  pulse never repeat in lockstep, so layering a slow
                  translate loop under a separate, differently-timed
                  rotate/scale loop reads as alive instead of a mechanical
                  back-and-forth. */}
              <div className="phone-jelly-outer h-full w-full" style={{ animationDelay: `${i * -1.9}s` }}>
                <div className="phone-jelly-inner h-full w-full" style={{ animationDelay: `${i * -1.3}s` }}>
                  <div className="phone-frame relative h-full w-full overflow-hidden rounded-[13%] border border-white/15 bg-[#1c1c1e] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]">
                    <Image
                      src={feature.screenImage.split("?")[0]}
                      alt={feature.title}
                      fill
                      sizes="(min-width: 1024px) 320px, 60vw"
                      className="object-cover"
                      priority={i === 0}
                    />
                    {/* Dynamic Island */}
                    <div className="absolute top-[3.4%] left-1/2 h-[2.4%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
                    {/* Diagonal light sweep, clipped to the frame's own
                        rounded corners by its parent's overflow-hidden. */}
                    <div
                      className="phone-sheen pointer-events-none absolute inset-0"
                      style={{ animationDelay: `${i * -1.4}s` }}
                    />
                    {/* Accent-tinted edge glow, so the active phone itself
                        (not just the podium beneath it) reads the feature's
                        color. */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-[13%] transition-[box-shadow] duration-700 ease-out"
                      style={{ boxShadow: `inset 0 0 0 1px ${hexToRgba(featureAccent, 0.5)}, inset 0 0 26px ${hexToRgba(featureAccent, 0.22)}` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
