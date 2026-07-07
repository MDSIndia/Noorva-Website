"use client";

import { forwardRef } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface FeatureContentProps {
  icon: LucideIcon;
  title: string;
  body: string;
  side: "left" | "right";
  onCta: () => void;
}

const FeatureContent = forwardRef<HTMLDivElement, FeatureContentProps>(function FeatureContent(
  { icon: Icon, title, body, side, onCta },
  ref
) {
  return (
    <div
      ref={ref}
      className={`absolute inset-0 flex flex-col justify-center gap-5 ${
        side === "left" ? "items-start text-left" : "items-end text-right"
      }`}
      style={{ opacity: 0, transform: "translateY(20px)" }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
        <Icon className="h-5 w-5 text-[color:var(--accent-warm)]/85" strokeWidth={1.5} />
      </div>
      <h2 className="font-playfair text-4xl font-light text-white/95 md:text-6xl">{title}</h2>
      <p className="max-w-sm text-sm font-light text-white/55 md:text-base">{body}</p>
      <button
        onClick={onCta}
        className="group mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-[11px] font-medium tracking-[0.14em] text-white/80 uppercase backdrop-blur-xl transition-colors duration-300 hover:border-[color:var(--accent-warm)]/40 hover:text-white"
      >
        Get Started
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
      </button>
    </div>
  );
});

export default FeatureContent;
