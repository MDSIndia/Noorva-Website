"use client";

// Shared gradient-border/backdrop-blur glass card idiom, lifted from
// AboutNoorvaSection.tsx's feature cards and ClosingSection.tsx's form
// panel, so new sections/pages reuse one implementation instead of hand
// copying the border-gradient + inner-panel pair each time.

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Delay this card's own reveal within a staggered parent. */
  delay?: number;
}

export default function GlassCard({ children, className = "", delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
      className="rounded-[22px] p-[1.5px]"
      style={{
        background: "linear-gradient(135deg, rgba(57,101,229,0.4), rgba(124,92,252,0.45), rgba(219,69,215,0.4))",
      }}
    >
      <div
        className={`h-full rounded-[21px] border border-white/10 bg-black/85 backdrop-blur-xl ${className}`}
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
      >
        {children}
      </div>
    </motion.div>
  );
}
