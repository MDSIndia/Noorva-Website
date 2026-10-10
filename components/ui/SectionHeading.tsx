"use client";

// Shared eyebrow + display-serif headline idiom for the light/editorial
// design — a small tracked-out accent-colored label, a Fraunces headline in
// ink with an optional accent phrase, and a muted description line.

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  accent?: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

export default function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  align = "left",
  className = "",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center items-center mx-auto" : "text-left items-start";

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ staggerChildren: 0.1 }}
      className={`flex flex-col ${alignClass} ${className}`}
    >
      {eyebrow && (
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`mb-4 flex items-center gap-2.5 ${align === "center" ? "justify-center" : ""}`}
        >
          <span className="h-px w-6" style={{ backgroundImage: "var(--accent-gradient)" }} />
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[color:var(--ink)] uppercase">{eyebrow}</p>
        </motion.div>
      )}

      <motion.h2
        variants={fadeUp}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="font-display max-w-3xl text-4xl leading-[1.1] font-normal text-[color:var(--ink)] md:text-5xl lg:text-6xl"
      >
        {title} {accent && <span>{accent}</span>}
      </motion.h2>

      {description && (
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-6 max-w-xl text-base leading-relaxed text-[color:var(--ink-soft)] md:text-lg"
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
