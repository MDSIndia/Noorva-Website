"use client";

export default function GlobalBackground() {
  return (
    <>
      {/* ── Deep warm-black base ─────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "#0D0B07" }} />

      {/* ── Fine grain dot grid — parchment depth ── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(201,168,56,0.045) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      {/* ── Antique gold glow — top-left ── */}
      <div style={{
        position: "fixed", top: "-18%", left: "0%",
        width: "60vw", height: "70vh",
        background: "radial-gradient(ellipse at center, rgba(201,168,56,0.055) 0%, transparent 62%)",
        filter: "blur(100px)", zIndex: 0, pointerEvents: "none",
      }} />

      {/* ── Warm amber glow — center-right ── */}
      <div style={{
        position: "fixed", top: "20%", right: "-10%",
        width: "48vw", height: "65vh",
        background: "radial-gradient(ellipse at center, rgba(212,133,58,0.042) 0%, transparent 62%)",
        filter: "blur(110px)", zIndex: 0, pointerEvents: "none",
      }} />

      {/* ── Deep bronze glow — bottom-left ── */}
      <div style={{
        position: "fixed", bottom: "-14%", left: "-2%",
        width: "46vw", height: "56vh",
        background: "radial-gradient(ellipse at center, rgba(139,105,20,0.038) 0%, transparent 62%)",
        filter: "blur(90px)", zIndex: 0, pointerEvents: "none",
      }} />

      {/* ── Subtle warm center vignette ── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 40%, rgba(5,3,1,0.45) 100%)",
      }} />
    </>
  );
}
