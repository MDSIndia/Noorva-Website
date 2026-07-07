"use client";

import { motion } from "framer-motion";
import { Compass, GraduationCap, ListChecks, HeartHandshake, type LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: Compass,
    title: "Guide",
    body: "Helps you see the path forward when a decision feels too big to hold alone.",
  },
  {
    icon: GraduationCap,
    title: "Mentor",
    body: "Meets you where you are and grows your thinking one honest conversation at a time.",
  },
  {
    icon: ListChecks,
    title: "Planner",
    body: "Turns scattered intentions into a plan you'll actually follow through on.",
  },
  {
    icon: HeartHandshake,
    title: "Companion",
    body: "Present for the everyday moments, not just the milestones — remembering what matters to you.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative w-full overflow-hidden bg-[color:var(--bg)] py-28 md:py-36"
    >
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2">
        <div className="h-full w-full rounded-full bg-[color:var(--accent-1)]/8 blur-[140px] animate-float-slow" />
      </div>

      <motion.div
        className="relative z-10 mx-auto max-w-6xl px-8"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ staggerChildren: 0.12 }}
      >
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-5 text-center text-[10px] md:text-xs tracking-[0.5em] uppercase text-[color:var(--accent-warm)]/80 font-light"
        >
          What Noorva Becomes
        </motion.p>

        <motion.h2
          variants={fadeUp}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-center font-playfair text-3xl md:text-5xl font-light text-white/95 leading-[1.2] mb-20"
        >
          One companion. As many roles as your life needs.
        </motion.h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              transition={{ duration: 0.7, ease: "easeOut" }}
              whileHover={{ y: -6 }}
              className="group relative rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition-colors duration-300 hover:border-[color:var(--accent-warm)]/40 hover:bg-white/[0.05]"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors duration-300 group-hover:border-[color:var(--accent-warm)]/50">
                <Icon className="h-5 w-5 text-[color:var(--accent-warm)]/85" strokeWidth={1.5} />
              </div>
              <h3 className="mb-3 font-playfair text-xl font-light text-white/92">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-white/55 font-light">
                {body}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
