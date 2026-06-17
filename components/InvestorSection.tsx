"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const metrics = [
  { label: "Human Interactive AI", icon: "🧠", color: "#4D7CFF", desc: "Continuously learning engine" },
  { label: "Mood Intelligence", icon: "🎭", color: "#FFD700", desc: "Emotional adaptation layer" },
  { label: "Voice Companion", icon: "🎙️", color: "#00D4FF", desc: "Always-available voice AI" },
  { label: "Source Filtering", icon: "🔍", color: "#7A5CFF", desc: "6-layer truth validation" },
  { label: "Companion Engine", icon: "🤝", color: "#9A6CFF", desc: "Personalized guidance system" },
  { label: "Future Ecosystem", icon: "🚀", color: "#4D7CFF", desc: "Expanding AI platform" },
];

const stats = [
  { value: "2026", label: "Founded", icon: "📅" },
  { value: "7+", label: "AI Modules", icon: "⚡" },
  { value: "∞", label: "Growth Cap", icon: "📈" },
  { value: "24/7", label: "Availability", icon: "🌍" },
];

export default function InvestorSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <section
      ref={ref}
      className="relative py-24 lg:py-36 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #081120 0%, #050816 50%, #081120 100%)" }}
    >
      <div className="absolute inset-0 aurora-bg" />

      {/* Large glow orbs */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] glow-orb glow-orb-blue opacity-8" style={{ filter: "blur(120px)" }} />
      <div className="absolute right-0 bottom-0 w-[400px] h-[400px] glow-orb glow-orb-purple opacity-8" style={{ filter: "blur(100px)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-accent" />
            <span className="text-xs font-semibold tracking-widest text-accent uppercase">For Investors</span>
            <div className="h-px w-8 bg-accent" />
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            Building the Next{" "}
            <span className="gradient-text-gold">Trillion Dollar</span>
            <br />
            AI Category
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Noorva isn&apos;t competing in AI — it&apos;s creating a new category:
            Human-AI Companionship. The most intimate and impactful relationship
            in the future of technology.
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass border border-white/5 rounded-2xl p-6 text-center card-hover-effect"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-black gradient-text-blue mb-1">{stat.value}</div>
              <div className="text-xs text-white/40 font-medium uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Main metrics grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.1 }}
              className="relative glass-strong border rounded-2xl p-6 card-hover-effect group overflow-hidden"
              style={{ borderColor: metric.color + "25" }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${metric.color}10 0%, transparent 60%)`,
                }}
              />
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4"
                style={{
                  background: `${metric.color}15`,
                  boxShadow: `0 0 20px ${metric.color}20`,
                  border: `1px solid ${metric.color}30`,
                }}
              >
                {metric.icon}
              </div>
              <h3 className="font-bold text-white text-lg mb-2">{metric.label}</h3>
              <p className="text-sm text-white/40">{metric.desc}</p>
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${metric.color}, transparent)` }}
              />
            </motion.div>
          ))}
        </div>

        {/* Investor message */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative glass-strong border border-accent/20 rounded-3xl p-10 lg:p-16 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">
                Noorva is Building the
                <br />
                <span className="gradient-text-gold">Next Generation</span>
                <br />
                of Human-AI Interaction
              </h3>
              <p className="text-white/50 leading-relaxed">
                The AI companion market represents the most significant human-technology
                shift since the smartphone. Every human on Earth will want — and need —
                a truly intelligent, deeply personal AI companion.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { label: "Market Opportunity", value: "Unprecedented", icon: "🌍" },
                { label: "Category Creator", value: "First Mover", icon: "🏆" },
                { label: "Defensibility", value: "Proprietary AI", icon: "🛡️" },
                { label: "Vision", value: "Trillion Dollar", icon: "💎" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-4 glass border border-white/5 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm text-white/60">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold gradient-text-gold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
