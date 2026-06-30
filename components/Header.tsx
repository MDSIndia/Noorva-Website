"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";

/* ─── NAV LINKS ─────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Vision",   href: "#cosmic-intro" },
  { label: "Story",    href: "#story" },
  { label: "Features", href: "#features" },
  { label: "About",    href: "#about" },
];

/* ═══════════════════════════════════════════════════════════════════
   MOBILE MENU OVERLAY
   ═══════════════════════════════════════════════════════════════════ */
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
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
      {/* Full-screen panel */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 89,
          background: "rgba(5,5,12,0.97)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.45s cubic-bezier(0.34,1.2,0.64,1)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px 32px 40px",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          style={{
            position: "absolute", top: 20, right: 20,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "12px",
            width: 44, height: 44,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.7)",
            fontSize: 20,
          }}
        >
          ✕
        </button>

        {/* Nav links — centered, large touch targets */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 320 }}>
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 16px",
                borderRadius: "14px",
                color: "rgba(255,255,255,0.80)", textDecoration: "none",
                fontSize: "18px", fontWeight: 300, letterSpacing: "0.04em",
                fontFamily: "var(--font-playfair), serif",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "background 0.2s ease, color 0.2s ease, transform 0.2s ease",
                minHeight: 56,
              }}
              onTouchStart={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(120,80,255,0.15)";
                (e.currentTarget as HTMLElement).style.color = "#fff";
                (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
              }}
              onTouchEnd={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.80)";
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              }}
            >
              {link.label}
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>→</span>
            </a>
          ))}
        </nav>

        {/* CTA */}
        <a
          href="#"
          onClick={onClose}
          style={{
            marginTop: 32,
            display: "block", textAlign: "center", width: "100%", maxWidth: 320,
            padding: "18px 24px", borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(120,80,255,0.30), rgba(70,140,255,0.22))",
            border: "1px solid rgba(255,255,255,0.14)",
            color: "#fff", fontSize: "14px",
            letterSpacing: "0.20em", textTransform: "uppercase",
            textDecoration: "none", fontWeight: 500,
          }}
        >
          Join Waitlist
        </a>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN HEADER — clean menu bar style
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
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.0, ease: "power3.out", delay: 0.3 }
    );
  }, []);

  return (
    <>
      <style>{`
        /* ── Nav link underline animation ────────────────────────── */
        .nav-link {
          position: relative;
          color: rgba(255,255,255,0.55);
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 8px 4px;
          transition: color 0.3s ease;
          white-space: nowrap;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 4px; left: 0;
          width: 0; height: 1px;
          background: linear-gradient(90deg, #c4b5fd, #60a5fa);
          transition: width 0.35s cubic-bezier(0.25,1,0.5,1);
        }
        .nav-link:hover { color: #fff; }
        .nav-link:hover::after { width: 100%; }

        /* ── CTA button ─────────────────────────────────────────── */
        .cta-btn {
          padding: 8px 20px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.88);
          text-decoration: none;
          background: linear-gradient(135deg, rgba(120,80,255,0.22), rgba(70,140,255,0.16));
          border: 1px solid rgba(255,255,255,0.12);
          transition: all 0.3s ease;
          white-space: nowrap;
          cursor: pointer;
        }
        .cta-btn:hover {
          color: #fff;
          background: linear-gradient(135deg, rgba(120,80,255,0.40), rgba(70,140,255,0.30));
          border-color: rgba(255,255,255,0.25);
          box-shadow: 0 0 24px rgba(120,80,255,0.30);
        }

        /* ── Hamburger ──────────────────────────────────────────── */
        .hamburger {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 8px;
          cursor: pointer;
          background: none;
          border: none;
        }
        .hamburger span {
          display: block;
          width: 24px;
          height: 2px;
          background: rgba(255,255,255,0.70);
          border-radius: 2px;
          transition: transform 0.35s cubic-bezier(0.34,1.2,0.64,1), opacity 0.25s ease;
          transform-origin: center;
        }

        /* ── Glass bar responsive ──────────────────────────────── */
        .glass-bar {
          margin: 12px 12px 0;
          padding: 0 16px;
          height: 56px;
          border-radius: 16px;
        }
        @media (min-width: 768px) {
          .glass-bar {
            margin: 16px 24px;
            padding: 0 24px;
            height: 64px;
            border-radius: 20px;
          }
        }
        @media (min-width: 1024px) {
          .glass-bar {
            margin: 16px 32px;
            padding: 0 32px;
            border-radius: 22px;
          }
        }

      `}</style>

      <header
        ref={headerRef}
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, opacity: 0 }}
      >
        <div
          className="glass-bar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            background: scrolled
              ? "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)",
            backdropFilter: "blur(40px) saturate(200%) brightness(1.1)",
            WebkitBackdropFilter: "blur(40px) saturate(200%) brightness(1.1)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: scrolled
              ? "0 8px 32px rgba(0,0,0,0.50), 0 2px 8px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 rgba(0,0,0,0.10)"
              : "0 4px 24px rgba(0,0,0,0.30), 0 1px 4px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.08)",
            transition: "all 0.4s ease",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glass sheen overlay — top highlight */}
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "50%",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, transparent 100%)",
            borderRadius: "inherit",
            pointerEvents: "none",
          }} />
          {/* ── LEFT: Logo ─────────────────────────────────────────── */}
          <a href="#" style={{ textDecoration: "none", flexShrink: 0, lineHeight: 0 }}>
            <Image
              src="/NoorvaLogo.png"
              alt="Noorva"
              width={38}
              height={38}
              style={{
                filter: "drop-shadow(0 0 12px rgba(167,139,250,0.90)) drop-shadow(0 0 28px rgba(124,92,252,0.60)) drop-shadow(0 0 4px rgba(255,255,255,0.30))",
              }}
            />
          </a>

          {/* ── CENTER: Desktop nav links ───────────────────────────── */}
          <nav className="hidden md:flex" style={{ alignItems: "center", gap: 32 }}>
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="nav-link">
                {link.label}
              </a>
            ))}
          </nav>

          {/* ── RIGHT: CTA + Hamburger ─────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <a href="#" className="cta-btn hidden md:inline-block">
              Join Waitlist
            </a>
            <button
              className="hamburger md:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <span style={{ transform: menuOpen ? "translateY(7px) rotate(45deg)" : "none" }} />
              <span style={{ opacity: menuOpen ? 0 : 1 }} />
              <span style={{ transform: menuOpen ? "translateY(-7px) rotate(-45deg)" : "none" }} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
