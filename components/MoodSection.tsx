"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const MOODS = [
  {
    key: "morning", label: "Morning", time: "06:00 — 11:00", emoji: "🌅",
    title: "Focused & Energized",
    desc: "Noorva matches your morning momentum with structured, goal-oriented conversations.",
    accent: "#C9A838", accentLight: "rgba(201,168,56,0.09)",
    gradBorder: "linear-gradient(rgba(247,250,255,0.97), rgba(247,250,255,0.97)) padding-box, linear-gradient(135deg, rgba(201,168,56,0.35), rgba(201,168,56,0.22)) border-box",
    chat: [
      { role: "user", text: "What should I focus on today?" },
      { role: "ai",   text: "Based on your goals, I'd prioritize the client presentation — your energy is highest now. Perfect for deep work." },
      { role: "user", text: "Should I check emails first?" },
      { role: "ai",   text: "Let's protect this golden hour. Schedule email at 10am so your peak focus goes to what matters most." },
    ],
  },
  {
    key: "afternoon", label: "Afternoon", time: "12:00 — 17:00", emoji: "☀️",
    title: "Productive & Sharp",
    desc: "Peak work hours. Noorva keeps you in flow, solving problems and maintaining clarity.",
    accent: "#D4853A", accentLight: "rgba(201,168,56,0.09)",
    gradBorder: "linear-gradient(rgba(249,247,255,0.97), rgba(249,247,255,0.97)) padding-box, linear-gradient(135deg, rgba(201,168,56,0.35), rgba(212,133,58,0.22)) border-box",
    chat: [
      { role: "user", text: "I've been stuck on this problem for 2 hours." },
      { role: "ai",   text: "Let's break it down. What's the core blocker — technical constraint or unclear requirements?" },
      { role: "user", text: "Unclear requirements, I think." },
      { role: "ai",   text: "Classic root cause. Let's write the simplest version that could work, then validate with your team." },
    ],
  },
  {
    key: "evening", label: "Evening", time: "18:00 — 21:00", emoji: "🌆",
    title: "Reflective & Calm",
    desc: "Time to unwind. Noorva shifts to a warm, reflective tone — reviewing your day.",
    accent: "#9B7B2A", accentLight: "rgba(212,133,58,0.09)",
    gradBorder: "linear-gradient(rgba(252,247,255,0.97), rgba(252,247,255,0.97)) padding-box, linear-gradient(135deg, rgba(212,133,58,0.35), rgba(201,168,56,0.22)) border-box",
    chat: [
      { role: "user", text: "How was my day overall?" },
      { role: "ai",   text: "You completed 9 of 10 tasks and had a strong focus block from 9–11am. One thing I noticed: you seem tense this week." },
      { role: "user", text: "Yeah, big deadline looming." },
      { role: "ai",   text: "You've navigated bigger ones. Let's plan tomorrow a bit lighter — protect at least one hour for yourself." },
    ],
  },
  {
    key: "night", label: "Night", time: "22:00 — 05:00", emoji: "🌙",
    title: "Gentle & Present",
    desc: "Late hours call for gentleness. Noorva becomes a quiet companion — never overwhelming.",
    accent: "#C9A838", accentLight: "rgba(201,168,56,0.07)",
    gradBorder: "linear-gradient(rgba(247,249,255,0.97), rgba(247,249,255,0.97)) padding-box, linear-gradient(135deg, rgba(201,168,56,0.30), rgba(201,168,56,0.20)) border-box",
    chat: [
      { role: "user", text: "Can't stop overthinking everything." },
      { role: "ai",   text: "I hear you. Let's not try to solve it all tonight. What's the one thing weighing on you most right now?" },
      { role: "user", text: "Not sure I'm on the right path." },
      { role: "ai",   text: "That feeling is valid — and also not permanent. You don't need clarity tonight. Just rest. We'll explore this together." },
    ],
  },
];

