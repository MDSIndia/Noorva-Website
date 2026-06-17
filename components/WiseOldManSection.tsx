"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

function GuideVisual() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "480px" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "420px", height: "420px", borderRadius: "50%", border: "1px dashed rgba(201,168,56,0.28)", animation: "rotateSlow 40s linear infinite", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-5px", left: "50%", transform: "translateX(-50%)", width: "10px", height: "10px", borderRadius: "50%", background: "#C9A838", boxShadow: "0 0 20px rgba(201,168,56,0.9)" }} />
        <div style={{ position: "absolute", bottom: "-5px", left: "50%", transform: "translateX(-50%)", width: "7px", height: "7px", borderRadius: "50%", background: "#9B7B2A", boxShadow: "0 0 14px rgba(212,133,58,0.7)" }} />
      </div>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "360px", height: "360px", borderRadius: "50%", border: "1px solid rgba(201,168,56,0.18)", animation: "rotateSlowReverse 28s linear infinite", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-4px", right: "40%", width: "8px", height: "8px", borderRadius: "50%", background: "#D4853A", boxShadow: "0 0 12px rgba(201,168,56,0.7)" }} />
        <div style={{ position: "absolute", bottom: "-4px", left: "40%", width: "6px", height: "6px", borderRadius: "50%", background: "#C9A838", boxShadow: "0 0 10px rgba(201,168,56,0.6)" }} />
      </div>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "380px", height: "380px", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,56,0.10) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none", zIndex: 0 }} />

      {/* Main card */}
      <div style={{ background: "linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg, rgba(201,168,56,0.35), rgba(201,168,56,0.28), rgba(212,133,58,0.20)) border-box", border: "1.5px solid transparent", backdropFilter: "blur(20px)", borderRadius: "28px", padding: "48px 40px", boxShadow: "0 24px 80px rgba(201,168,56,0.14), 0 4px 16px rgba(201,168,56,0.08)", position: "relative", overflow: "hidden", zIndex: 1 }}>
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "240px", height: "240px", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,56,0.12) 0%, transparent 70%)", filter: "blur(30px)" }} />
        <div style={{ position: "absolute", bottom: "-30px", left: "-30px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,56,0.10) 0%, transparent 70%)", filter: "blur(24px)" }} />

        <div style={{ textAlign: "center", marginBottom: "32px", position: "relative", zIndex: 2 }}>
          <div style={{ width: "140px", height: "140px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(201,168,56,0.08), rgba(201,168,56,0.06))", margin: "0 auto 20px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 100 110" width="85" height="95" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="wf1" cx="40%" cy="30%" r="65%"><stop offset="0%" stopColor="#F0D9C0"/><stop offset="100%" stopColor="#C49468"/></radialGradient>
                <radialGradient id="wf2" cx="50%" cy="0%" r="100%"><stop offset="0%" stopColor="#CBD5E1"/><stop offset="100%" stopColor="#94A3B8"/></radialGradient>
                <radialGradient id="wf3" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#DBEAFE"/><stop offset="40%" stopColor="#C9A838"/><stop offset="100%" stopColor="#3D5FCC"/></radialGradient>
                <filter id="wg1" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <path d="M 20 110 L 25 75 C 28 65 38 58 50 55 L 50 55 C 62 58 72 65 75 75 L 80 110 Z" fill="rgba(49,46,129,0.90)"/>
              <path d="M 32 50 C 30 60 29 72 30 82 C 38 88 50 91 50 91 C 50 91 62 88 70 82 C 71 72 70 60 68 50 L 58 56 L 50 59 L 42 56 Z" fill="url(#wf2)" opacity="0.85"/>
              <ellipse cx="50" cy="36" rx="18" ry="21" fill="url(#wf1)"/>
              <ellipse cx="50" cy="19" rx="17.5" ry="12" fill="url(#wf2)" opacity="0.90"/>
              <ellipse cx="43" cy="34" rx="3.5" ry="3" fill="white" opacity="0.95"/>
              <ellipse cx="57" cy="34" rx="3.5" ry="3" fill="white" opacity="0.95"/>
              <circle cx="43" cy="34" r="2.2" fill="url(#wf3)" filter="url(#wg1)"/>
              <circle cx="57" cy="34" r="2.2" fill="url(#wf3)" filter="url(#wg1)"/>
              <circle cx="42.2" cy="33.2" r="0.7" fill="white"/>
              <circle cx="56.2" cy="33.2" r="0.7" fill="white"/>
              <circle cx="43" cy="34" r="5" fill="rgba(201,168,56,0.32)" filter="url(#wg1)"/>
              <circle cx="57" cy="34" r="5" fill="rgba(201,168,56,0.32)" filter="url(#wg1)"/>
            </svg>
            <div style={{ position: "absolute", inset: "-3px", borderRadius: "50%", border: "2px solid transparent", backgroundImage: "linear-gradient(#1A1610,#1A1610), linear-gradient(135deg, #C9A838, #D4853A, #9B7B2A)", backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box" }} />
          </div>
          <div style={{ fontSize: "19px", fontWeight: 800, color: "#F5EDD6", fontFamily: "var(--font-jakarta)", marginBottom: "4px", letterSpacing: "-0.02em" }}>The Wise Guide</div>
          <div style={{ fontSize: "13px", color: "#6A5E48" }}>Your AI Mentor &amp; Life Companion</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", position: "relative", zIndex: 2 }}>
          {[
            { val: "∞",     label: "Memory",    color: "#C9A838", bg: "rgba(201,168,56,0.07)"  },
            { val: "24/7",  label: "Available", color: "#D4853A", bg: "rgba(201,168,56,0.07)"  },
            { val: "100%",  label: "Private",   color: "#9B7B2A", bg: "rgba(212,133,58,0.07)"  },
          ].map((s) => (
            <motion.div key={s.label} whileHover={{ scale: 1.04 }}
              style={{ textAlign: "center", padding: "18px 8px", background: `linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg, ${s.color}35, ${s.color}18) border-box`, border: "1.5px solid transparent", borderRadius: "4px", transition: "box-shadow 0.3s ease", cursor: "default" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px ${s.color}20`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: "24px", fontWeight: 900, color: s.color, fontFamily: "var(--font-jakarta)", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: "10.5px", color: "#6A5E48", marginTop: "4px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating quote card */}
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", bottom: "-32px", right: "-24px", background: "linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg, rgba(201,168,56,0.40), rgba(201,168,56,0.30)) border-box", border: "1.5px solid transparent", borderRadius: "4px", padding: "18px 22px", maxWidth: "230px", boxShadow: "0 16px 48px rgba(201,168,56,0.14)", zIndex: 3 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "8px", background: "linear-gradient(135deg, #C9A838, #D4853A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(201,168,56,0.40)" }}>
            <svg viewBox="0 0 16 16" width="12" height="12" fill="white"><path d="M3 5h4v4H5C5 6.343 5.343 5 7 5V3C4.239 3 3 4.239 3 7v2h2V7l-2-2zm8 0h2C13 4.239 11.761 3 9 3v2c1.657 0 2 1.343 2 3H9v2h2V7l2-2z"/></svg>
          </div>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#C9A838", letterSpacing: "0.06em", textTransform: "uppercase" }}>Noorva</span>
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: "1.6", color: "#B8A98C", fontStyle: "italic" }}>
          &quot;Every journey becomes easier when someone truly understands where you&apos;re going.&quot;
        </p>
      </motion.div>

      {/* Floating AI Active chip */}
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        style={{ position: "absolute", top: "12%", right: "-20px", background: "linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg, rgba(34,197,94,0.40), rgba(201,168,56,0.25)) border-box", border: "1.5px solid transparent", borderRadius: "14px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 8px 28px rgba(34,197,94,0.12)", zIndex: 3 }}
      >
        <div style={{ position: "relative" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 12px rgba(34,197,94,0.9)" }} />
          <div style={{ position: "absolute", inset: "-3px", borderRadius: "50%", border: "2px solid rgba(34,197,94,0.40)", animation: "pulseRing 2s ease-out infinite" }} />
        </div>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#F5EDD6" }}>AI Active</span>
      </motion.div>
    </div>
  );
}

const WISDOM_POINTS = [
  { title: "Mentorship, not manipulation",   desc: "Noorva guides you toward your own goals — not toward what an algorithm wants you to do. Real guidance means honoring your autonomy.", color: "#C9A838" },
  { title: "Understands your history",       desc: "Like a trusted elder who has known you for years, Noorva remembers the full arc of your journey — your wins, struggles, and growth.", color: "#D4853A" },
  { title: "Speaks with wisdom",             desc: "Drawing from philosophy, psychology, and lived human experience, Noorva offers perspective that goes beyond information retrieval.",    color: "#9B7B2A" },
];

export default function WiseOldManSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section id="vision" ref={ref} style={{ background: "transparent", padding: "7rem 0", overflow: "hidden" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>

          <motion.div initial={{ opacity: 0, x: -30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} style={{ y }}>
            <GuideVisual />
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "16px", padding: "5px 14px", borderRadius: "3px", background: "rgba(201,168,56,0.07)", border: "1px solid rgba(201,168,56,0.18)" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", background: "linear-gradient(135deg, #D4853A, #9B7B2A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Section 02 · The Guide</span>
              </div>
              <h2 style={{ fontSize: "clamp(2.2rem,5vw,4.5rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, fontFamily: "var(--font-playfair), serif", color: "#F5EDD6" }}>
                Guided by wisdom.{" "}<span style={{ background: "linear-gradient(135deg, #C9A838, #D4853A, #9B7B2A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Powered by AI.</span>
              </h2>
            </motion.div>

            <motion.p style={{ fontSize: "1.05rem", lineHeight: "1.75", color: "#B8A98C" }} initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.15 }}>
              The Wise Old Man archetype — a trusted guide who has seen much, understands deeply, and speaks with clarity. Noorva embodies this ancient wisdom through modern AI.
            </motion.p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {WISDOM_POINTS.map((w, i) => (
                <motion.div key={w.title} initial={{ opacity: 0, x: 20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.25 + i * 0.1 }} whileHover={{ x: 4 }}
                  style={{ display: "flex", gap: "0", padding: "20px 22px", background: `linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg, ${w.color}30, rgba(201,168,56,0.10)) border-box`, border: "1.5px solid transparent", borderRadius: "4px", overflow: "hidden", position: "relative", transition: "box-shadow 0.3s ease", boxShadow: "0 2px 12px rgba(201,168,56,0.08)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${w.color}16`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(201,168,56,0.08)"; }}
                >
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: `linear-gradient(to bottom, ${w.color}, ${w.color}44)`, borderRadius: "0 2px 2px 0" }} />
                  <div style={{ paddingLeft: "16px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#F5EDD6", marginBottom: "6px", fontFamily: "var(--font-jakarta)" }}>{w.title}</h4>
                    <p style={{ fontSize: "13px", color: "#8A7B5C", lineHeight: "1.68" }}>{w.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.6 }}>
              <button className="btn-primary" onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}>
                Meet Your Guide
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
