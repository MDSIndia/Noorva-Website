"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";

/* ─── NAV LINKS ─────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Vision",   href: "#cosmic-intro" },
  { label: "Story",    href: "#story" },
  { label: "Features", href: "#features" },
  { label: "About",    href: "#about" },
];

/* ─── ISLAND MESSAGES ───────────────────────────────────────────── */
const ISLAND_MESSAGES = [
  { icon: "✦", label: "AI-Powered",   detail: "Your intelligent companion is ready" },
  { icon: "�", label: "Personalized", detail: "Adapts to your unique journey" },
  { icon: "⬡", label: "Always On",    detail: "24/7 guidance, wherever you are" },
  { icon: "�", label: "Trusted",      detail: "Built on privacy & deep understanding" },
];

/* ═══════════════════════════════════════════════════════════════════
   DYNAMIC ISLAND
   ═══════════════════════════════════════════════════════════════════ */
function DynamicIsland() {
  const pillRef  = useRef<HTMLDivElement>(null);
  const [phase, setPhase]       = useState<"idle" | "expanding" | "expanded" | "collapsing">("idle");
  const [msgIdx, setMsgIdx]     = useState(0);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleRef  = useRef(0);

  const expand = useCallback((idx: number) => {
    setPhase("expanding");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPhase("expanded");
      timerRef.current = setTimeout(() => {
        setPhase("collapsing");
        timerRef.current = setTimeout(() => {
          setPhase("idle");
          cycleRef.current++;
          setMsgIdx((prev) => (prev + 1) % ISLAND_MESSAGES.length);
        }, 520);
      }, 3000);
    }, 60);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (phase === "idle") expand(cycleRef.current % ISLAND_MESSAGES.length);
    }, 5200);
    const init = setTimeout(() => expand(0), 2000);
    return () => { clearInterval(id); clearTimeout(init); if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = () => { if (phase === "idle") expand(msgIdx); };
  const isOpen = phase === "expanded" || phase === "expanding";
  const msg   = ISLAND_MESSAGES[msgIdx];

  return (
    <div
      ref={pillRef}
      onClick={handleClick}
      role="button"
      aria-label="Noorva status"
      style={{
        width:  isOpen ? "clamp(240px, 30vw, 330px)" : "clamp(108px, 15vw, 148px)",
        height: isOpen ? "64px" : "34px",
        borderRadius: isOpen ? "24px" : "100px",
        cursor: phase === "idle" ? "pointer" : "default",
        transition: "width 0.6s cubic-bezier(0.34,1.5,0.64,1), height 0.5s cubic-bezier(0.34,1.5,0.64,1), border-radius 0.5s cubic-bezier(0.34,1.5,0.64,1)",
        background: isOpen
          ? "linear-gradient(135deg, rgba(18,14,32,0.95), rgba(8,8,16,0.97))"
          : "rgba(6,6,12,0.92)",
        border: isOpen
          ? "1px solid rgba(140,100,255,0.18)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isOpen
          ? "0 0 0 1px rgba(255,255,255,0.04), 0 12px 48px rgba(0,0,0,0.65), 0 0 80px rgba(120,80,255,0.10), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 0 0 1px rgba(255,255,255,0.03), 0 8px 32px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(32px) saturate(200%)",
        WebkitBackdropFilter: "blur(32px) saturate(200%)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: isOpen
          ? "radial-gradient(ellipse at 50% -20%, rgba(130,90,255,0.28) 0%, transparent 65%)"
          : "radial-gradient(ellipse at 50% 50%, rgba(120,80,255,0.14) 0%, transparent 75%)",
        transition: "background 0.6s ease",
      }} />

      {/* Shimmer sweep on expand */}
      {isOpen && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)",
          animation: "islandShimmer 2.4s ease-in-out infinite",
          pointerEvents: "none",
        }} />
      )}

      <div style={{
        width: "100%",
        padding: isOpen ? "0 18px" : "0 14px",
        transition: "padding 0.4s ease",
        position: "relative", zIndex: 1,
      }}>
        {/* PILL STATE */}
        {!isOpen && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "radial-gradient(circle, #c4b5fd, #7c5cfc)",
              boxShadow: "0 0 10px rgba(124,92,252,0.95), 0 0 20px rgba(124,92,252,0.4)",
              animation: "islandPulse 2.2s ease-in-out infinite",
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)", fontWeight: 500, whiteSpace: "nowrap",
            }}>
              Noorva · Live
            </span>
          </div>
        )}

        {/* EXPANDED STATE */}
        {isOpen && (
          <div style={{
            display: "flex", alignItems: "center", gap: "13px",
            opacity: phase === "expanded" ? 1 : 0,
            transform: phase === "expanded" ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.4s ease 0.12s, transform 0.4s ease 0.12s",
          }}>
            {/* Icon badge */}
            <div style={{
              width: 40, height: 40, borderRadius: "13px", flexShrink: 0,
              background: "linear-gradient(135deg, rgba(130,90,255,0.32), rgba(70,150,255,0.22))",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "17px", color: "#d4c5fd",
              boxShadow: "0 0 24px rgba(120,80,255,0.25)",
            }}>
              {msg.icon}
            </div>
            {/* Text */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: "11.5px", fontWeight: 600, color: "rgba(255,255,255,0.92)",
                letterSpacing: "0.05em", lineHeight: 1.2, marginBottom: 3,
              }}>
                {msg.label}
              </div>
              <div style={{
                fontSize: "9.5px", color: "rgba(255,255,255,0.40)",
                letterSpacing: "0.03em", lineHeight: 1.4, whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {msg.detail}
              </div>
            </div>
            {/* Live dot */}
            <div style={{ marginLeft: "auto", flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 8px rgba(74,222,128,0.85)",
                animation: "islandPulse 1.6s ease-in-out infinite",
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MOBILE MENU
   ═══════════════════════════════════════════════════════════════════ */
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 88,
          background: "rgba(0,0,0,0.60)",
          backdropFilter: "blur(6px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.35s ease",
        }}
      />
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 89,
          background: "rgba(6,6,14,0.97)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "92px 28px 36px",
          transform: open ? "translateY(0)" : "translateY(-110%)",
          transition: "transform 0.5s cubic-bezier(0.34,1.3,0.64,1)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.75)",
        }}
      >
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 4px",
                borderBottom: i < NAV_LINKS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                color: "rgba(255,255,255,0.75)", textDecoration: "none",
                fontSize: "19px", fontWeight: 300, letterSpacing: "0.04em",
                fontFamily: "var(--font-playfair), serif",
                transition: "color 0.2s ease, padding-left 0.3s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.paddingLeft = "12px"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)"; (e.currentTarget as HTMLElement).style.paddingLeft = "4px"; }}
            >
              {link.label}
              <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 14 }}>→</span>
            </a>
          ))}
        </nav>
        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
          <a
            href="#"
            onClick={onClose}
            style={{
              display: "block", textAlign: "center",
              padding: "16px 24px", borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(120,80,255,0.25), rgba(70,140,255,0.18))",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff", fontSize: "13px",
              letterSpacing: "0.20em", textTransform: "uppercase",
              textDecoration: "none", fontWeight: 500,
            }}
          >
            Join Waitlist
          </a>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN HEADER
   ═══════════════════════════════════════════════════════════════════ */
