"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";

// ── Smooth count-up animation ─────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  useEffect(() => {
    if (!inView) return;
    const dur = 1800;
    const start = performance.now();
    const run = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(eased * to));
      if (t < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [inView, to]);

  return <div ref={ref} style={{ display: "inline" }}>{val.toLocaleString()}{suffix}</div>;
}

const METRICS = [
  { val: "2,400+", countTo: 2400, suffix: "+", label: "Waitlist Members", color: "#C9A838", glow: "rgba(201,168,56,0.22)",  gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.50),rgba(201,168,56,0.30)) border-box" },
  { val: "7",      countTo: 7,    suffix: "",   label: "AI Modules",       color: "#D4853A", glow: "rgba(201,168,56,0.22)", gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.50),rgba(212,133,58,0.30)) border-box" },
  { val: "∞",      countTo: null, suffix: "",   label: "Memory Depth",     color: "#9B7B2A", glow: "rgba(212,133,58,0.20)", gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(212,133,58,0.45),rgba(201,168,56,0.28)) border-box" },
  { val: "2026",   countTo: null, suffix: "",   label: "Launch Year",      color: "#22C55E", glow: "rgba(34,197,94,0.20)",  gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(34,197,94,0.40),rgba(201,168,56,0.25)) border-box" },
];

const BELIEFS = [
  {
    statement: "AI should elevate humanity, not replace it.",
    detail: "Every decision Noorva makes centers on making you more capable, more thoughtful, and more yourself.",
    color: "#C9A838",
    gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.40),rgba(201,168,56,0.22)) border-box",
    icon: (<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  },
  {
    statement: "Relationships are the foundation of growth.",
    detail: "The most transformative tool isn't a search engine or a chatbot — it's a relationship with something that truly knows you.",
    color: "#D4853A",
    gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.40),rgba(212,133,58,0.22)) border-box",
    icon: (<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M17 8C17 11.866 13.866 15 10 15S3 11.866 3 8s3.134-5 7-5 7 2.134 7 5z" stroke="currentColor" strokeWidth="1.5"/><path d="M21 16c0 2.761-2.686 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 15v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
  },
  {
    statement: "Wisdom transcends intelligence.",
    detail: "Knowing facts is easy. Understanding how they apply to your specific life, your specific moment, is wisdom. That's what we build.",
    color: "#9B7B2A",
    gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(212,133,58,0.38),rgba(201,168,56,0.22)) border-box",
    icon: (<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  },
];

