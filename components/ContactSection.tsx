"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const SOCIAL_PROOF_COLORS = ["#C9A838", "#D4853A", "#9B7B2A", "#22C55E", "#F59E0B"];

export default function ContactSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 900);
  };

  return (
    <section id="contact" ref={ref} style={{ background: "#1A1610", padding: "7rem 0" }}>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "7rem 24px", textAlign: "center" }}>

        {/* Badge */}
        <motion.div
          className="badge-shimmer"
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ display: "inline-flex", marginBottom: "24px" }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", display: "inline-block", boxShadow: "0 0 8px rgba(34,197,94,0.9)" }} />
            Early Access · Limited Spots
          </span>
        </motion.div>

        <motion.h2
          className="heading-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{ marginBottom: "20px" }}
        >
          Be first to meet{" "}
          <span className="text-gradient">Noorva.</span>
        </motion.h2>

        <motion.p
          className="body-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ marginBottom: "12px" }}
        >
          Join our early access waitlist. We&apos;re onboarding a small, thoughtful group of pioneers who believe in a more meaningful relationship with AI.
        </motion.p>

        {/* Limited spots indicator */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.28 }}
          style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 18px", background: "rgba(201,168,56,0.07)", borderRadius: "3px", border: "1px solid rgba(201,168,56,0.18)", marginBottom: "40px" }}
        >
          {/* Slots bar */}
          <div style={{ width: "80px", height: "4px", borderRadius: "2px", background: "rgba(201,168,56,0.12)", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={isInView ? { width: "74%" } : {}}
              transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
              style={{ height: "100%", borderRadius: "2px", background: "linear-gradient(90deg, #C9A838, #D4853A)" }}
            />
          </div>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#C9A838" }}>74% of spots taken</span>
          <span style={{ fontSize: "12px", color: "#6A5E48" }}>· 624 remaining</span>
        </motion.div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Input row */}
              <div style={{ display: "flex", gap: "10px", background: "rgba(26,22,14,0.90)", backdropFilter: "blur(16px)", borderRadius: "4px", padding: "6px 6px 6px 20px", border: focused ? "1.5px solid rgba(201,168,56,0.45)" : "1.5px solid rgba(17,24,39,0.10)", boxShadow: focused ? "0 0 0 4px rgba(201,168,56,0.08), 0 4px 20px rgba(201,168,56,0.11)" : "0 4px 20px rgba(201,168,56,0.10)", transition: "all 0.25s ease" }}>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  required
                  style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: "15px", color: "#F5EDD6", fontFamily: "var(--font-inter)", padding: "10px 0" }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ flexShrink: 0, padding: "12px 24px", fontSize: "14px", opacity: loading ? 0.8 : 1 }}
                >
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#F5EDD6", borderRadius: "50%" }} />
                  ) : (
                    <>
                      Join Waitlist
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </>
                  )}
                </button>
              </div>

              <p style={{ fontSize: "12px", color: "#6A5E48" }}>
                No spam, ever. Unsubscribe anytime. We take your privacy as seriously as Noorva does.
              </p>

              {/* Social proof */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", marginTop: "8px" }}>
                <div style={{ display: "flex" }}>
                  {SOCIAL_PROOF_COLORS.map((c, i) => (
                    <div key={c} style={{ width: "30px", height: "30px", borderRadius: "50%", background: c, border: "2px solid rgba(255,255,255,0.9)", marginLeft: i > 0 ? "-8px" : "0", boxShadow: `0 2px 8px ${c}30`, zIndex: 5 - i }} />
                  ))}
                </div>
                <span style={{ fontSize: "13px", color: "#8A7B5C" }}>
                  <strong style={{ color: "#F5EDD6", fontWeight: 700 }}>2,400+</strong> people already on the waitlist
                </span>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ padding: "48px 40px", background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)", borderRadius: "28px", border: "1px solid rgba(34,197,94,0.22)", boxShadow: "0 12px 48px rgba(34,197,94,0.10)" }}
            >
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ width: "68px", height: "68px", borderRadius: "22px", background: "linear-gradient(135deg, #22C55E, #16A34A)", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(34,197,94,0.35)" }}
              >
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
                  <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>

              <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#F5EDD6", fontFamily: "var(--font-jakarta)", marginBottom: "10px", letterSpacing: "-0.02em" }}>
                You&apos;re on the list!
              </h3>
              <p style={{ fontSize: "14px", color: "#8A7B5C", lineHeight: "1.7", marginBottom: "24px" }}>
                We&apos;ll reach out when your spot is ready. Noorva is looking forward to meeting you — it already knows this will be meaningful.
              </p>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "rgba(34,197,94,0.08)", borderRadius: "3px", border: "1px solid rgba(34,197,94,0.20)", fontSize: "13px", fontWeight: 600, color: "#22C55E" }}>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M14 3L6.5 10.5 3 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {email}
              </div>

              {/* Rank counter */}
              <div style={{ marginTop: "24px", padding: "16px", background: "#1A1610", borderRadius: "4px", border: "1px solid rgba(201,168,56,0.10)" }}>
                <div style={{ fontSize: "12px", color: "#6A5E48", marginBottom: "6px" }}>Your position</div>
                <div style={{ fontSize: "26px", fontWeight: 900, color: "#C9A838", fontFamily: "var(--font-jakarta)", letterSpacing: "-0.04em" }}>#2,401</div>
                <div style={{ fontSize: "12px", color: "#6A5E48", marginTop: "2px" }}>in the waitlist</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
