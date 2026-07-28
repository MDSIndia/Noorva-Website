"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { lenisRef, galleryCaptureControl } from "./store";

const NAV_ITEMS = [
  { label: "Home", target: "home" },
  { label: "Story", target: "#story-gallery" },
  { label: "Join", target: "#closing" },
  { label: "About MDS", target: "https://mdsindia.in", external: true },
] as const;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // FeaturesSection pins the viewport and goes full-bleed edge-to-edge with
  // its own images — the logo pill sitting on top of that read as clutter,
  // so it hides for as long as that section is pinned in view. The nav/menu
  // pill is untouched and stays up regardless, so navigation is always
  // reachable.
  const [hideLogo, setHideLogo] = useState(false);

  // Escape closes the mobile menu, matching this site's existing convention
  // (the story reader closes on Escape too).
  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    const el = document.getElementById("features");
    if (!el) return;
    // FeaturesSection's own GSAP ScrollTrigger pins it in place at the top
    // of the viewport for the whole scroll-through, so a plain intersection
    // check (rather than tracking its scroll progress) is enough to know
    // "currently showing".
    const observer = new IntersectionObserver(([entry]) => setHideLogo(entry.isIntersecting), {
      threshold: 0.6,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function goTo(target: string, external?: boolean) {
    if (external) {
      window.open(target, "_blank", "noopener,noreferrer");
      return;
    }
    galleryCaptureControl.release?.(target === "#story-gallery" ? 0 : 1600);
    if (target === "home") {
      // The intro is click-revealed, not scroll-scrubbed, so "Home" is just
      // the top of the page — whatever state the intro is already in.
      lenisRef.current?.scrollTo(0, { duration: 1.4 });
      return;
    }
    lenisRef.current?.scrollTo(target, { duration: 1.4 });
  }

  function handleNavClick(item: (typeof NAV_ITEMS)[number]) {
    goTo(item.target, "external" in item && item.external);
    setMobileOpen(false);
  }

  return (
    <>
      {/* Logo — glowing badge + brand text, pinned top-left, independent of the nav pill */}
      <motion.div
        className="fixed top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 z-50 flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
        style={{ pointerEvents: hideLogo ? "none" : "auto" }}
        initial={{ opacity: 0, y: -20, scale: 0.85 }}
        animate={{ opacity: hideLogo ? 0 : 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        onClick={() => goTo("home")}
      >
        {/* Unified Logo Pill — holds both the glowing badge image and the text */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="relative flex items-center justify-center gap-2 sm:gap-3 rounded-full border border-white/10 bg-black/60 backdrop-blur-xl py-1.5 px-2.5 sm:py-2 sm:px-4"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.09), 0 8px 24px -6px rgba(0,0,0,0.6)",
          }}
        >
          {/* Animated glow background inside the pill */}
          <motion.div
            className="pointer-events-none absolute inset-0 -z-10 rounded-full"
            style={{ background: "radial-gradient(circle at 30%, rgba(124,92,252,0.4), transparent 70%)" }}
            animate={{ opacity: [0.55, 0.95, 0.55] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <div className="relative shrink-0 w-6 h-6 sm:w-7 sm:h-7">
            <Image src="/NoorvaLogo.png" alt="Noorva" width={28} height={28} className="opacity-95 w-full h-full" />
            {/* Light flow sweep, masked to the logo's own alpha so it travels through the mark itself */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 animate-logo-light-flow"
              style={{
                WebkitMaskImage: "url(/NoorvaLogo.png)",
                maskImage: "url(/NoorvaLogo.png)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                backgroundImage:
                  "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 42%, #ffffff 50%, rgba(255,255,255,0.55) 58%, transparent 70%)",
                backgroundSize: "260% 260%",
                mixBlendMode: "plus-lighter",
                filter: "drop-shadow(0 0 3px rgba(255,255,255,0.6))",
              }}
            />
          </div>

          {/* Brand text "NOORVA" — custom SVG matching reference image cutouts */}
          <motion.div
            className="flex items-center overflow-hidden pr-1 sm:pr-2"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          >
            <svg
              className="h-[10px] sm:h-[11px] md:h-[13px] w-auto drop-shadow-[0_0_5px_rgba(255,255,255,0.35)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.55)] transition-all duration-300"
              viewBox="0 0 972 100"
              fill="url(#noorvaLightFlow)"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="noorvaLightFlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                  <stop offset="38%" stopColor="#ffffff" stopOpacity="0.8" />
                  <stop offset="48%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="52%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="62%" stopColor="#ffffff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.8" />
                  <animateTransform
                    attributeName="gradientTransform"
                    type="translate"
                    from="-1.6 0"
                    to="1.6 0"
                    dur="3.4s"
                    repeatCount="indefinite"
                  />
                </linearGradient>
              </defs>
              {/* N */}
              <g transform="translate(14, 0)">
                <path d="M -14,0 L 14,0 L 14,100 L 0,100 L 0,14 L -14,0 Z M 14,0 L 28,0 L 74,100 L 60,100 Z M 60,0 L 74,0 L 74,100 L 60,100 Z" />
              </g>
              
              {/* O */}
              <g transform="translate(188, 0)">
                <path d="M 0,22 L 0,18 C 0,8 8,0 18,0 L 56,0 C 66,0 74,8 74,18 L 74,22 L 60,22 L 60,18 C 60,16 58,14 56,14 L 18,14 C 16,14 14,16 14,18 L 14,22 Z" />
                <path d="M 0,30 L 0,82 C 0,92 8,100 18,100 L 56,100 C 66,100 74,92 74,82 L 74,30 L 60,30 L 60,82 C 60,84 58,86 56,86 L 18,86 C 16,86 14,84 14,82 L 14,30 Z" />
              </g>
              
              {/* O */}
              <g transform="translate(362, 0)">
                <path d="M 0,22 L 0,18 C 0,8 8,0 18,0 L 56,0 C 66,0 74,8 74,18 L 74,22 L 60,22 L 60,18 C 60,16 58,14 56,14 L 18,14 C 16,14 14,16 14,18 L 14,22 Z" />
                <path d="M 0,30 L 0,82 C 0,92 8,100 18,100 L 56,100 C 66,100 74,92 74,82 L 74,30 L 60,30 L 60,82 C 60,84 58,86 56,86 L 18,86 C 16,86 14,84 14,82 L 14,30 Z" />
              </g>
              
              {/* R */}
              <g transform="translate(536, 0)">
                <path d="M -14,0 L 14,0 L 14,100 L 0,100 L 0,14 L -14,0 Z M 22,0 L 56,0 C 64,0 70,6 70,14 L 70,36 C 70,44 64,50 56,50 L 14,50 L 14,36 L 56,36 C 58,36 60,34 60,32 L 60,18 C 60,16 58,14 56,14 L 22,14 Z M 42,50 L 56,50 L 72,100 L 58,100 Z" />
              </g>
              
              {/* V */}
              <g transform="translate(710, 0)">
                <path d="M -14,0 L 14,0 L 37,76 L 60,0 L 74,0 L 44,100 L 30,100 L 0,14 L -14,0 Z" />
              </g>
              
              {/* A */}
              <g transform="translate(884, 0)">
                <path d="M 24,8 L 28,0 L 46,0 L 50,8 Z M 30,22 L 44,22 L 74,100 L 60,100 L 37,46 L 14,100 L 0,100 Z" />
              </g>
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Nav / progress island — right-aligned on mobile (mirrors the logo's
          left inset) since it's just the hamburger trigger there; centered
          from md up, where it's the full inline nav pill. */}
      <div className="fixed inset-x-0 top-3 z-40 flex justify-end px-3 sm:top-4 sm:px-4 md:top-6 md:justify-center md:px-0">
        <motion.div
          layout
          initial={{ opacity: 0, y: -24, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="relative rounded-full p-px"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.10))",
          }}
        >
          {/* Ambient warm halo, echoes the fire/spark motif threaded through the story */}
          <div
            className="pointer-events-none absolute -inset-5 -z-10 rounded-full opacity-40 blur-2xl"
            style={{ background: "radial-gradient(ellipse at center, rgba(232,180,120,0.4), transparent 70%)" }}
          />

          <motion.header
            layout
            className="flex items-center gap-3 rounded-full bg-black/70 px-3 py-2 backdrop-blur-2xl backdrop-saturate-150 md:gap-4 md:px-5 md:py-3"
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.09), inset 0 0 0 1px rgba(255,255,255,0.02), 0 24px 50px -14px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.45)",
            }}
          >
            {/* Desktop/tablet: full inline nav */}
            <motion.div layout className="hidden items-center gap-3 sm:gap-5 md:flex">
              {NAV_ITEMS.map((item) => (
                <motion.button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  className="shrink-0 whitespace-nowrap text-[10px] tracking-[0.28em] uppercase text-white/60 transition-all duration-300 hover:text-[color:var(--accent-warm)] hover:[text-shadow:0_0_14px_rgba(232,180,120,0.55)]"
                >
                  {item.label}
                </motion.button>
              ))}
            </motion.div>

            {/* Mobile: single hamburger trigger instead of the cramped inline row */}
            <motion.button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              whileTap={{ scale: 0.92 }}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="flex h-5 w-5 items-center justify-center text-white/70 transition-colors duration-300 hover:text-[color:var(--accent-warm)] md:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" strokeWidth={1.75} /> : <Menu className="h-4 w-4" strokeWidth={1.75} />}
            </motion.button>
          </motion.header>
        </motion.div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden">
            <motion.div
              key="mobile-nav-backdrop"
              className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="mobile-nav-panel"
              className="fixed inset-x-6 top-16 z-[45] overflow-hidden rounded-2xl p-px sm:inset-x-10"
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.10))",
              }}
            >
              <div
                className="flex flex-col rounded-2xl bg-black/85 backdrop-blur-2xl backdrop-saturate-150"
                style={{
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.09), 0 24px 50px -14px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.45)",
                }}
              >
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item)}
                    className="px-5 py-4 text-left text-xs tracking-[0.24em] text-white/70 uppercase transition-colors duration-300 hover:text-[color:var(--accent-warm)]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
