"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { lenisRef, galleryCaptureControl } from "./store";

const NAV_ITEMS = [
  { label: "Home", target: "home" },
  { label: "Story", target: "#story-gallery" },
  { label: "Join", target: "#closing" },
  { label: "About MDS", target: "https://mdsindia.in", external: true },
] as const;

export default function Header() {
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

  return (
    <>
      {/* Logo — its own glowing badge, pinned to the top-left corner, independent of the nav pill */}
      <motion.div
        className="fixed top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 z-50"
        initial={{ opacity: 0, y: -20, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <motion.div
          whileHover={{ scale: 1.12, rotate: 8 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-xl sm:h-11 sm:w-11"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.09), 0 8px 24px -6px rgba(0,0,0,0.6)",
          }}
        >
          <motion.div
            className="pointer-events-none absolute inset-0 -z-10 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(124,92,252,0.6), transparent 70%)" }}
            animate={{ opacity: [0.55, 0.95, 0.55], scale: [1, 1.25, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <Image src="/NoorvaLogo.png" alt="Noorva" width={24} height={24} className="opacity-95" />
        </motion.div>
      </motion.div>

      {/* Nav / progress island — centered, separate from the logo */}
      <div className="fixed inset-x-0 top-3 sm:top-4 md:top-6 z-40 flex justify-center px-16 sm:px-0">
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
            className="flex items-center gap-3 rounded-full bg-black/70 px-4 py-2.5 backdrop-blur-2xl backdrop-saturate-150 sm:gap-4 sm:px-5 sm:py-3"
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.09), inset 0 0 0 1px rgba(255,255,255,0.02), 0 24px 50px -14px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.45)",
            }}
          >
            <motion.div layout className="flex items-center gap-3 sm:gap-5">
              {NAV_ITEMS.map((item) => (
                <motion.button
                  key={item.label}
                  onClick={() => goTo(item.target, "external" in item && item.external)}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  className="shrink-0 whitespace-nowrap text-[8.5px] tracking-[0.2em] uppercase text-white/60 transition-all duration-300 hover:text-[color:var(--accent-warm)] hover:[text-shadow:0_0_14px_rgba(232,180,120,0.55)] sm:text-[10px] sm:tracking-[0.28em]"
                >
                  {item.label}
                </motion.button>
              ))}
            </motion.div>

          </motion.header>
        </motion.div>
      </div>
    </>
  );
}
