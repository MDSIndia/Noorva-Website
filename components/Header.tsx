"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollProgress, activeChapter, lenisRef } from "./store";
import { storyChapters } from "./storyData";

const NAV_ITEMS = [
  { label: "Home", target: 0 },
  { label: "Story", target: "story-gallery" },
  { label: "Join", target: "#closing" },
] as const;

export default function Header() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      // Reveal once the intro nears its end, then stay visible — now that the
      // island contains real nav links, hiding it again on scroll-back would
      // make "Home" defeat its own purpose by disappearing right after being clicked.
      setVisible((v) => v || scrollProgress.value > 0.94);
      setActive((a) => (activeChapter.value !== a ? activeChapter.value : a));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const current = storyChapters.find((c) => c.index === active);
  const currentLabel = current?.eyebrow.split("/")[1]?.trim();

  function goTo(target: string | number) {
    if (typeof target === "number") {
      lenisRef.current?.scrollTo(target, { duration: 1.4 });
      return;
    }
    if (target.startsWith("#")) {
      lenisRef.current?.scrollTo(target, { duration: 1.4 });
      return;
    }
    // Pinned chapters live inside GSAP pin-spacers, which throws off a plain
    // element-selector scroll target — use ScrollTrigger's own precise start offset instead.
    const trigger = ScrollTrigger.getById(target);
    if (trigger) lenisRef.current?.scrollTo(trigger.start, { duration: 1.4 });
  }

  return (
    <>
      {/* Logo — its own glowing badge, pinned to the top-left corner, independent of the nav pill */}
      <motion.div
        className="fixed top-4 left-4 md:top-6 md:left-6 z-50"
        initial={false}
        animate={{
          opacity: visible ? 1 : 0,
          y: visible ? 0 : -20,
          scale: visible ? 1 : 0.85,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        style={{ pointerEvents: visible ? "auto" : "none" }}
      >
        <motion.div
          whileHover={{ scale: 1.12, rotate: 8 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-xl"
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
      <div
        className="fixed inset-x-0 top-4 md:top-6 z-40 flex justify-center"
        style={{ pointerEvents: visible ? "auto" : "none" }}
      >
        <motion.div
          layout
          initial={false}
          animate={{
            opacity: visible ? 1 : 0,
            y: visible ? 0 : -24,
            scale: visible ? 1 : 0.85,
          }}
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
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="flex items-center gap-4 rounded-full bg-black/70 px-5 py-3 backdrop-blur-2xl backdrop-saturate-150"
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.09), inset 0 0 0 1px rgba(255,255,255,0.02), 0 24px 50px -14px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.45)",
            }}
          >
            <motion.div layout className="hidden items-center gap-5 sm:flex">
              {NAV_ITEMS.map((item) => (
                <motion.button
                  key={item.label}
                  onClick={() => goTo(item.target)}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  className="shrink-0 text-[10px] tracking-[0.28em] uppercase text-white/60 transition-all duration-300 hover:text-[color:var(--accent-warm)] hover:[text-shadow:0_0_14px_rgba(232,180,120,0.55)]"
                >
                  {item.label}
                </motion.button>
              ))}
            </motion.div>

            <AnimatePresence>
              {active > 0 && (
                <motion.div
                  layout
                  className="flex items-center gap-3 overflow-hidden"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <div className="hidden h-4 w-px shrink-0 bg-gradient-to-b from-transparent via-white/25 to-transparent sm:block" />

                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={active}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.25 }}
                      className="shrink-0 text-[10px] tracking-[0.3em] text-white/55 font-light"
                    >
                      {String(active).padStart(2, "0")} / 08
                    </motion.span>
                  </AnimatePresence>

                  <div className="flex shrink-0 gap-1">
                    {storyChapters.map((chapter) => (
                      <motion.span
                        key={chapter.index}
                        className="h-1 w-3 rounded-full"
                        animate={{
                          backgroundColor:
                            chapter.index === active ? "var(--accent-warm)" : "rgba(255,255,255,0.18)",
                          scale: chapter.index === active ? 1.15 : 1,
                          boxShadow:
                            chapter.index === active
                              ? "0 0 8px rgba(232,180,120,0.8)"
                              : "0 0 0px transparent",
                        }}
                        transition={{ duration: 0.4 }}
                      />
                    ))}
                  </div>

                  <AnimatePresence>
                    {hovered && currentLabel && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="shrink-0 overflow-hidden whitespace-nowrap border-l border-white/10 pl-3 text-[11px] font-light text-white/70"
                      >
                        {currentLabel}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.header>
        </motion.div>
      </div>
    </>
  );
}
