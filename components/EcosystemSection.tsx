"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const MODULES = [
  { icon: "🧠", title: "Deep Memory",       desc: "Persistent context across all conversations. Noorva remembers everything — your goals, fears, milestones, and patterns.", color: "#C9A838", bg: "rgba(201,168,56,0.08)",  glow: "rgba(201,168,56,0.20)",  tag: "Core",         gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.45),rgba(201,168,56,0.25)) border-box" },
  { icon: "💬", title: "Voice Companion",   desc: "Natural, fluid voice conversations. Speak freely and Noorva responds with the warmth of a trusted friend.",               color: "#D4853A", bg: "rgba(201,168,56,0.08)", glow: "rgba(201,168,56,0.20)", tag: "Core",         gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.45),rgba(212,133,58,0.28)) border-box" },
  { icon: "🎯", title: "Goal Architect",    desc: "Turn vague ambitions into clear milestones. Noorva breaks down big dreams into daily, achievable actions.",               color: "#9B7B2A", bg: "rgba(212,133,58,0.08)", glow: "rgba(212,133,58,0.18)", tag: "Planning",     gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(212,133,58,0.40),rgba(201,168,56,0.28)) border-box" },
  { icon: "🌡️", title: "Emotional Compass", desc: "Pattern-based emotional intelligence. Noorva understands how you feel — even when you struggle to say it.",              color: "#C9A838", bg: "rgba(201,168,56,0.08)",  glow: "rgba(201,168,56,0.20)",  tag: "Wellness",     gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.45),rgba(201,168,56,0.25)) border-box" },
  { icon: "📚", title: "Knowledge Curator", desc: "Filtered, verified information relevant to your specific context. No noise, no clickbait — only what matters.",         color: "#D4853A", bg: "rgba(201,168,56,0.08)", glow: "rgba(201,168,56,0.20)", tag: "Intelligence", gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.45),rgba(212,133,58,0.28)) border-box" },
  { icon: "🔮", title: "Future Planner",    desc: "Long-horizon thinking. Noorva helps you see the full trajectory of your decisions and plan accordingly.",                color: "#9B7B2A", bg: "rgba(212,133,58,0.08)", glow: "rgba(212,133,58,0.18)", tag: "Planning",     gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(212,133,58,0.40),rgba(201,168,56,0.28)) border-box" },
  { icon: "🌙", title: "Reflection Engine", desc: "Daily and weekly reviews that surface patterns, celebrate wins, and gently surface areas for growth.",                   color: "#C9A838", bg: "rgba(201,168,56,0.08)",  glow: "rgba(201,168,56,0.20)",  tag: "Wellness",     gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.45),rgba(201,168,56,0.25)) border-box" },
];

