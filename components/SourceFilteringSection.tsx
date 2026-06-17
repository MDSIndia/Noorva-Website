"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

const LAYERS = [
  { label: "Internet & Social Media",  icon: "🌐", desc: "Noisy, biased, often misleading",       badge: "Filtered",  badgeColor: "#EF4444", badgeBg: "rgba(239,68,68,0.08)",    lineColor: "rgba(239,68,68,0.28)",  scanColor: "rgba(239,68,68,0.18)" },
  { label: "News & Media",             icon: "📰", desc: "Sensationalized, incomplete context",   badge: "Filtered",  badgeColor: "#F97316", badgeBg: "rgba(249,115,22,0.08)",  lineColor: "rgba(249,115,22,0.28)", scanColor: "rgba(249,115,22,0.15)" },
  { label: "Generic AI Responses",     icon: "🤖", desc: "No personal context, generic answers",  badge: "Rejected",  badgeColor: "#EAB308", badgeBg: "rgba(234,179,8,0.08)",   lineColor: "rgba(234,179,8,0.25)",  scanColor: "rgba(234,179,8,0.12)" },
  { label: "Verified Knowledge",       icon: "📚", desc: "Academic, scientific, expert sources",  badge: "Accepted",  badgeColor: "#22C55E", badgeBg: "rgba(34,197,94,0.08)",   lineColor: "rgba(34,197,94,0.28)",  scanColor: "rgba(34,197,94,0.12)" },
  { label: "Your Personal Context",    icon: "👤", desc: "Your history, preferences, patterns",   badge: "Priority",  badgeColor: "#C9A838", badgeBg: "rgba(201,168,56,0.10)",  lineColor: "rgba(201,168,56,0.30)", scanColor: "rgba(201,168,56,0.10)" },
  { label: "Noorva Intelligence",      icon: "✨", desc: "Synthesized, personalized, wise",       badge: "Output",    badgeColor: "#D4853A", badgeBg: "rgba(201,168,56,0.10)",  lineColor: "rgba(201,168,56,0.38)", scanColor: "rgba(201,168,56,0.12)" },
];

function IntelligenceVisual() {
  const [scanPos, setScanPos] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isAnimating) return;
    const interval = setInterval(() => { setScanPos(p => (p >= LAYERS.length - 1 ? 0 : p + 1)); }, 700);
    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }} onMouseEnter={() => setIsAnimating(false)} onMouseLeave={() => setIsAnimating(true)}>
      {LAYERS.map((layer, i) => (
        <motion.div key={layer.label} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
          style={{
            display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px",
            background: i === 5
              ? "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.38),rgba(201,168,56,0.28)) border-box"
              : scanPos === i
                ? "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.30),rgba(201,168,56,0.20)) border-box"
                : "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.12),rgba(201,168,56,0.08)) border-box",
            borderRadius: "14px", border: "1.5px solid transparent",
            boxShadow: i === 5 ? "0 6px 24px rgba(201,168,56,0.12)" : scanPos === i ? `0 4px 20px ${layer.scanColor}` : "0 2px 8px rgba(0,0,0,0.03)",
            transition: "all 0.3s ease", position: "relative", overflow: "hidden"
          }}
        >
          {scanPos === i && (
            <motion.div initial={{ left: "-100%" }} animate={{ left: "150%" }} transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ position: "absolute", top: 0, width: "40%", height: "100%", background: `linear-gradient(90deg, transparent, ${layer.lineColor}, transparent)`, pointerEvents: "none", zIndex: 0 }}
            />
          )}
          <div style={{ fontSize: "20px", flexShrink: 0, position: "relative", zIndex: 1 }}>{layer.icon}</div>
          <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#F5EDD6", fontFamily: "var(--font-jakarta)" }}>{layer.label}</div>
            <div style={{ fontSize: "11px", color: "#6A5E48", marginTop: "2px" }}>{layer.desc}</div>
          </div>
          {i < 5 && <div style={{ color: "rgba(201,168,56,0.45)", fontSize: "13px", flexShrink: 0, position: "relative", zIndex: 1 }}>↓</div>}
          <div style={{ padding: "4px 10px", borderRadius: "3px", background: layer.badgeBg, color: layer.badgeColor, fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em", flexShrink: 0, position: "relative", zIndex: 1, border: `1px solid ${layer.lineColor}` }}>
            {layer.badge}
          </div>
        </motion.div>
      ))}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.7 }}
        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px", background: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.25),rgba(201,168,56,0.18)) border-box", borderRadius: "14px", border: "1.5px solid transparent", marginTop: "4px", boxShadow: "0 2px 12px rgba(201,168,56,0.08)" }}
      >
        <div style={{ display: "flex", gap: "3px" }}>
          {[0, 1, 2].map(d => (
            <motion.div key={d} animate={{ scaleY: [1, 2.2, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }} style={{ width: "3px", height: "10px", borderRadius: "2px", background: "#D4853A", transformOrigin: "bottom" }} />
          ))}
        </div>
        <span style={{ fontSize: "11.5px", color: "#8A7B5C", fontWeight: 500 }}>Processing through intelligence layers…</span>
        <div style={{ marginLeft: "auto", padding: "3px 8px", borderRadius: "3px", background: "rgba(201,168,56,0.10)", fontSize: "9.5px", fontWeight: 700, color: "#C9A838", letterSpacing: "0.06em" }}>LIVE</div>
      </motion.div>
    </div>
  );
}

