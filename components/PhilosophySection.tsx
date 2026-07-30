"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Ported from MDSIndia's own VisionSection ("Our Philosophy / Built On
// Conviction") and re-skinned to Noorva's design system — same overall
// cross-dissolve mechanic and copy, but Noorva's own fonts (font-playfair,
// not Space Grotesk/Neue Machina), accent palette (--accent-1/2/warm, not
// MDS's blue/violet/amber Tailwind stops), and glass/vignette conventions
// in place of MDS's own section-padding/scene-fade globals, which don't
// exist in this project.
//
// The pin mechanic itself was ALSO swapped: the source used
// position: sticky (via framer-motion's useScroll against a 300vh-tall
// container). That doesn't hold here — this site's global `overflow-x:
// hidden` on html/body (needed elsewhere to guard against off-screen wide
// artwork) changes sticky's containing-block behavior in Chromium, so the
// "pinned" stage just scrolled past like a normal element instead of
// holding still. Every other pinned-scroll section in this codebase
// (FeaturesSection, StoryGallerySection) already works around exactly this
// by using GSAP ScrollTrigger's pin:true instead — same fix applied here,
// feeding the resulting progress into a framer-motion MotionValue so the
// existing useTransform-driven sub-components below didn't need to change
// at all.

const edgeFadeMask: CSSProperties = {
  maskImage:
    "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%), linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
  maskComposite: "intersect",
  WebkitMaskImage:
    "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%), linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
  WebkitMaskComposite: "source-in",
};

interface Pillar {
  index: string;
  label: string;
  headline: string;
  image: string;
  aspect: string;
  dot: string;
  gradient: string;
  glow: string;
}

const PILLARS: Pillar[] = [
  {
    index: "01",
    label: "Mission",
    headline: "To create AI that genuinely understands human life — in all its complexity, emotion, and beauty.",
    image: "/philosophy-mission.png",
    aspect: "1672 / 941",
    dot: "#4fa8d5",
    gradient: "from-[color:var(--accent-2)] to-[color:var(--accent-1)]",
    glow: "rgba(79,168,213,0.35)",
  },
  {
    index: "02",
    label: "Vision",
    headline: "A world where every person has an intelligent companion that helps them live more fully, intentionally, and meaningfully.",
    image: "/philosophy-vision.png",
    aspect: "1672 / 941",
    dot: "#7c5cfc",
    gradient: "from-[color:var(--accent-1)] to-[#db45d7]",
    glow: "rgba(124,92,252,0.35)",
  },
  {
    index: "03",
    label: "Purpose",
    headline: "We don't build technology for technology's sake. We build it to advance what it means to be human.",
    image: "/philosophy-purpose.png",
    aspect: "1672 / 941",
    dot: "#e8b478",
    gradient: "from-[color:var(--accent-warm)] to-[#f4d9a8]",
    glow: "rgba(232,180,120,0.35)",
  },
];