export default function EcosystemSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section id="features" ref={ref} style={{ background: "#1A1610", padding: "7rem 0", position: "relative" }}>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "end", marginBottom: "56px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "16px", padding: "5px 14px", borderRadius: "3px", background: "rgba(201,168,56,0.07)", border: "1px solid rgba(201,168,56,0.18)" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", background: "linear-gradient(135deg, #D4853A, #9B7B2A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Section 05 · Ecosystem</span>
            </div>
            <h2 style={{ fontSize: "clamp(2.2rem,5vw,4.5rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, fontFamily: "var(--font-playfair), serif", color: "#F5EDD6" }}>
              Your complete{" "}<span style={{ background: "linear-gradient(135deg, #C9A838, #D4853A, #9B7B2A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>life partner.</span>
            </h2>
          </motion.div>
          <motion.p style={{ fontSize: "1.05rem", lineHeight: "1.75", color: "#B8A98C" }} initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.15 }}>
            Seven specialized AI modules working in harmony — each mastering a different dimension of being a true companion.
          </motion.p>
        </div>

        {/* Bento grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "16px" }}>

          {/* Row 1: Big left (spans 5), medium (spans 4), small (spans 3) */}
          {[0,1,2].map((idx) => {
            const m = MODULES[idx];
            const spans = [5, 4, 3];
            const isLarge = idx === 0;
            return (
              <motion.div key={m.title} initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.05 + idx * 0.08 }}
                style={{ gridColumn: `span ${spans[idx]}`, background: m.gradBorder, border: "1.5px solid transparent", borderRadius: "22px", padding: isLarge ? "32px" : "28px", position: "relative", overflow: "hidden", boxShadow: "0 4px 20px rgba(201,168,56,0.08)", transition: "all 0.3s ease", cursor: "default", minHeight: "200px" }}
                whileHover={{ y: -5, boxShadow: `0 20px 60px ${m.glow}` }}
              >
                <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", borderRadius: "50%", background: `radial-gradient(circle, ${m.glow} 0%, transparent 70%)`, filter: "blur(16px)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: "16px", right: "16px", padding: "3px 10px", borderRadius: "3px", background: m.bg, color: m.color, fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.07em" }}>{m.tag}</div>
                <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "16px", border: `1px solid ${m.color}18` }}>{m.icon}</div>
                <h3 style={{ fontSize: isLarge ? "17px" : "15px", fontWeight: 700, color: "#F5EDD6", marginBottom: "8px", fontFamily: "var(--font-jakarta)" }}>{m.title}</h3>
                <p style={{ fontSize: "13px", lineHeight: "1.70", color: "#8A7B5C" }}>{m.desc}</p>
                <div style={{ marginTop: "18px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: m.color, boxShadow: `0 0 8px ${m.color}` }} />
                  <span style={{ fontSize: "10.5px", fontWeight: 600, color: m.color, letterSpacing: "0.04em" }}>Active Module</span>
                </div>
              </motion.div>
            );
          })}

          {/* Row 2: small (3), medium (4), big right (5) */}
          {[2,1,0].map((spanIdx, i) => {
            const m = MODULES[i + 3];
            const spans = [3, 4, 5];
            const isLarge = i === 2;
            return (
              <motion.div key={m.title} initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.25 + i * 0.08 }}
                style={{ gridColumn: `span ${spans[i]}`, background: m.gradBorder, border: "1.5px solid transparent", borderRadius: "22px", padding: isLarge ? "32px" : "28px", position: "relative", overflow: "hidden", boxShadow: "0 4px 20px rgba(201,168,56,0.08)", transition: "all 0.3s ease", cursor: "default", minHeight: "200px" }}
                whileHover={{ y: -5, boxShadow: `0 20px 60px ${m.glow}` }}
              >
                <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", borderRadius: "50%", background: `radial-gradient(circle, ${m.glow} 0%, transparent 70%)`, filter: "blur(16px)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: "16px", right: "16px", padding: "3px 10px", borderRadius: "3px", background: m.bg, color: m.color, fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.07em" }}>{m.tag}</div>
                <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "16px", border: `1px solid ${m.color}18` }}>{m.icon}</div>
                <h3 style={{ fontSize: isLarge ? "17px" : "15px", fontWeight: 700, color: "#F5EDD6", marginBottom: "8px", fontFamily: "var(--font-jakarta)" }}>{m.title}</h3>
                <p style={{ fontSize: "13px", lineHeight: "1.70", color: "#8A7B5C" }}>{m.desc}</p>
                <div style={{ marginTop: "18px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: m.color, boxShadow: `0 0 8px ${m.color}` }} />
                  <span style={{ fontSize: "10.5px", fontWeight: 600, color: m.color, letterSpacing: "0.04em" }}>Active Module</span>
                </div>
              </motion.div>
            );
          })}

          {/* Full-width CTA row — last module + CTA */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.5 }}
            style={{ gridColumn: "span 5", background: MODULES[6].gradBorder, border: "1.5px solid transparent", borderRadius: "22px", padding: "28px", position: "relative", overflow: "hidden", boxShadow: "0 4px 20px rgba(201,168,56,0.08)", transition: "all 0.3s ease", cursor: "default", minHeight: "160px" }}
            whileHover={{ y: -5, boxShadow: `0 20px 60px ${MODULES[6].glow}` }}
          >
            <div style={{ position: "absolute", top: "16px", right: "16px", padding: "3px 10px", borderRadius: "3px", background: MODULES[6].bg, color: MODULES[6].color, fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.07em" }}>{MODULES[6].tag}</div>
            <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: MODULES[6].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "16px" }}>{MODULES[6].icon}</div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#F5EDD6", marginBottom: "8px", fontFamily: "var(--font-jakarta)" }}>{MODULES[6].title}</h3>
            <p style={{ fontSize: "13px", lineHeight: "1.70", color: "#8A7B5C" }}>{MODULES[6].desc}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.6 }}
            style={{ gridColumn: "span 7", background: "linear-gradient(135deg, #C9A838 0%, #D4853A 52%, #9B7B2A 100%)", borderRadius: "22px", padding: "36px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 12px 48px rgba(201,168,56,0.35)", position: "relative", overflow: "hidden", minHeight: "160px" }}
          >
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)", backgroundSize: "24px 24px", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginBottom: "8px" }}>Everything included</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#F5EDD6", fontFamily: "var(--font-jakarta)", letterSpacing: "-0.02em", marginBottom: "4px" }}>All 7 modules. One companion.</div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.70)" }}>No configuration. Just connection.</div>
            </div>
            <button
              onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
              style={{ alignSelf: "flex-start", marginTop: "20px", padding: "12px 28px", borderRadius: "3px", background: "#1A1610", color: "#D4853A", fontSize: "14px", fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "var(--font-inter)", boxShadow: "0 4px 20px rgba(0,0,0,0.18)", transition: "all 0.25s", display: "inline-flex", alignItems: "center", gap: "8px", position: "relative" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.18)"; }}
            >
              Get Early Access
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