const POINTS = [
  { title: "Radical personalization", desc: "Every response is filtered through your unique context. No two users ever receive the same guidance, because no two people are alike.", color: "#C9A838", icon: "🎯", gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.38),rgba(201,168,56,0.22)) border-box" },
  { title: "Noise elimination",       desc: "Noorva actively screens out clickbait, sensationalism, and generic content — surfacing only what genuinely matters to you.",             color: "#D4853A", icon: "🔇", gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.38),rgba(212,133,58,0.22)) border-box" },
  { title: "Wisdom synthesis",        desc: "Rather than dumping information, Noorva synthesizes knowledge into actionable, relevant insights tailored to your specific situation.",  color: "#9B7B2A", icon: "✨", gradBorder: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(212,133,58,0.35),rgba(201,168,56,0.22)) border-box" },
];

export default function SourceFilteringSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section ref={ref} style={{ background: "#1A1610", padding: "7rem 0", position: "relative" }}>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "start" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "16px", padding: "5px 14px", borderRadius: "3px", background: "rgba(212,133,58,0.07)", border: "1px solid rgba(212,133,58,0.18)" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", background: "linear-gradient(135deg, #9B7B2A, #D4853A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Section 04 · Intelligence Layer</span>
              </div>
              <h2 style={{ fontSize: "clamp(2.2rem,5vw,4.5rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, fontFamily: "var(--font-playfair), serif", color: "#F5EDD6" }}>
                Not all information{" "}<span style={{ background: "linear-gradient(135deg, #C9A838, #D4853A, #9B7B2A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>is created equal.</span>
              </h2>
            </motion.div>

            <motion.p style={{ fontSize: "1.05rem", lineHeight: "1.75", color: "#B8A98C" }} initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.15 }}>
              The internet is full of noise. Generic AI regurgitates it. Noorva applies layers of intelligent filtering — keeping only what is true, relevant, and personally meaningful to you.
            </motion.p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {POINTS.map((p, i) => (
                <motion.div key={p.title} initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.25 + i * 0.1 }} whileHover={{ x: 4 }}
                  style={{ display: "flex", gap: "14px", padding: "18px 20px", background: p.gradBorder, border: "1.5px solid transparent", borderRadius: "4px", position: "relative", overflow: "hidden", boxShadow: "0 2px 12px rgba(201,168,56,0.08)", transition: "box-shadow 0.3s ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px ${p.color}16`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(201,168,56,0.08)"; }}
                >
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: `linear-gradient(to bottom, ${p.color}, ${p.color}44)`, borderRadius: "0 2px 2px 0" }} />
                  <div style={{ fontSize: "18px", paddingLeft: "10px" }}>{p.icon}</div>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#F5EDD6", marginBottom: "5px", fontFamily: "var(--font-jakarta)" }}>{p.title}</h4>
                    <p style={{ fontSize: "13px", color: "#8A7B5C", lineHeight: "1.65" }}>{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.6 }}
              style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px 22px", background: "linear-gradient(#1A1610,#1A1610) padding-box,linear-gradient(135deg,rgba(201,168,56,0.38),rgba(201,168,56,0.22)) border-box", border: "1.5px solid transparent", borderRadius: "4px", boxShadow: "0 4px 20px rgba(201,168,56,0.08)" }}
            >
              <div style={{ width: "44px", height: "44px", borderRadius: "13px", background: "rgba(201,168,56,0.09)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(201,168,56,0.18)" }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 3L4 7v5c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V7L12 3z" stroke="#C9A838" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="#C9A838" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#F5EDD6" }}>Trustworthy by design</div>
                <div style={{ fontSize: "12px", color: "#6A5E48", marginTop: "3px" }}>Noorva never fabricates — it says &quot;I don&apos;t know&quot; when uncertain.</div>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} style={{ position: "sticky", top: "100px" }}>
            <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6A5E48" }}>How Noorva processes information</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22C55E", animation: "glowPulse 2s infinite" }} />
                <span style={{ fontSize: "10px", fontWeight: 600, color: "#22C55E" }}>Live</span>
              </div>
            </div>
            <IntelligenceVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
