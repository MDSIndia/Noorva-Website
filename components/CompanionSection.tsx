"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const FEATURES = [
  {
    icon: (<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 2C8.686 2 6 4.686 6 8c0 2.4 1.333 4.5 3.333 5.6V16h5.334v-2.4C16.667 12.5 18 10.4 18 8c0-3.314-2.686-6-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9 16h6v1.5a1 1 0 01-1 1h-4a1 1 0 01-1-1V16z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="8" r="2" fill="currentColor" opacity="0.5"/></svg>),
    title: "Contextual Intelligence",
    desc: "Noorva understands the full context of your life — your goals, history, preferences, and current state — making every conversation deeply relevant.",
    color: "#C9A838", bg: "rgba(201,168,56,0.08)", glow: "rgba(201,168,56,0.18)",
    gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg, rgba(201,168,56,0.45), rgba(201,168,56,0.25)) border-box",
  },
  {
    icon: (<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="1.5"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
    title: "Persistent Memory",
    desc: "Unlike other AI, Noorva remembers your story across every conversation. Your context, your milestones, your struggles — always remembered.",
    color: "#D4853A", bg: "rgba(201,168,56,0.08)", glow: "rgba(201,168,56,0.18)",
    gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg, rgba(201,168,56,0.45), rgba(212,133,58,0.25)) border-box",
  },
  {
    icon: (<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/></svg>),
    title: "Proactive Guidance",
    desc: "Noorva doesn't wait to be asked. It anticipates your needs, surfaces insights, and gently guides you toward better decisions before you even realize you need direction.",
    color: "#9B7B2A", bg: "rgba(212,133,58,0.08)", glow: "rgba(212,133,58,0.16)",
    gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg, rgba(212,133,58,0.40), rgba(201,168,56,0.25)) border-box",
  },
  {
    icon: (<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 3L4 7v5c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V7L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    title: "Private & Secure",
    desc: "Your conversations, emotions, and life story are sacred. Noorva is built with privacy-first architecture — your data stays yours, always.",
    color: "#C9A838", bg: "rgba(201,168,56,0.08)", glow: "rgba(201,168,56,0.18)",
    gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg, rgba(201,168,56,0.45), rgba(201,168,56,0.25)) border-box",
  },
];

const STEPS = [
  { num: "01", title: "You share",    desc: "Tell Noorva your goals, challenges, feelings, or simply what's on your mind.", color: "#C9A838" },
  { num: "02", title: "Noorva learns", desc: "It builds a deep model of who you are, remembering everything that matters.", color: "#D4853A" },
  { num: "03", title: "You grow",     desc: "Personalized guidance, gentle accountability, and wisdom — always available.",  color: "#9B7B2A" },
];

export default function CompanionSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section id="companion" ref={ref} style={{ background: "#1A1610", padding: "7rem 0", position: "relative" }}>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "5rem" }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "20px", padding: "6px 14px", borderRadius: "3px", background: "rgba(201,168,56,0.07)", border: "1px solid rgba(201,168,56,0.18)" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", background: "linear-gradient(135deg, #C9A838, #D4853A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Section 01 · Your Companion</span>
          </motion.div>
          <motion.h2 style={{ fontSize: "clamp(2.2rem,5vw,4.5rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, fontFamily: "var(--font-playfair), serif", color: "#F5EDD6", maxWidth: "700px", margin: "0 auto 20px" }} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 }}>
            A Companion,{" "}<span style={{ background: "linear-gradient(135deg, #C9A838, #D4853A, #9B7B2A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Not an Assistant.</span>
          </motion.h2>
          <motion.p style={{ fontSize: "1.05rem", lineHeight: "1.75", color: "#B8A98C", maxWidth: "560px", margin: "0 auto" }} initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}>
            Assistants complete tasks. Noorva understands you. There&apos;s a fundamental difference between executing commands and truly knowing someone.
          </motion.p>
        </div>

        {/* Feature grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "5rem" }}>
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 28 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
              style={{ background: f.gradBorder, border: "1.5px solid transparent", borderRadius: "4px", boxShadow: "0 4px 24px rgba(201,168,56,0.08)", overflow: "hidden", transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)", height: "100%", cursor: "default" }}
              whileHover={{ y: -6, boxShadow: `0 20px 60px ${f.glow}, 0 4px 16px rgba(201,168,56,0.11)` }}
            >
              <div style={{ height: "2px", background: `linear-gradient(90deg, ${f.color}, ${f.color}44, transparent)` }} />
              <div style={{ padding: "28px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "15px", background: f.bg, color: f.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", boxShadow: `0 4px 20px ${f.color}20`, border: `1px solid ${f.color}20` }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#F5EDD6", marginBottom: "10px", fontFamily: "var(--font-jakarta)" }}>{f.title}</h3>
                <p style={{ fontSize: "13.5px", lineHeight: "1.72", color: "#8A7B5C" }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.5 }}
          style={{ background: "linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg, rgba(201,168,56,0.30), rgba(201,168,56,0.20), rgba(212,133,58,0.18)) border-box", border: "1.5px solid transparent", borderRadius: "28px", padding: "52px", boxShadow: "0 8px 48px rgba(201,168,56,0.08)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#D4853A", boxShadow: "0 0 10px rgba(201,168,56,0.7)" }} />
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", background: "linear-gradient(135deg, #C9A838, #D4853A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>How it works</span>
          </div>
          <h3 style={{ fontSize: "clamp(1.3rem,2.5vw,2rem)", fontWeight: 700, color: "#F5EDD6", marginBottom: "44px", fontFamily: "var(--font-jakarta)", letterSpacing: "-0.018em" }}>Three simple steps to a lifelong companion</h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0", position: "relative" }}>
            <div style={{ position: "absolute", top: "22px", left: "calc(16.6% + 16px)", right: "calc(16.6% + 16px)", height: "2px", background: "linear-gradient(90deg, #C9A838, #D4853A, #9B7B2A)", borderRadius: "2px", zIndex: 0 }} />
            {STEPS.map((s, i) => (
              <div key={s.num} style={{ position: "relative", zIndex: 1, paddingRight: i < 2 ? "24px" : "0" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: `linear-gradient(135deg, ${s.color}, ${i === 0 ? "#D4853A" : i === 1 ? "#9B7B2A" : "#D4853A"})`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", boxShadow: `0 4px 20px ${s.color}50`, position: "relative", zIndex: 2 }}>
                  <span style={{ fontSize: "13px", fontWeight: 900, color: "#F5EDD6", fontFamily: "var(--font-jakarta)" }}>{s.num}</span>
                </div>
                <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#F5EDD6", marginBottom: "8px", fontFamily: "var(--font-jakarta)" }}>{s.title}</h4>
                <p style={{ fontSize: "13.5px", color: "#8A7B5C", lineHeight: "1.7" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