function ChatPreview({ mood }: { mood: typeof MOODS[0] }) {
  return (
    <div style={{ background: "linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.7)) border-box", border: "1px solid rgba(255,255,255,0.60)", backdropFilter: "blur(16px)", borderRadius: "4px", boxShadow: `0 8px 32px rgba(201,168,56,0.13)`, overflow: "hidden", height: "100%" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(201,168,56,0.10)", display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.70)" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #C9A838, #D4853A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(201,168,56,0.40)" }}>
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none"><path d="M10 2C7.343 2 5 4.343 5 7c0 1.943 1.09 3.64 2.7 4.53V13.5h4.6V11.53C13.91 10.64 15 8.943 15 7c0-2.657-2.343-5-5-5z" fill="white" opacity="0.9"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#F5EDD6" }}>Noorva</div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22C55E", animation: "glowPulse 2s infinite" }} />
            <span style={{ fontSize: "10px", color: "#6A5E48" }}>adapting to {mood.label.toLowerCase()} mode</span>
          </div>
        </div>
        <div style={{ padding: "4px 10px", borderRadius: "3px", background: mood.accentLight, border: `1px solid ${mood.accent}28`, fontSize: "9.5px", fontWeight: 700, color: mood.accent, letterSpacing: "0.06em" }}>
          {mood.time.split("—")[0].trim()}
        </div>
      </div>
      <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {mood.chat.map((msg, i) => (
          <motion.div key={`${mood.key}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.1 }} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "ai" && (
              <div style={{ width: "22px", height: "22px", borderRadius: "7px", background: "linear-gradient(135deg, #C9A838, #D4853A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: "7px", marginTop: "2px", boxShadow: "0 3px 10px rgba(201,168,56,0.35)" }}>
                <svg viewBox="0 0 12 12" width="9" height="9" fill="none"><circle cx="6" cy="5" r="2.5" stroke="white" strokeWidth="1"/></svg>
              </div>
            )}
            <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>{msg.text}</div>
          </motion.div>
        ))}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: mood.chat.length * 0.1 + 0.2 }} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <div style={{ width: "22px", height: "22px", borderRadius: "7px", background: "linear-gradient(135deg, #C9A838, #D4853A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg viewBox="0 0 12 12" width="9" height="9" fill="none"><circle cx="6" cy="5" r="2.5" stroke="white" strokeWidth="1"/></svg>
          </div>
          <div style={{ background: "rgba(201,168,56,0.08)", border: "1px solid rgba(201,168,56,0.11)", borderRadius: "14px", padding: "9px 14px", display: "flex", gap: "4px", alignItems: "center" }}>
            {[0, 1, 2].map((d) => (
              <motion.div key={d} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }} style={{ width: "5px", height: "5px", borderRadius: "50%", background: mood.accent }} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function MoodSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [activeMood, setActiveMood] = useState(0);
  const mood = MOODS[activeMood];

  return (
    <section id="mood" ref={ref} style={{ background: "transparent", padding: "7rem 0" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "20px", padding: "5px 14px", borderRadius: "3px", background: "rgba(201,168,56,0.07)", border: "1px solid rgba(201,168,56,0.18)" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", background: "linear-gradient(135deg, #D4853A, #9B7B2A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Section 03 · Mood Intelligence</span>
          </motion.div>
          <motion.h2 style={{ fontSize: "clamp(2.2rem,5vw,4.5rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, fontFamily: "var(--font-playfair), serif", color: "#F5EDD6", maxWidth: "640px", margin: "0 auto 20px" }} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 }}>
            Adapts to your{" "}<span style={{ background: "linear-gradient(135deg, #D4853A, #9B7B2A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>energy, every hour.</span>
          </motion.h2>
          <motion.p style={{ fontSize: "1.05rem", lineHeight: "1.75", color: "#B8A98C", maxWidth: "520px", margin: "0 auto" }} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.6, delay: 0.2 }}>
            Noorva senses the time of day and your emotional state, adapting its tone, depth, and focus to match exactly where you are.
          </motion.p>
        </div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }} style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "40px", flexWrap: "wrap" }}>
          {MOODS.map((m, i) => (
            <button key={m.key} onClick={() => setActiveMood(i)}
              style={{ padding: "10px 22px", borderRadius: "3px", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.25s",
                background: activeMood === i ? `linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg,${m.accent},${m.accent}88) border-box` : "linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg,rgba(201,168,56,0.13),rgba(201,168,56,0.10)) border-box",
                border: "1.5px solid transparent",
                color: activeMood === i ? m.accent : "#6A5E48",
                boxShadow: activeMood === i ? `0 4px 20px ${m.accent}22` : "none",
                transform: activeMood === i ? "translateY(-1px)" : "none",
              }}>
              {m.emoji} {m.label}
            </button>
          ))}
        </motion.div>

        {/* Main card */}
        <AnimatePresence mode="wait">
          <motion.div key={activeMood} initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.98 }} transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ background: mood.gradBorder, border: "1.5px solid transparent", borderRadius: "32px", padding: "48px", boxShadow: `0 24px 80px rgba(201,168,56,0.11), 0 4px 20px ${mood.accentLight}`, display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "48px", alignItems: "stretch", minHeight: "380px" }}
          >
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "52px", marginBottom: "20px" }}>{mood.emoji}</div>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: mood.accent, marginBottom: "10px" }}>{mood.time}</div>
                <h3 style={{ fontSize: "clamp(1.5rem,3vw,2.4rem)", fontWeight: 800, color: "#F5EDD6", fontFamily: "var(--font-jakarta)", lineHeight: 1.15, letterSpacing: "-0.025em", marginBottom: "14px" }}>{mood.title}</h3>
                <p style={{ fontSize: "14.5px", lineHeight: "1.7", color: "#8A7B5C" }}>{mood.desc}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px", padding: "12px 16px", background: "rgba(255,255,255,0.80)", backdropFilter: "blur(8px)", borderRadius: "14px", border: "1px solid rgba(201,168,56,0.11)", width: "fit-content", boxShadow: "0 2px 8px rgba(201,168,56,0.08)" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", animation: "glowPulse 2s infinite" }} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#E0D4B8" }}>Adapting right now</span>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={`chat-${activeMood}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.35 }}>
                <ChatPreview mood={mood} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.6, delay: 0.7 }} style={{ textAlign: "center", marginTop: "36px" }}>
          <p style={{ fontSize: "13.5px", color: "#6A5E48" }}>
            Mood intelligence is automatic — no configuration needed. Noorva senses it naturally.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
