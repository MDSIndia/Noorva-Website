"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// ── Live conversation shown inside the product window ─────────────────────
const CHAT = [
  { from: "ai",   text: "Good morning. Your focus pattern looks different today — more settled. I think you're entering a flow state." },
  { from: "user", text: "I want to write, but I keep second-guessing every sentence." },
  { from: "ai",   text: "I noticed this same block three weeks ago. You broke it by giving yourself permission to write badly. Want to try that again?" },
];

function AIAvatar() {
  return (
    <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: "linear-gradient(135deg,#C9A838,#D4853A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 10px rgba(201,168,56,0.45)" }}>
      <svg viewBox="0 0 12 12" width="9" height="9" fill="none"><circle cx="6" cy="5.5" r="2.6" stroke="white" strokeWidth="1.2"/></svg>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: "4px", padding: "10px 14px", background: "rgba(201,168,56,0.08)", borderRadius: "14px 14px 14px 4px", width: "fit-content" }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.13 }}
          style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#D4853A" }} />
      ))}
    </div>
  );
}

// ── The main product UI – glass window with live chat ─────────────────────
function ProductWindow() {
  const [shown, setShown] = useState(1);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const run = [
      [900,  () => setTyping(true)],
      [2200, () => { setTyping(false); setShown(2); }],
      [3400, () => setTyping(true)],
      [4800, () => { setTyping(false); setShown(3); }],
    ] as [number, () => void][];
    const ts = run.map(([d, fn]) => setTimeout(fn, d));
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "470px" }}>


      {/* ── Memory card partially behind – creates depth ── */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.6 }}
        style={{ position: "absolute", top: "14px", left: "-32px", width: "198px", background: "#1A1610", borderRadius: "4px", boxShadow: "0 8px 32px rgba(201,168,56,0.14), 0 0 0 1px rgba(201,168,56,0.12)", padding: "14px 16px", zIndex: 0 }}
      >
        <div style={{ fontSize: "9px", fontWeight: 700, color: "#6A5E48", letterSpacing: "0.10em", marginBottom: "9px", textTransform: "uppercase" }}>Long-term Memory</div>
        {[["#C9A838","Career goals"], ["#D4853A","Creative projects"], ["#9B7B2A","Personal growth"], ["#C9A838","Daily patterns"]].map(([col, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "6px" }}>
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: col, flexShrink: 0 }} />
            <span style={{ fontSize: "11px", color: "#E0D4B8", fontWeight: 500 }}>{label}</span>
          </div>
        ))}
        <div style={{ marginTop: "10px", height: "1px", background: "rgba(201,168,56,0.10)" }} />
        <div style={{ marginTop: "8px", fontSize: "9.5px", fontWeight: 700, color: "#D4853A" }}>847 moments stored</div>
      </motion.div>

      {/* ── Main chat window ── */}
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.2 }}
        style={{ position: "relative", zIndex: 1, background: "#1A1610", borderRadius: "4px", overflow: "hidden", boxShadow: "0 50px 120px rgba(201,168,56,0.28), 0 16px 48px rgba(0,0,0,0.11), 0 0 0 1px rgba(201,168,56,0.16)", transform: "perspective(1400px) rotateX(2deg) rotateY(-7deg)" }}
      >
        {/* Top gradient accent bar */}
        <div style={{ height: "2.5px", background: "linear-gradient(90deg,#C9A838,#D4853A,#9B7B2A)" }} />

        {/* MacOS-style header */}
        <div style={{ padding: "13px 18px", background: "rgba(20,16,9,0.98)", borderBottom: "1px solid rgba(201,168,56,0.09)", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", gap: "5px" }}>
            {["#FF5F57","#FEBC2E","#28C840"].map(c => <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />)}
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#F5EDD6", letterSpacing: "-0.01em" }}>Noorva</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.9)", animation: "glowPulse 2s infinite" }} />
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#22C55E" }}>Listening</span>
          </div>
        </div>

        {/* Context chips */}
        <div style={{ padding: "8px 16px", background: "rgba(201,168,56,0.03)", borderBottom: "1px solid rgba(201,168,56,0.09)", display: "flex", gap: "6px" }}>
          {[["🧠","847 memories"],["🌅","Focus mode"],["✍️","Novel project"]].map(([icon, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "3px 9px", borderRadius: "3px", background: "rgba(201,168,56,0.07)", border: "1px solid rgba(201,168,56,0.13)", fontSize: "9.5px", fontWeight: 600, color: "#8A7B5C", whiteSpace: "nowrap" }}>
              <span style={{ fontSize: "11px" }}>{icon}</span>{label}
            </div>
          ))}
        </div>

        {/* Messages */}
        <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: "11px", minHeight: "235px" }}>
          <AnimatePresence>
            {CHAT.slice(0, shown).map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "7px" }}
              >
                {msg.from === "ai" && <AIAvatar />}
                <div style={msg.from === "user"
                  ? { background: "linear-gradient(135deg,#C9A838,#D4853A)", color: "#F5EDD6", padding: "9px 13px", borderRadius: "16px 16px 4px 16px", fontSize: "12px", lineHeight: "1.55", maxWidth: "84%", boxShadow: "0 4px 14px rgba(201,168,56,0.32)" }
                  : { background: "rgba(201,168,56,0.07)", color: "#F5EDD6", padding: "9px 13px", borderRadius: "16px 16px 16px 4px", fontSize: "12px", lineHeight: "1.57", maxWidth: "90%" }
                }>{msg.text}</div>
              </motion.div>
            ))}
          </AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", alignItems: "flex-end", gap: "7px" }}>
              <AIAvatar /><TypingDots />
            </motion.div>
          )}
        </div>

        {/* Input bar */}
        <div style={{ padding: "11px 14px", borderTop: "1px solid rgba(201,168,56,0.10)", display: "flex", gap: "9px", alignItems: "center", background: "rgba(20,16,9,0.98)" }}>
          <div style={{ flex: 1, background: "rgba(201,168,56,0.08)", borderRadius: "11px", padding: "9px 13px", fontSize: "12px", color: "#6A5E48", border: "1px solid rgba(201,168,56,0.10)" }}>Ask Noorva anything…</div>
          <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg,#C9A838,#D4853A)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 12px rgba(201,168,56,0.42)", cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M14 2L2 8L7 9.5M14 2L9.5 14L7 9.5M14 2L7 9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </motion.div>

      {/* ── Floating chips ── */}
      <motion.div animate={{ y: [0,-9,0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        style={{ position: "absolute", top: "-18px", right: "20px", zIndex: 3, background: "linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg,rgba(201,168,56,0.50),rgba(201,168,56,0.34)) border-box", border: "1.5px solid transparent", borderRadius: "4px", padding: "9px 14px", boxShadow: "0 12px 36px rgba(0,0,0,0.40)", display: "flex", alignItems: "center", gap: "8px" }}
      >
        <span style={{ fontSize: "14px" }}>✨</span>
        <div>
          <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#F5EDD6" }}>AI Insight Ready</div>
          <div style={{ fontSize: "9px", color: "#6A5E48" }}>Based on 847 memories</div>
        </div>
      </motion.div>

      <motion.div animate={{ y: [0,-7,0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        style={{ position: "absolute", bottom: "18px", right: "-36px", zIndex: 3, background: "linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg,rgba(34,197,94,0.40),rgba(201,168,56,0.24)) border-box", border: "1.5px solid transparent", borderRadius: "3px", padding: "9px 16px", boxShadow: "0 10px 32px rgba(0,0,0,0.40)", display: "flex", alignItems: "center", gap: "8px" }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 12px rgba(34,197,94,0.9)" }} />
          <div style={{ position: "absolute", inset: "-3px", borderRadius: "50%", border: "2px solid rgba(34,197,94,0.38)", animation: "pulseRing 2s ease-out infinite" }} />
        </div>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#F5EDD6" }}>7 modules active</span>
      </motion.div>

      <motion.div animate={{ y: [0,-8,0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{ position: "absolute", bottom: "90px", left: "-20px", zIndex: 3, background: "linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg,rgba(212,133,58,0.42),rgba(201,168,56,0.28)) border-box", border: "1.5px solid transparent", borderRadius: "3px", padding: "9px 13px", boxShadow: "0 10px 32px rgba(0,0,0,0.40)", display: "flex", alignItems: "center", gap: "7px" }}
      >
        <span style={{ fontSize: "14px" }}>🌅</span>
        <div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#F5EDD6" }}>Morning Mode</div>
          <div style={{ fontSize: "9px", color: "#6A5E48" }}>High focus detected</div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Live status ticker items ──────────────────────────────────
const TICKER = [
  ["NEURAL ENGINE", "ONLINE"],
  ["MEMORY NODES", "847 ACTIVE"],
  ["RESPONSE TIME", "0.3s"],
  ["AI MODULES", "7 / 7"],
  ["PRIVACY", "E2E ENCRYPTED"],
  ["MOOD DETECTION", "ACTIVE"],
  ["CONTEXT WINDOW", "PERSISTENT"],
  ["PATTERN LEARNING", "CONTINUOUS"],
];

const TICKER_COLORS = ["#C9A838", "#D4853A", "#9B7B2A", "#C9A838", "#22C55E", "#D4853A", "#C9A838", "#9B7B2A"];

// ────────────────────────────────────────────────────────────────
const STATS = [
  { val: "2,400+", label: "On Waitlist",  col: "#C9A838" },
  { val: "7",      label: "AI Modules",   col: "#D4853A" },
  { val: "∞",      label: "Memory Depth", col: "#9B7B2A" },
];

export default function Hero() {
  return (
    <section style={{ minHeight: "100vh", background: "transparent", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", paddingTop: "80px" }}>

      {/* Blueprint line grid — hero-specific depth layer */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(201,168,56,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,56,0.022) 1px, transparent 1px)", backgroundSize: "60px 60px", zIndex: 0, pointerEvents: "none" }} />


      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "4rem 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center", width: "100%", position: "relative", zIndex: 1 }}>

        {/* ── Left ──────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>

          {/* Live badge */}
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 16px", borderRadius: "3px", background: "linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg,rgba(201,168,56,0.55),rgba(201,168,56,0.40)) border-box", border: "1.5px solid transparent", boxShadow: "0 4px 20px rgba(0,0,0,0.30)" }}>
              <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#D4853A", display: "inline-block", boxShadow: "0 0 12px rgba(201,168,56,0.9)" }} />
                <span style={{ position: "absolute", width: "14px", height: "14px", borderRadius: "50%", border: "1.5px solid rgba(201,168,56,0.48)", animation: "pulseRing 2s ease-out infinite" }} />
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700, background: "linear-gradient(135deg,#C9A838,#D4853A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "0.01em" }}>Introducing Noorva · Human-AI Companionship</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, delay: 0.1 }}>
            <h1 style={{ fontSize: "clamp(2.8rem,5.4vw,5.2rem)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em", fontFamily: "var(--font-playfair), serif", color: "#F5EDD6", margin: 0 }}>
              The AI companion
            </h1>
            <h1 className="shimmer-text" style={{ fontSize: "clamp(2.8rem,5.4vw,5.2rem)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em", fontFamily: "var(--font-playfair), serif", margin: "4px 0" }}>
              that knows
            </h1>
            <h1 style={{ fontSize: "clamp(2.8rem,5.4vw,5.2rem)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em", fontFamily: "var(--font-playfair), serif", fontStyle: "italic", color: "#F5EDD6", margin: 0 }}>
              your mind.
            </h1>
          </motion.div>

          {/* Subtext */}
          <motion.p style={{ fontSize: "1.03rem", lineHeight: "1.78", color: "#B8A98C", maxWidth: "418px", margin: 0 }} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.25 }}>
            Noorva learns your patterns, adapts to your emotional state, and evolves with every conversation — built for how you actually live.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.35 }} style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}>
              Get Early Access
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className="btn-secondary" onClick={() => document.querySelector("#companion")?.scrollIntoView({ behavior: "smooth" })}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 5.5L11 8L6.5 10.5V5.5Z" fill="currentColor"/></svg>
              See How It Works
            </button>
          </motion.div>

          {/* Stats strip */}
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.55 }}>
            <div style={{ display: "inline-flex", borderRadius: "3px", background: "linear-gradient(#1A1610,#1A1610) padding-box, linear-gradient(135deg,rgba(201,168,56,0.30),rgba(201,168,56,0.18)) border-box", border: "1.5px solid transparent", overflow: "hidden" }}>
              {STATS.map((s, i) => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "center", padding: "13px 22px", borderRight: i < STATS.length - 1 ? "1px solid rgba(201,168,56,0.12)" : "none" }}>
                  <span style={{ fontSize: "21px", fontWeight: 900, background: `linear-gradient(135deg,${s.col},#D4853A)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-0.04em", fontFamily: "var(--font-jakarta)", lineHeight: 1 }}>{s.val}</span>
                  <span style={{ fontSize: "10px", color: "#6A5E48", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "13px 18px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 10px rgba(34,197,94,0.8)" }} />
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#22C55E", lineHeight: 1 }}>LIVE</div>
                  <div style={{ fontSize: "9px", color: "#6A5E48", fontWeight: 500 }}>Accepting</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Trust note */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.75 }} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ display: "flex" }}>
              {["#C9A838","#D4853A","#9B7B2A","#C9A838","#22C55E"].map((c, i) => (
                <div key={i} style={{ width: "22px", height: "22px", borderRadius: "50%", background: c, border: "2px solid #0D0B07", marginLeft: i > 0 ? "-7px" : "0", flexShrink: 0 }} />
              ))}
            </div>
            <span style={{ fontSize: "12px", color: "#8A7B5C", fontWeight: 500 }}>Joined by <strong style={{ color: "#F5EDD6" }}>2,400+</strong> people on the waitlist</span>
          </motion.div>
        </div>

        {/* ── Right: Product window ──────────────────────── */}
        <motion.div initial={{ scale: 0.92, y: 28, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ duration: 0.95, delay: 0.25, ease: [0.22, 1, 0.36, 1] }} style={{ display: "flex", justifyContent: "center", alignItems: "center", paddingRight: "40px", position: "relative" }}>
          {/* Glow sphere — makes window look like it's illuminating the page */}
          <div style={{ position: "absolute", width: "520px", height: "520px", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(201,168,56,0.22) 0%, rgba(201,168,56,0.13) 38%, transparent 68%)", filter: "blur(60px)", zIndex: 0, pointerEvents: "none", animation: "glowBreath 5s ease-in-out infinite" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <ProductWindow />
          </div>
        </motion.div>
      </div>

      {/* ── Live system status ticker ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.8 }}
        style={{ position: "absolute", bottom: "68px", left: 0, right: 0, overflow: "hidden", zIndex: 2, WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 7%, black 93%, transparent 100%)", maskImage: "linear-gradient(90deg, transparent 0%, black 7%, black 93%, transparent 100%)" }}>
        <div style={{ display: "flex", animation: "tickerScroll 32s linear infinite", whiteSpace: "nowrap", width: "max-content" }}>
          {[0, 1].map(dupe => (
            <div key={dupe} style={{ display: "flex", alignItems: "center" }}>
              {TICKER.map((item, i) => (
                <div key={`${i}-${dupe}`} style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "0 30px" }}>
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: TICKER_COLORS[i], flexShrink: 0, boxShadow: `0 0 7px ${TICKER_COLORS[i]}`, display: "inline-block" }} />
                  <span style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.16em", color: "#B0B8C8", textTransform: "uppercase" }}>{item[0]}</span>
                  <span style={{ fontSize: "9px", color: "#D0D5E0", letterSpacing: "0.06em" }}>·</span>
                  <span style={{ fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.12em", background: `linear-gradient(135deg, ${TICKER_COLORS[i]}, ${TICKER_COLORS[(i + 1) % TICKER_COLORS.length]})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", textTransform: "uppercase" }}>{item[1]}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.5 }}
        style={{ position: "absolute", bottom: "24px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", zIndex: 2 }}
        onClick={() => document.querySelector("#companion")?.scrollIntoView({ behavior: "smooth" })}
      >
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M4 9l4 4 4-4" stroke="rgba(201,168,56,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
