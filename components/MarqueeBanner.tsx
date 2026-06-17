"use client";

import { motion } from "framer-motion";

const items = [
  "Human Interactive AI",
  "Mood Based Intelligence",
  "Voice Companion",
  "Source Filtering",
  "Noorva Guide",
  "Smart Reminders",
  "Personalized Growth",
  "The Future of AI",
  "Human-AI Companionship",
  "Next Generation Intelligence",
];

export default function MarqueeBanner() {
  const doubled = [...items, ...items];

  return (
    <div
      className="relative py-4 overflow-hidden border-y border-white/5"
      style={{ background: "rgba(77, 124, 255, 0.04)" }}
    >
      <motion.div
        animate={{ x: [0, -50 * items.length * 8] }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex items-center gap-0 whitespace-nowrap"
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="text-xs font-semibold text-white/30 uppercase tracking-widest px-8">
              {item}
            </span>
            <span className="text-primary/40 text-xs">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