function TimelineRail({ progress }: { progress: MotionValue<number> }) {
  const total = PILLARS.length;
  const dotTop = useTransform(progress, [0, 1], ["0%", "100%"]);

  return (
    <div className="hidden h-full flex-shrink-0 flex-col items-center md:flex" style={{ width: 24 }}>
      <span className="mb-3 text-[0.6rem] tracking-[0.3em] whitespace-nowrap text-white/45 uppercase">Start</span>
      <div className="relative w-px flex-1 bg-white/15">
        {PILLARS.map((item, i) => (
          <span
            key={item.label}
            className="absolute rounded-full"
            style={{
              left: "50%",
              top: `${(i / (total - 1)) * 100}%`,
              width: 11,
              height: 11,
              background: item.dot,
              boxShadow: `0 0 14px ${item.glow}`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
        <motion.span
          className="absolute rounded-full"
          style={{
            left: "50%",
            top: dotTop,
            width: 15,
            height: 15,
            background: "#ffffff",
            boxShadow: "0 0 16px rgba(255,255,255,0.85)",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
    </div>
  );
}

function MobileProgress({ progress }: { progress: MotionValue<number> }) {
  const width = useTransform(progress, [0, 1], ["0%", "100%"]);
  return (
    <div className="relative mb-6 h-1 w-full overflow-hidden rounded-full bg-white/10 md:hidden">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width, background: "linear-gradient(90deg, #4fa8d5, #7c5cfc, #e8b478)" }}
      />
    </div>
  );
}

function ScrollPanel({
  pillar,
  index,
  total,
  progress,
}: {
  pillar: Pillar;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const step = 1 / total;
  const start = index * step;
  const end = (index + 1) * step;
  const pad = step * 0.25;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const opacity = useTransform(
    progress,
    isFirst
      ? [start, start + pad, end - pad, end]
      : isLast
        ? [start, start + pad, end]
        : [start, start + pad, end - pad, end],
    isFirst ? [1, 1, 1, 0] : isLast ? [0, 1, 1] : [0, 1, 1, 0]
  );
  const scale = useTransform(
    progress,
    isFirst
      ? [end - pad, end]
      : isLast
        ? [start, start + pad]
        : [start, start + pad, end - pad, end],
    isFirst ? [1, 1.05] : isLast ? [0.95, 1] : [0.95, 1, 1, 1.05]
  );

  const revealStart = isFirst ? -pad : start;
  const indexY = useTransform(progress, [revealStart, revealStart + pad * 0.4], [18, 0]);
  const indexOpacity = useTransform(progress, [revealStart, revealStart + pad * 0.4], [0, 1]);
  const labelY = useTransform(progress, [revealStart + pad * 0.15, revealStart + pad * 0.6], [22, 0]);
  const labelOpacity = useTransform(progress, [revealStart + pad * 0.15, revealStart + pad * 0.6], [0, 1]);
  const bodyY = useTransform(progress, [revealStart + pad * 0.35, revealStart + pad], [26, 0]);
  const bodyOpacity = useTransform(progress, [revealStart + pad * 0.35, revealStart + pad], [0, 1]);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center gap-8 md:flex-row md:gap-14"
      style={{ opacity, scale }}
    >
      <motion.div
        className="w-full flex-shrink-0 text-center md:w-[300px] md:text-left"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.span
          className="mb-1 block text-sm font-semibold tracking-[0.1em] text-white/45"
          style={{ y: indexY, opacity: indexOpacity }}
        >
          {pillar.index}
        </motion.span>
        <motion.span
          className={`font-playfair mb-4 block bg-gradient-to-r text-2xl tracking-widest uppercase md:text-3xl ${pillar.gradient} bg-clip-text text-transparent`}
          style={{ y: labelY, opacity: labelOpacity }}
          animate={{
            filter: [
              "drop-shadow(0 0 0px rgba(255,255,255,0))",
              "drop-shadow(0 0 14px rgba(255,255,255,0.4))",
              "drop-shadow(0 0 0px rgba(255,255,255,0))",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {pillar.label}
        </motion.span>
        <motion.p
          className="font-light leading-relaxed text-white/75"
          style={{ fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)", lineHeight: 1.75, y: bodyY, opacity: bodyOpacity }}
        >
          {pillar.headline}
        </motion.p>
      </motion.div>

      <div
        className="relative w-full flex-1 overflow-hidden rounded-2xl"
        style={{ aspectRatio: pillar.aspect, ...edgeFadeMask }}
      >
        <Image
          src={pillar.image}
          alt={pillar.label}
          fill
          quality={100}
          sizes="(min-width: 768px) 640px, 92vw"
          className="object-contain"
        />
      </div>
    </motion.div>
  );
}

export default function PhilosophySection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const proxy = { p: 0 };
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: "top top",
        end: () => "+=" + window.innerHeight * PILLARS.length,
        pin: true,
        scrub: 0.35,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    tl.to(proxy, {
      p: 1,
      duration: 1,
      ease: "none",
      onUpdate: () => progress.set(proxy.p),
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [progress]);

  return (
    <section id="philosophy" className="relative w-full overflow-hidden bg-[color:var(--bg)]/70 py-28 md:py-36">
      <div className="pointer-events-none absolute -top-20 right-0 h-[600px] w-[700px] translate-x-1/4">
        <div
          className="h-full w-full rounded-full opacity-70 blur-[120px]"
          style={{ background: "radial-gradient(ellipse, rgba(79,168,213,0.14), transparent 70%)" }}
        />
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[600px] -translate-x-1/4">
        <div
          className="h-full w-full rounded-full opacity-70 blur-[120px]"
          style={{ background: "radial-gradient(ellipse, rgba(124,92,252,0.14), transparent 70%)" }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 vignette-edge" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10">
        <div className="mb-10 text-center md:mb-14">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="block text-[10px] font-light tracking-[0.5em] text-[color:var(--accent-warm)]/80 uppercase md:text-xs"
          >
            Our Philosophy
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-playfair mt-4 text-4xl leading-[0.95] font-light text-white/95 md:text-6xl lg:text-7xl"
          >
            Built On
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #3965e5 0%, #7c5cfc 50%, #db45d7 100%)",
                filter: "drop-shadow(0 0 24px rgba(124,92,252,0.35))",
              }}
            >
              Conviction
            </span>
          </motion.h2>
        </div>
      </div>

      {/* Pinned stage — pillars cross-dissolve as the visitor scrolls
          through a full extra viewport height per pillar (see the
          ScrollTrigger effect above for why GSAP pins this instead of
          position: sticky). */}
      <div ref={stageRef} className="relative flex h-screen items-center justify-center overflow-hidden">
        <div className="relative mx-auto w-full max-w-6xl px-6 md:px-10">
          <MobileProgress progress={progress} />
          <div className="relative flex items-stretch gap-6 md:gap-10" style={{ height: "min(58vh, 480px)" }}>
            <TimelineRail progress={progress} />
            <div className="relative flex-1">
              {PILLARS.map((pillar, i) => (
                <ScrollPanel key={pillar.label} pillar={pillar} index={i} total={PILLARS.length} progress={progress} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="mt-10 md:mt-14"
        >
          <blockquote
            className="font-playfair font-light leading-relaxed text-white/75"
            style={{ fontSize: "clamp(1.3rem, 2.8vw, 2.4rem)", lineHeight: 1.45 }}
          >
            &ldquo;The greatest technology is the one that{" "}
            <span
              className="bg-clip-text font-medium text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #3965e5 0%, #7c5cfc 50%, #db45d7 100%)" }}
            >
              makes you feel more human.
            </span>
            &rdquo;
          </blockquote>
          <p className="mt-6 text-xs tracking-[0.4em] text-[color:var(--accent-warm)]/80 uppercase">— Noorva</p>
        </motion.div>
      </div>
    </section>
  );
}
