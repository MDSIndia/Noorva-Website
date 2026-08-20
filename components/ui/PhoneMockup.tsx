"use client";

// A hand-built device frame (not a photo, not an icon-in-a-circle) so the
// product sections show something that reads like an actual app screen
// rather than another abstract vector composition. Real bezel, notch,
// side buttons and a status bar — the screen content is passed in as
// children.

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
  tilt?: number;
}

export default function PhoneMockup({ children, className = "", tilt = -2 }: PhoneMockupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: tilt }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`relative mx-auto w-full max-w-[260px] ${className}`}
    >
      <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] opacity-[0.35] blur-3xl" style={{ backgroundImage: "var(--accent-gradient)" }} />

      {/* Side buttons */}
      <span className="absolute top-24 -left-[3px] h-8 w-[3px] rounded-l-sm bg-[#c9c2b6]" />
      <span className="absolute top-36 -left-[3px] h-14 w-[3px] rounded-l-sm bg-[#c9c2b6]" />
      <span className="absolute top-28 -right-[3px] h-16 w-[3px] rounded-r-sm bg-[#c9c2b6]" />

      <div
        className="relative overflow-hidden rounded-[2.6rem] border-[6px] shadow-[0_30px_60px_-24px_var(--shadow-cool)]"
        style={{ borderColor: "#1c1b1f", background: "#1c1b1f", aspectRatio: "9/19.4" }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-[color:var(--paper)]">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 z-20 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-[#1c1b1f]" />
          {children}
        </div>
      </div>
    </motion.div>
  );
}
