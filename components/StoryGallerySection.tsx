"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SpiralGallery from "./SpiralGallery";
import { galleryProgress, activeChapter } from "./store";
import { storyChapters } from "./storyData";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const UNIT_PX = 2200; // scroll distance devoted to each chapter (reading + roll transition)
const TOTAL_PX = UNIT_PX * storyChapters.length;
const REST_END = 0.7; // fraction of each chapter's slot spent flat/readable before it starts rolling

export default function StoryGallerySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [displayIndex, setDisplayIndex] = useState(0);

  const captionOpacity = useMotionValue(0);
  const captionY = useTransform(captionOpacity, [0, 1], [16, 0]);
  const captionBlur = useTransform(captionOpacity, (v) => `blur(${(1 - v) * 8}px)`);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "300px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: `+=${TOTAL_PX}`,
      scrub: 0.8,
      pin: true,
      anticipatePin: 1,
      id: "story-gallery",
      onUpdate: (self) => {
        const total = self.progress * storyChapters.length;
        galleryProgress.value = total;
        const baseIndex = Math.floor(total);
        const local = total - baseIndex;
        // Mirror the shader's own texture-swap point (local >= 0.85, see SpiralGallery)
        // so the header/progress-dots flip to the next chapter at the exact moment
        // the photo itself does, instead of at the next whole-number boundary.
        const displayIndex = local >= 0.85 ? baseIndex + 1 : baseIndex;
        activeChapter.value = Math.min(storyChapters.length, displayIndex + 1);
      },
    });

    return () => trigger.kill();
  }, []);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const total = Math.max(0, Math.min(storyChapters.length - 0.0001, galleryProgress.value));
      const baseIndex = Math.floor(total);
      const local = total - baseIndex;

      const nextDisplay = local >= 0.85 ? Math.min(baseIndex + 1, storyChapters.length - 1) : baseIndex;
      setDisplayIndex((d) => (d !== nextDisplay ? nextDisplay : d));

      let opacity = 0;
      if (local < REST_END) {
        if (local < 0.1) opacity = local / 0.1;
        else if (local < 0.55) opacity = 1;
        else opacity = Math.max(0, 1 - (local - 0.55) / 0.15);
      }
      captionOpacity.set(opacity);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [captionOpacity]);

  const chapter = storyChapters[displayIndex];

  return (
    <section
      id="story-gallery"
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden bg-black"
      style={{ zIndex: 25 }}
    >
      <SpiralGallery frameloop={inView ? "always" : "never"} />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />
      <div className="pointer-events-none absolute inset-0 vignette-edge" />

      <div className="absolute inset-x-0 bottom-0 z-10 px-8 pb-20 md:px-20 md:pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={chapter.index}
            className="max-w-3xl"
            style={{ opacity: captionOpacity, y: captionY, filter: captionBlur }}
          >
            <p className="mb-4 text-[10px] md:text-xs tracking-[0.5em] uppercase text-[color:var(--accent-warm)]/80 font-light">
              {chapter.eyebrow}
            </p>
            <h2 className="font-playfair text-3xl md:text-5xl font-light text-white/92 leading-[1.15] mb-5">
              {chapter.headline}
            </h2>
            <p className="text-base md:text-lg text-white/60 font-light max-w-xl">
              {chapter.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
