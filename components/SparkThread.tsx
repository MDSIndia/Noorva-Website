"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { activeChapter } from "./store";
import { storyChapters } from "./storyData";

interface NodeInfo {
  number: number;
  frac: number;
}

export default function SparkThread() {
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);

  const rawProgress = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, { stiffness: 120, damping: 22, mass: 0.6 });
  const emberTop = useTransform(smoothProgress, (v) => `${Math.min(100, Math.max(0, v * 100))}%`);

  useEffect(() => {
    function measure() {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      // All 8 chapters now live inside one continuously-pinned "story-gallery"
      // ScrollTrigger (photos roll between each other on a shared canvas)
      // rather than 8 separate DOM sections — so node positions come from
      // dividing that single trigger's own start/end range evenly.
      const trigger = ScrollTrigger.getById("story-gallery");
      if (total <= 0 || !trigger) return;
      const newNodes = storyChapters.map((chapter, i) => {
        const docTop = trigger.start + (i / storyChapters.length) * (trigger.end - trigger.start);
        return { number: chapter.index, frac: Math.min(1, Math.max(0, docTop / total)) };
      });
      setNodes(newNodes);
    }

    measure();
    const id = window.setTimeout(measure, 600);
    ScrollTrigger.addEventListener("refresh", measure);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(id);
      ScrollTrigger.removeEventListener("refresh", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const p = total > 0 ? window.scrollY / total : 0;
      rawProgress.set(p);
      setVisible(window.scrollY > window.innerHeight * 0.5);
      setActive(activeChapter.value);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rawProgress]);

  return (
    <motion.div
      className="fixed right-6 md:right-10 top-1/2 -translate-y-1/2 z-40 hidden sm:block pointer-events-none"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.7 }}
      style={{ height: "56vh" }}
    >
      <div className="relative h-full w-px bg-white/10">
        {nodes.map((n) => (
          <motion.span
            key={n.number}
            className="absolute -left-[3px] h-[7px] w-[7px] rounded-full"
            style={{ top: `${n.frac * 100}%` }}
            animate={{
              backgroundColor: n.number <= active ? "var(--accent-warm)" : "rgba(255,255,255,0.25)",
              boxShadow: n.number <= active ? "0 0 8px var(--accent-warm)" : "0 0 0px transparent",
              scale: n.number === active ? 1.3 : 1,
            }}
            transition={{ duration: 0.5 }}
          />
        ))}

        <motion.div
          className="absolute -left-[5px] h-[11px] w-[11px] rounded-full"
          style={{
            top: emberTop,
            background: "radial-gradient(circle, #fff 0%, var(--accent-warm) 55%, transparent 100%)",
          }}
          animate={{
            boxShadow: [
              "0 0 12px 3px var(--accent-warm)",
              "0 0 20px 6px var(--accent-warm)",
              "0 0 12px 3px var(--accent-warm)",
            ],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