export default function FutureSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section id="future" ref={ref} style={{ background: "transparent", padding: "7rem 0", overflow: "hidden", position: "relative" }}>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>

        {/* Metrics strip */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "6rem" }}
        >
          {METRICS.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.05 + i * 0.08 }}
              style={{ padding: "28px 24px", background: m.gradBorder, border: "1.5px solid transparent", borderRadius: "4px", textAlign: "center", boxShadow: "0 4px 24px rgba(201,168,56,0.08)", position: "relative", overflow: "hidden", transition: "all 0.25s ease" }}
              whileHover={{ y: -5, boxShadow: `0 20px 60px ${m.glow}` }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${m.color}, ${m.color}55)` }} />
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: `radial-gradient(circle, ${m.glow} 0%, transparent 70%)`, filter: "blur(12px)", pointerEvents: "none" }} />
              <div style={{ fontSize: "36px", fontWeight: 900, color: m.color, fontFamily: "var(--font-jakarta)", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "8px" }}>{m.val}</div>
              <div style={{ fontSize: "11px", color: "#6A5E48", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{m.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Manifesto */}
        <div style={{ textAlign: "center", marginBottom: "5rem" }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "24px", padding: "6px 14px", borderRadius: "3px", background: "rgba(201,168,56,0.07)", border: "1px solid rgba(201,168,56,0.18)" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", background: "linear-gradient(135deg, #C9A838, #D4853A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Section 06 · Our Belief</span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.1 }}
            style={{ fontSize: "clamp(2.5rem,7vw,6.5rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", color: "#F5EDD6", fontFamily: "var(--font-playfair), serif", maxWidth: "900px", margin: "0 auto 24px" }}
          >
            The future is not AI{" "}<span style={{ background: "linear-gradient(135deg, #C9A838, #D4853A, #9B7B2A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>replacing humans.</span>
          </motion.h2>
          <motion.p style={{ fontSize: "1.08rem", lineHeight: "1.75", color: "#B8A98C", maxWidth: "560px", margin: "0 auto" }} initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }}>
            The future is AI helping humans become better versions of themselves. More present. More thoughtful. More capable of the lives they envision.
          </motion.p>
        </div>

        {/* Belief cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "5rem" }}>
          {BELIEFS.map((b, i) => (
            <motion.div key={b.statement} initial={{ opacity: 0, y: 28 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 + i * 0.12 }}
              style={{ padding: "32px", background: b.gradBorder, border: "1.5px solid transparent", borderRadius: "4px", position: "relative", overflow: "hidden", boxShadow: "0 4px 24px rgba(201,168,56,0.08)", transition: "all 0.3s ease" }}
              whileHover={{ y: -6, boxShadow: `0 24px 60px rgba(${b.color === "#C9A838" ? "91,139,255" : b.color === "#D4853A" ? "155,94,245" : "217,70,239"},0.18)` }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${b.color}, ${b.color}44)` }} />
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `${b.color}0F`, color: b.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px", border: `1px solid ${b.color}20` }}>
                {b.icon}
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#F5EDD6", marginBottom: "12px", lineHeight: "1.4", fontFamily: "var(--font-jakarta)" }}>{b.statement}</h3>
              <p style={{ fontSize: "13.5px", color: "#8A7B5C", lineHeight: "1.72" }}>{b.detail}</p>
            </motion.div>
          ))}
        </div>

        {/* Big CTA */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.6 }}
          style={{ background: "linear-gradient(135deg, #C9A838 0%, #D4853A 52%, #9B7B2A 100%)", borderRadius: "36px", padding: "72px 56px", textAlign: "center", position: "relative", overflow: "hidden", boxShadow: "0 32px 80px rgba(201,168,56,0.35)" }}
        >
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.09) 1px, transparent 0)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-100px", left: "-60px", width: "360px", height: "360px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "6px 16px", borderRadius: "3px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.30)", marginBottom: "24px", backdropFilter: "blur(8px)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", animation: "glowPulse 2s infinite" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "0.08em" }}>NOW ACCEPTING EARLY ACCESS</span>
            </div>
            <h2 style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 900, color: "#F5EDD6", fontFamily: "var(--font-playfair), serif", letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: "20px" }}>Be part of the future.</h2>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.82)", marginBottom: "40px", maxWidth: "480px", margin: "0 auto 40px", lineHeight: "1.7" }}>
              Join thousands of early adopters experiencing the next evolution in human-AI companionship.
            </p>
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
              <button style={{ padding: "16px 40px", borderRadius: "3px", background: "#1A1610", color: "#D4853A", fontSize: "15px", fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "var(--font-inter)", boxShadow: "0 4px 24px rgba(0,0,0,0.20)", transition: "all 0.25s", letterSpacing: "-0.01em" }}
                onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.28)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.20)"; }}
              >Request Early Access</button>
              <button style={{ padding: "15px 36px", borderRadius: "3px", background: "rgba(255,255,255,0.12)", color: "#F5EDD6", fontSize: "15px", fontWeight: 600, border: "1.5px solid rgba(255,255,255,0.32)", cursor: "pointer", fontFamily: "var(--font-inter)", transition: "all 0.25s", backdropFilter: "blur(8px)" }}
                onClick={() => document.querySelector("#companion")?.scrollIntoView({ behavior: "smooth" })}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.24)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.transform = ""; }}
              >Learn More</button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
