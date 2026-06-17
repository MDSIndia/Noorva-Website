"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { SPACE_INTRO_VH } from "@/lib/constants";

const NAV_LINKS = [
  { label: "Companion", href: "#companion" },
  { label: "Mood",      href: "#mood"      },
  { label: "Features",  href: "#features"  },
  { label: "Future",    href: "#future"    },
  { label: "Contact",   href: "#contact"   },
];
 

export default function Navbar() {
  const [open,      setOpen]      = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [navOpacity, setNavOpacity] = useState(0);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    function onScroll() {
      const introH    = (SPACE_INTRO_VH / 100) * window.innerHeight;
      const fadeStart = introH * 0.80;
      const fadeEnd   = introH;
      const op = Math.max(0, Math.min(1, (window.scrollY - fadeStart) / (fadeEnd - fadeStart)));
      setNavOpacity(op);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href: string) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* ── Centering shell ── */}
      <div style={{
        position: "fixed", top: "18px", left: 0, right: 0,
        display: "flex", justifyContent: "center",
        zIndex: 100, pointerEvents: "none",
        opacity: navOpacity, transition: "opacity 0.4s ease",
      }}>
        <motion.div
          initial={{ y: -72, opacity: 0, scale: 0.82 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            pointerEvents: navOpacity > 0.1 ? "auto" : "none",
            display: "flex", alignItems: "center", gap: "2px",
            background: "rgba(13,11,7,0.92)",
            backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
            borderRadius: "3px",
            padding: isDesktop ? "7px 8px 7px 18px" : "7px 10px 7px 16px",
            border: "1px solid rgba(201,168,56,0.28)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.50), inset 0 1px 0 rgba(201,168,56,0.10), 0 0 0 3px rgba(201,168,56,0.04)",
            maxWidth: "calc(100vw - 32px)",
          }}
        >
          {/* Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0, marginRight: isDesktop ? "8px" : "4px" }}
          >
            <Image src="/NoorvaLogo.png" alt="Noorva" width={100} height={30}
              style={{ objectFit: "contain", height: "26px", width: "auto" }} priority />
          </div>

          {/* Desktop nav links */}
          {isDesktop && NAV_LINKS.map(link => (
            <button key={link.label} onClick={() => scrollTo(link.href)}
              style={{
                padding: "7px 14px", fontSize: "12px", fontWeight: 600,
                color: "rgba(201,168,56,0.55)", background: "none", border: "none",
                cursor: "pointer", borderRadius: "2px",
                transition: "all 0.2s",
                fontFamily: "var(--font-inter)", whiteSpace: "nowrap",
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#E8C96A"; e.currentTarget.style.background = "rgba(201,168,56,0.07)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(201,168,56,0.55)"; e.currentTarget.style.background = "none"; }}
            >{link.label}</button>
          ))}

          {/* Separator */}
          {isDesktop && (
            <div style={{ width: "1px", height: "18px", background: "rgba(201,168,56,0.20)", margin: "0 4px", flexShrink: 0 }} />
          )}

          {/* Desktop CTA */}
          {isDesktop && (
            <button onClick={() => scrollTo("#contact")}
              style={{
                padding: "8px 18px", fontSize: "11px", fontWeight: 700,
                color: "#0D0B07",
                background: "linear-gradient(135deg, #E8C96A 0%, #C9A838 50%, #D4853A 100%)",
                border: "none", cursor: "pointer", borderRadius: "2px",
                fontFamily: "var(--font-inter)", whiteSpace: "nowrap",
                boxShadow: "0 4px 16px rgba(201,168,56,0.35)",
                transition: "all 0.25s",
                marginLeft: "2px",
                letterSpacing: "0.10em", textTransform: "uppercase",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(201,168,56,0.55)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(201,168,56,0.35)"; }}
            >Get Early Access</button>
          )}

          {/* Mobile hamburger */}
          {!isDesktop && (
            <button onClick={() => setOpen(!open)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px", display: "flex", flexDirection: "column", gap: "4.5px", marginLeft: "6px" }}>
              <motion.span animate={{ rotate: open ? 45 : 0, y: open ? 6.5 : 0 }} transition={{ duration: 0.22 }}
                style={{ display: "block", width: "20px", height: "1.5px", background: "rgba(201,168,56,0.80)", borderRadius: "1px", transformOrigin: "center" }} />
              <motion.span animate={{ opacity: open ? 0 : 1 }} transition={{ duration: 0.15 }}
                style={{ display: "block", width: "20px", height: "1.5px", background: "rgba(201,168,56,0.80)", borderRadius: "1px" }} />
              <motion.span animate={{ rotate: open ? -45 : 0, y: open ? -6.5 : 0 }} transition={{ duration: 0.22 }}
                style={{ display: "block", width: "20px", height: "1.5px", background: "rgba(201,168,56,0.80)", borderRadius: "1px", transformOrigin: "center" }} />
            </button>
          )}
        </motion.div>
      </div>

      {/* ── Mobile dropdown ── */}
      <AnimatePresence>
        {open && !isDesktop && (
          <div style={{ position: "fixed", top: "80px", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 99, opacity: navOpacity }}>
            <motion.div
              initial={{ opacity: 0, y: -14, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{
                background: "rgba(13,11,7,0.97)",
                backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
                borderRadius: "3px", padding: "10px",
                border: "1px solid rgba(201,168,56,0.25)",
                boxShadow: "0 16px 48px rgba(0,0,0,0.50)",
                width: "calc(100vw - 32px)", maxWidth: "360px",
              }}
            >
              {NAV_LINKS.map(link => (
                <button key={link.label} onClick={() => scrollTo(link.href)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "13px 16px", fontSize: "13px", fontWeight: 600,
                    color: "rgba(201,168,56,0.65)",
                    background: "none", border: "none", cursor: "pointer",
                    borderRadius: "2px", transition: "all 0.18s",
                    fontFamily: "var(--font-jakarta)",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,56,0.07)"; e.currentTarget.style.color = "#E8C96A"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(201,168,56,0.65)"; }}
                >{link.label}</button>
              ))}
              <button onClick={() => scrollTo("#contact")}
                style={{
                  display: "block", width: "100%", marginTop: "6px",
                  padding: "13px 16px", fontSize: "12px", fontWeight: 700,
                  color: "#0D0B07",
                  background: "linear-gradient(135deg, #E8C96A, #C9A838, #D4853A)",
                  border: "none", cursor: "pointer", borderRadius: "2px",
                  fontFamily: "var(--font-inter)",
                  boxShadow: "0 4px 16px rgba(201,168,56,0.35)",
                  letterSpacing: "0.10em", textTransform: "uppercase",
                }}
              >Get Early Access</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