export default function Header() {
  const headerRef  = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    gsap.fromTo(el,
      { y: -90, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.4 }
    );
  }, []);

  return (
    <>
      <style>{`
        @keyframes islandPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.82); }
        }
        @keyframes islandShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .nav-link-item {
          position: relative;
          color: rgba(255,255,255,0.50);
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 8px 2px;
          transition: color 0.3s ease;
        }
        .nav-link-item::after {
          content: '';
          position: absolute;
          bottom: 2px; left: 50%;
          width: 0; height: 1px;
          background: linear-gradient(90deg, #c4b5fd, #93c5fd);
          transition: width 0.4s cubic-bezier(0.25,1,0.5,1), left 0.4s cubic-bezier(0.25,1,0.5,1);
          border-radius: 1px;
          transform: translateX(-50%);
        }
        .nav-link-item:hover { color: rgba(255,255,255,0.92); }
        .nav-link-item:hover::after { width: 100%; left: 50%; }

        .header-cta {
          position: relative;
          overflow: hidden;
          padding: 9px 24px;
          border-radius: 100px;
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.85);
          text-decoration: none;
          background: linear-gradient(135deg, rgba(120,80,255,0.20), rgba(70,140,255,0.16));
          border: 1px solid rgba(255,255,255,0.10);
          transition: all 0.35s ease;
          white-space: nowrap;
          cursor: pointer;
        }
        .header-cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(120,80,255,0.40), rgba(70,140,255,0.32));
          opacity: 0;
          transition: opacity 0.35s ease;
          border-radius: inherit;
        }
        .header-cta:hover::before { opacity: 1; }
        .header-cta:hover {
          color: #fff;
          border-color: rgba(255,255,255,0.22);
          box-shadow: 0 0 32px rgba(120,80,255,0.35), 0 4px rgba(0,0,0,0.50);
          transform: translateY(-1px);
        }
        .header-cta:active { transform: translateY(0); }
        .header-cta span { position: relative; z-index: 1; }

        .hamburger-line {
          display: block;
          width: 22px;
          height: 1.5px;
          background: rgba(255,255,255,0.60);
          border-radius: 2px;
          transition: transform 0.4s cubic-bezier(0.34,1.3,0.64,1), opacity 0.3s ease, width 0.3s ease;
          transform-origin: center;
        }
      `}</style>

      <header
        ref={headerRef}
        id="site-header"
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, opacity: 0 }}
      >
        {/* ── GLASS BAR ─────────────────────────────────────────────── */}
        <div style={{
          margin: "14px 18px 0",
          borderRadius: "22px",
          background: scrolled
            ? "linear-gradient(135deg, rgba(8,6,18,0.88), rgba(4,4,10,0.92))"
            : "linear-gradient(135deg, rgba(8,6,18,0.62), rgba(4,4,10,0.52))",
          backdropFilter: "blur(32px) saturate(200%)",
          WebkitBackdropFilter: "blur(32px) saturate(200%)",
          border: scrolled
            ? "1px solid rgba(140,100,255,0.10), 1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(255,255,255,0.07)",
          boxShadow: scrolled
            ? "0 8px 56px rgba(0,0,0,0.60), 0 1px 0 rgba(255,255,255,0.06) inset, 0 0 80px rgba(120,80,255,0.06)"
            : "0 4px 32px rgba(0,0,0,0.40), 0 1px 0 rgba(255,255,255,0.05) inset",
          transition: "background 0.5s ease, box-shadow 0.5s ease, border 0.5s ease",
          padding: "0 22px",
          display: "flex",
          alignItems: "center",
          height: "62px",
          gap: "18px",
        }}>
          {/* ── LOGO ────────────────────────────────────────────────── */}
          <a
            href="#"
            style={{ textDecoration: "none", flexShrink: 0 }}
          >
            <Image
              src="/NoorvaLogo.png"
              alt="Noorva"
              width={32}
              height={32}
              style={{
                objectFit: "contain",
                borderRadius: "8px",
                filter: "drop-shadow(0 0 10px rgba(167,139,250,0.70)) drop-shadow(0 0 24px rgba(124,92,252,0.35))",
              }}
            />
          </a>

          {/* ── DYNAMIC ISLAND (center) ──────────────────────────────── */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <DynamicIsland />
          </div>

          {/* ── DESKTOP NAV ─────────────────────────────────────────── */}
          <nav
            style={{
              display: "flex", alignItems: "center", gap: "30px",
              flexShrink: 0,
            }}
            className="hidden md:flex"
          >
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="nav-link-item">
                {link.label}
              </a>
            ))}
          </nav>

          {/* ── CTA ─────────────────────────────────────────────────── */}
          <a href="#" className="header-cta hidden md:inline-flex items-center">
            <span>Join Waitlist</span>
          </a>

          {/* ── HAMBURGER ───────────────────────────────────────────── */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle navigation"
            className="md:hidden"
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "6px", display: "flex", flexDirection: "column",
              gap: "5px", flexShrink: 0,
            }}
          >
            <span className="hamburger-line" style={{
              transform: menuOpen ? "translateY(6.5px) rotate(45deg)" : "none",
            }} />
            <span className="hamburger-line" style={{
              opacity: menuOpen ? 0 : 1, width: menuOpen ? "0px" : "22px",
            }} />
            <span className="hamburger-line" style={{
              transform: menuOpen ? "translateY(-6.5px) rotate(-45deg)" : "none",
            }} />
          </button>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
