"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const flowNodes = [
  { label: "You", icon: "👤", color: "#FFD700", desc: "Your unique world" },
  { label: "Conversations", icon: "💬", color: "#4D7CFF", desc: "Every dialogue matters" },
  { label: "Learning", icon: "🧠", color: "#7A5CFF", desc: "Deep pattern recognition" },
  { label: "Memory", icon: "💾", color: "#00D4FF", desc: "Contextual recall" },
  { label: "Personalization", icon: "✨", color: "#4D7CFF", desc: "Unique to you" },
  { label: "Growth", icon: "🚀", color: "#9A6CFF", desc: "Evolving intelligence" },
];

const learningAreas = [
  { label: "Preferences", pct: 94 },
  { label: "Interests", pct: 87 },
  { label: "Goals", pct: 91 },
  { label: "Behaviors", pct: 89 },
  { label: "Habits", pct: 85 },
  { label: "Challenges", pct: 96 },
];

export default function HumanAISection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <section
      id="technology"
      ref={ref}
      className="relative py-24 lg:py-36 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #050816 0%, #081120 100%)" }}
    >
      <div className="absolute inset-0 aurora-bg" />
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] glow-orb glow-orb-blue opacity-8" style={{ filter: "blur(120px)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-secondary" />
            <span className="text-xs font-semibold tracking-widest text-secondary uppercase">Section 02</span>
            <div className="h-px w-8 bg-secondary" />
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            Human Interactive{" "}
            <span className="gradient-text-blue">AI</span>
          </h2>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            AI that learns who you are — not just what you say, but who you are becoming.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Neural Flow Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative flex flex-col items-center gap-0">
              {flowNodes.map((node, i) => (
                <div key={node.label} className="relative flex flex-col items-center">
                  {/* Node */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.12 }}
                    className="relative z-10 flex items-center gap-4 glass border rounded-2xl px-6 py-4 w-full max-w-sm"
                    style={{
                      borderColor: node.color + "33",
                      background: `linear-gradient(135deg, ${node.color}08, transparent)`,
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{
                        background: `${node.color}20`,
                        boxShadow: `0 0 20px ${node.color}40`,
                      }}
                    >
                      {node.icon}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{node.label}</div>
                      <div className="text-xs text-white/40">{node.desc}</div>
                    </div>
                    {/* Side glow dot */}
                    <div
                      className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                      style={{
                        background: node.color,
                        boxShadow: `0 0 12px ${node.color}`,
                      }}
                    />
                  </motion.div>

                  {/* Connector line */}
                  {i < flowNodes.length - 1 && (
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={isInView ? { scaleY: 1 } : {}}
                      transition={{ duration: 0.4, delay: 0.55 + i * 0.12 }}
                      className="w-px h-8 origin-top"
                      style={{
                        background: `linear-gradient(to bottom, ${node.color}80, ${flowNodes[i + 1].color}80)`,
                        boxShadow: `0 0 8px ${node.color}60`,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Decorative side elements */}
            <div
              className="absolute -left-8 top-1/2 -translate-y-1/2 w-2 h-40 rounded-full opacity-30"
              style={{ background: "linear-gradient(to bottom, transparent, #4D7CFF, transparent)" }}
            />
          </motion.div>

          {/* Right — Learning Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.3 }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-3xl font-bold text-white mb-2">
                AI That Learns{" "}
                <span className="gradient-text-aurora">Who You Are</span>
              </h3>
              <p className="text-white/50 leading-relaxed">
                Unlike reactive AI, Noorva evolves through continuous interaction —
                building a deep model of your preferences, goals, and personality over time.
              </p>
            </div>

            {/* Learning bars */}
            <div className="space-y-4">
              {learningAreas.map((area, i) => (
                <motion.div
                  key={area.label}
                  initial={{ opacity: 0, x: 30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
                  className="space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white/70">{area.label}</span>
                    <span className="text-sm font-bold text-primary">{area.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: `${area.pct}%` } : {}}
                      transition={{ duration: 1.2, delay: 0.6 + i * 0.1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, #4D7CFF, #00D4FF)`,
                        boxShadow: "0 0 10px rgba(77, 124, 255, 0.5)",
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 1.2 }}
              className="glass border border-primary/20 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">Unlike reactive AI</h4>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Noorva doesn&apos;t wait to be triggered. It actively learns your patterns,
                    anticipates your needs, and evolves its understanding every day.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
