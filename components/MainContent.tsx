"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import bg1 from "../assets/images/background image 1.png";
import bg2 from "../assets/images/background image 2.png";
import bg3 from "../assets/images/background image 3.png";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const SLIDES = [
  {
    src: bg1,
    chapter: "I",
    heading: "Where Every\nJourney Begins",
    body: "Before guidance, there is curiosity. Noorva is born from the belief that every person deserves a companion that truly listens, learns, and leads the way forward.",
  },
  {
    src: bg2,
    chapter: "II",
    heading: "Intelligence\nShaped Around You",
    body: "Noorva learns your rhythms — your mornings, your goals, your moments of doubt and ambition — and shapes its intelligence around the life you actually live.",
  },
  {
    src: bg3,
    chapter: "III",
    heading: "A Smarter\nPath Ahead",
    body: "With every interaction, Noorva deepens its understanding. Trusted knowledge, timely guidance, and human-like conversation — all moving you forward with clarity.",
  },
];

/* ─────────────────────────────────────────────────────────────────
   STORY SECTION
   Each slide is independently pinned. When a slide's ScrollTrigger
   starts, the image card rotates in from the right (rotationY 90→0),
   holds while the text is visible, then rotates out to the left
   (rotationY 0→-90) into the next slide.
───────────────────────────────────────────────────────────────── */
function StorySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs     = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs     = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const N         = SLIDES.length;
    const container = containerRef.current;
    if (!container) return;

    // ── Initial states ────────────────────────────────────────
    SLIDES.forEach((_, i) => {
      const card = cardRefs.current[i];
      const text = textRefs.current[i];
      if (!card || !text) return;
      gsap.set(card, { rotationY: i === 0 ? 0 : 90, opacity: i === 0 ? 1 : 0 });
      gsap.set(text, { opacity: 0, y: 36 });
    });

    // ── Single pinned ScrollTrigger — total scroll = N × 100vh ─
    const st = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: `+=${N * 100}%`,
      pin: true,
      pinSpacing: true,
      scrub: 0.9,
      onUpdate: (self) => {
        // totalP goes 0 → N; slide i owns the segment [i, i+1]
        const totalP = self.progress * N;

        SLIDES.forEach((_, i) => {
          const card   = cardRefs.current[i];
          const text   = textRefs.current[i];
          if (!card || !text) return;

          const isLast = i === N - 1;
          // local progress for this slide clamped to [0, 1]
          const p = clamp01(totalP - i);

          // ── Card rotation ──────────────────────────────────
          let rotY: number;
          let cardOp: number;

          if (p < 0.30) {
            const t = easeOut3(p / 0.30);
            rotY   = i === 0 ? 0 : 90 * (1 - t);
            cardOp = i === 0 ? 1 : 0.15 + 0.85 * t;
          } else if (p < 0.70 || isLast) {
            rotY   = 0;
            cardOp = 1;
          } else {
            const t = easeIn3((p - 0.70) / 0.30);
            rotY   = -90 * t;
            cardOp = 1 - t * 0.5;
          }

          gsap.set(card, { rotationY: rotY, opacity: cardOp });

          // ── Text ───────────────────────────────────────────
          const tIn  = clamp01((p - 0.25) / 0.20);
          const tOut = isLast ? 0 : clamp01((p - 0.68) / 0.14);
          const textOp = easeOut3(tIn) * (1 - easeIn3(tOut));
          const textY  = 36 * (1 - easeOut3(tIn)) + 18 * easeIn3(tOut);

          gsap.set(text, { opacity: textOp, y: textY });
        });
      },
    });

    return () => st.kill();
  }, []);

  return (
    // Single container pinned for the full scroll distance
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden"
      style={{ perspective: "1400px" }}
    >
      {SLIDES.map((slide, i) => (
        // All slides stacked absolutely — no vertical gaps possible
        <div key={i} className="absolute inset-0">
          {/* ── IMAGE CARD (rotates in/out) ─────────────────── */}
          <div
            ref={(el) => { cardRefs.current[i] = el; }}
            className="absolute inset-0 will-change-transform"
            style={{
              transformOrigin: "center center",
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
          >
            {/* ── Portrait layout: full-screen image ─────── */}
            <div className="md:hidden absolute inset-0 bg-black">
              <Image
                src={slide.src}
                alt={`Chapter ${slide.chapter}`}
                fill
                className="object-cover object-top"
                sizes="100vw"
                priority={i === 0}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.50) 38%, transparent 70%)",
                }}
              />
            </div>

            {/* ── Landscape layout: right-side image panel ─ */}
            <div className="hidden md:block absolute inset-0 bg-black">
              <div
                className="absolute left-0 top-0 bottom-0 w-[50%]"
                style={{
                  background:
                    "linear-gradient(to right, #000000 0%, rgba(0,0,0,0.96) 70%, rgba(0,0,0,0.80) 100%)",
                  zIndex: 2,
                }}
              />
              <div className="absolute right-0 top-0 bottom-0 w-[58%]">
                <Image
                  src={slide.src}
                  alt={`Chapter ${slide.chapter}`}
                  fill
                  className="object-cover object-center"
                  sizes="60vw"
                  priority={i === 0}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(0,0,0,0.75) 0%, transparent 40%)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── TEXT OVERLAY ────────────────────────────────── */}
          <div
            ref={(el) => { textRefs.current[i] = el; }}
            className={[
              "absolute inset-0 flex flex-col pointer-events-none",
              "justify-end pb-16 px-7 items-start",
              "md:justify-center md:pb-0 md:px-16 lg:px-24 md:items-start md:max-w-[52%]",
            ].join(" ")}
            style={{ opacity: 0 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-8 bg-white/35" />
              <span className="text-[9px] tracking-[0.65em] uppercase text-white/40 font-light">
                Chapter {slide.chapter}
              </span>
            </div>

            <h2
              className="font-[var(--font-playfair)] text-4xl md:text-5xl lg:text-[3.6rem] xl:text-[4.2rem] font-extralight text-white leading-[1.08]"
              style={{ textShadow: "0 4px 60px rgba(0,0,0,1)" }}
            >
              {slide.heading.split("\n").map((line, l) => (
                <span key={l} className="block">{line}</span>
              ))}
            </h2>

            <div className="mt-6 w-14 h-px bg-gradient-to-r from-white/45 to-transparent" />

            <p className="mt-5 max-w-sm text-sm font-light text-white/52 leading-relaxed">
              {slide.body}
            </p>

            <div className="mt-8 flex gap-2">
              {SLIDES.map((_, d) => (
                <span
                  key={d}
                  className="block h-[3px] rounded-full"
                  style={{
                    width: d === i ? "26px" : "7px",
                    background:
                      d === i ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.18)",
                    transition: "width 0.4s ease",
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Corner index ──────────────────────────────── */}
          <span className="absolute top-8 right-8 font-mono text-[10px] tracking-widest text-white/12 pointer-events-none select-none z-20">
            0{i + 1} / 0{SLIDES.length}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── EASING HELPERS ────────────────────────────────────────────── */
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut3 = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn3 = (t: number) => t * t * t;

/* ─── END SCREEN ────────────────────────────────────────────────── */
function EndScreen() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(
      el.querySelectorAll(".ei"),
      { opacity: 0, y: 38, filter: "blur(10px)" },
      {
        opacity: 1, y: 0, filter: "blur(0px)",
        duration: 1.6, stagger: 0.16, ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, []);

  return (
    <div
      ref={ref}
      className="relative w-full min-h-screen flex flex-col items-center justify-center text-center px-6 bg-black overflow-hidden"
    >
      {/* Ambient purple glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 60%, rgba(110,60,230,0.14) 0%, transparent 60%)",
        }}
      />
      {/* Concentric rings */}
      {[560, 380, 220].map((size) => (
        <div
          key={size}
          className="absolute rounded-full border border-white/[0.035] pointer-events-none"
          style={{
            width: size, height: size,
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center">
        <span className="ei block text-[9px] tracking-[0.65em] uppercase text-white/30 mb-10 font-light">
          The Future is Personal
        </span>

        <h1
          className="ei font-[var(--font-playfair)] text-6xl md:text-8xl lg:text-[6.5rem] font-extralight leading-none tracking-[-0.04em]"
          style={{
            background: "linear-gradient(148deg, #ffffff 0%, #c4b5fd 38%, #93c5fd 68%, #ffffff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Noorva
        </h1>

        <div className="ei mt-8 flex items-center gap-5">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/25" />
          <div className="w-1 h-1 rounded-full bg-white/30" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/25" />
        </div>

        <p className="ei mt-8 max-w-sm text-sm font-light text-white/40 leading-relaxed tracking-wide">
          Intelligence that understands the human journey.
        </p>

        <a
          href="#"
          className="ei mt-14 group inline-flex items-center gap-4 rounded-full px-12 py-4 font-light text-sm tracking-[0.22em] uppercase transition-all duration-500"
          style={{
            background: "linear-gradient(135deg, rgba(120,80,255,0.18), rgba(70,140,255,0.14))",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "rgba(255,255,255,0.70)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              "linear-gradient(135deg, rgba(120,80,255,0.35), rgba(70,140,255,0.28))";
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.22)";
            (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              "linear-gradient(135deg, rgba(120,80,255,0.18), rgba(70,140,255,0.14))";
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.10)";
            (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.70)";
          }}
        >
          Enter Noorva
          <span className="text-white/35 group-hover:text-white/70 transition-colors duration-300 text-base">→</span>
        </a>
      </div>
    </div>
  );
}

/* ─── MAIN EXPORT ───────────────────────────────────────────────── */
export default function MainContent() {
  return (
    <div className="bg-black text-white" style={{ overflowX: "clip" }}>
      <StorySection />
      <EndScreen />
    </div>
  );
}
