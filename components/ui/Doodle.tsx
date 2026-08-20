"use client";

// Small hand-drawn-style SVG marks — a loose circle and an underline
// scribble — used sparingly to break up the site's otherwise very regular
// grid rhythm. Rough, single-stroke paths (not perfect geometry) so they
// read as marked by hand rather than generated. Stroked with the brand
// gradient rather than a flat color, to match the button/text treatment.

import { motion } from "framer-motion";

function GradientDef({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--accent-1)" />
        <stop offset="50%" stopColor="var(--accent-2)" />
        <stop offset="100%" stopColor="var(--accent-3)" />
      </linearGradient>
    </defs>
  );
}

export function CircleDoodle({ className = "" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 200 90"
      fill="none"
      className={className}
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: "easeInOut", delay: 0.3 }}
    >
      <GradientDef id="circle-doodle-gradient" />
      <motion.path
        d="M18 45C14 25 40 8 92 6C150 4 186 20 182 44C178 70 132 84 88 83C46 82 10 68 12 50C14 34 46 22 96 22C142 22 178 34 176 48"
        stroke="url(#circle-doodle-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}

export function UnderlineDoodle({ className = "" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 220 16"
      fill="none"
      className={className}
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeInOut", delay: 0.4 }}
    >
      <GradientDef id="underline-doodle-gradient" />
      <motion.path
        d="M3 10.5C40 4 90 2 121 6.5C152 11 180 4 217 7"
        stroke="url(#underline-doodle-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}
