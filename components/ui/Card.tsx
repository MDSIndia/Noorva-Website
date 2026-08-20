"use client";

// Flat, hairline-bordered card for the light/editorial design — a thin
// accent bar reveals along the top and the card lifts slightly on hover,
// for a bit more presence than a plain static border.

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function Card({ children, className = "", delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className={`group relative overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--paper)] transition-shadow duration-300 hover:border-[color:var(--ink-faint)] hover:shadow-[0_16px_36px_-16px_var(--shadow-cool)] ${className}`}
    >
      <span
        className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
        style={{ backgroundImage: "var(--accent-gradient)" }}
      />
      {children}
    </motion.div>
  );
}
