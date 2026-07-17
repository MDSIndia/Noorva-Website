"use client";

import { useRef, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticButtonProps {
  children: ReactNode;
  onClick?: () => void;
  /** Tints the border gradient/glow toward the current feature's accent —
   *  same retint-on-scroll treatment the rest of the caption panel gets. */
  accentHex?: string;
}

const MAGNETIC_RADIUS = 14;
const PULL_STRENGTH = 0.35;
const SPRING = { stiffness: 200, damping: 18, mass: 0.4 };

// Premium glass CTA — gradient-border wrapper + glass-fill pill, the same
// visual family ClosingSection.tsx's own waitlist button already
// established on this site (reused here rather than inventing a new
// button language), plus two things that one doesn't have: a slow
// always-on border rotation (.magnetic-btn-border, globals.css) and a
// magnetic hover — the button subtly leans toward the cursor within a
// small capped radius, springing back to center on mouseleave.
export default function MagneticButton({ children, onClick, accentHex }: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);

  const handleMouseMove = (e: ReactMouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    rawX.set(Math.max(-MAGNETIC_RADIUS, Math.min(MAGNETIC_RADIUS, relX * PULL_STRENGTH)));
    rawY.set(Math.max(-MAGNETIC_RADIUS, Math.min(MAGNETIC_RADIUS, relY * PULL_STRENGTH)));
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const glowColor = accentHex ?? "#e8b478";
  const borderGradient = `linear-gradient(135deg, ${glowColor}, #db45d7, #7c5cfc, ${glowColor})`;

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.045 }}
      whileTap={{ scale: 0.96 }}
      style={{
        x,
        y,
        background: borderGradient,
        boxShadow: `0 0 28px ${glowColor}40`,
      }}
      className="magnetic-btn-border group relative shrink-0 rounded-full p-[1.5px] transition-shadow duration-500"
    >
      <span className="btn-glow flex h-full w-full items-center justify-center gap-2 rounded-full bg-black/85 px-7 py-3 text-[11px] font-medium tracking-[0.16em] text-white/85 uppercase backdrop-blur-xl transition-colors duration-300 group-hover:bg-black/70 group-hover:text-white">
        {children}
      </span>
    </motion.button>
  );
}
