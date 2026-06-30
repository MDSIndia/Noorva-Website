"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import bg1 from "../assets/images/background image 1.png";
import bg2 from "../assets/images/background image 2.png";
import bg3 from "../assets/images/background image 3.png";
import bg4 from "../assets/images/background image 4.png";
import bg5 from "../assets/images/background image 5.png";
import bg6 from "../assets/images/background image 6.png";
import bg7 from "../assets/images/background image 7.png";
import bg8 from "../assets/images/background image 8.png";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ─── EASING ───────────────────────────────────────────────────── */
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut3 = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn3  = (t: number) => t * t * t;
const smooth   = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ─── SLIDES ───────────────────────────────────────────────────── */
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
  {
    src: bg4,
    chapter: "IV",
    heading: "Built on\nDeep Listening",
    body: "Noorva doesn't just process words — it hears the meaning behind them. Every question you ask shapes a more attuned, more empathetic companion for the road ahead.",
  },
  {
    src: bg5,
    chapter: "V",
    heading: "Knowledge\nAt Your Pace",
    body: "Whether you need a quick answer or a deep dive, Noorva matches your tempo. It meets you where you are and grows alongside your curiosity, always ready when you are.",
  },
  {
    src: bg6,
    chapter: "VI",
    heading: "Clarity Through\nComplexity",
    body: "In a world of overwhelming information, Noorva cuts through the noise — distilling what matters, surfacing what's relevant, and presenting it with effortless precision.",
  },
  {
    src: bg7,
    chapter: "VII",
    heading: "A Presence\nYou Can Trust",
    body: "More than an assistant, Noorva is a presence — consistent, thoughtful, and always in your corner. It earns trust not through perfection, but through genuine understanding.",
  },
  {
    src: bg8,
    chapter: "VIII",
    heading: "The Beginning\nOf What's Next",
    body: "This is only the start. Noorva evolves with you — anticipating tomorrow's challenges, celebrating today's victories, and illuminating every step of your personal journey.",
  },
];

/* ═══════════════════════════════════════════════════════════════════
   STORY SECTION — single pinned container, all slides stacked.
   One ScrollTrigger drives everything. Each slide occupies an equal
   band of the total progress. Image + text are synced so they appear
   together with zero gap between transitions.
   ═══════════════════════════════════════════════════════════════════ */
function StorySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs    = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const N = SLIDES.length;

    // ── Initial state ──────────────────────────────────────────
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      gsap.set(card, {
        rotationY: i === 0 ? 0 : 90,
        opacity:   i === 0 ? 1 : 0,
        transformPerspective: 1400,
        transformOrigin: "center center",
      });
    });
    textRefs.current.forEach((t) => { if (t) gsap.set(t, { opacity: 0, y: 30 }); });

    // ── Single pinned ScrollTrigger spanning all slides ────────
    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: `+=${N * 100}%`,
      pin: true,
      pinSpacing: true,
      scrub: 0.6,                       // fast, responsive scrub
      onUpdate: (self) => {
        const p = self.progress;        // 0 → 1 across all slides

        SLIDES.forEach((_, i) => {
          const card = cardRefs.current[i];
          const text = textRefs.current[i];
          const dot  = dotRefs.current[i];
          if (!card || !text) return;

          // Each slide occupies band [i/N … (i+1)/N]
          const lo   = i / N;
          const hi   = (i + 1) / N;
          const band = hi - lo;
          const lp   = clamp01((p - lo) / band);   // 0→1 within this slide's band

          // ── Card rotation ───────────────────────────────────
          // 0.00 → 0.25 : rotate in  (90° → 0°)  — fast entry
          // 0.25 → 0.75 : hold at 0°
          // 0.75 → 1.00 : rotate out (0° → -90°) — fast exit
          // Last slide never rotates out.
          const isLast = i === N - 1;
          const isFirst = i === 0;

          let rotY: number;
          let cardOp: number;

          if (lp < 0.25) {
            const t = smooth(lp / 0.25);
            rotY   = isFirst ? 0 : 90 * (1 - t);
            cardOp = isFirst ? 1 : 0.2 + 0.8 * t;
          } else if (lp < 0.75 || isLast) {
            rotY   = 0;
            cardOp = 1;
          } else {
            const t = smooth((lp - 0.75) / 0.25);
            rotY   = -90 * t;
            cardOp = 1 - t * 0.5;
          }

          gsap.set(card, { rotationY: rotY, opacity: cardOp });

          // ── Text — synced with card ─────────────────────────
          // Text fades in during the SAME window as card rotate-in (0.05→0.30)
          // and fades out during card rotate-out (0.75→0.90)
          const tIn  = clamp01((lp - 0.05) / 0.25);   // synced with card entry
          const tOut = isLast ? 0 : clamp01((lp - 0.75) / 0.15);
          const textOp = easeOut3(tIn) * (1 - easeIn3(tOut));
          const textY  = 30 * (1 - easeOut3(tIn)) + 15 * easeIn3(tOut);

          gsap.set(text, { opacity: textOp, y: textY });

          // ── Active dot ──────────────────────────────────────
          if (dot) {
            const isActive = lp > 0.1 && lp < 0.95;
            dot.style.width      = isActive ? "26px" : "7px";
            dot.style.background = isActive
              ? "rgba(255,255,255,0.85)"
              : "rgba(255,255,255,0.18)";
          }
        });
      },
    });

    return () => st.kill();
  }, []);

  return (
    <div
      ref={sectionRef}
      className="relative w-full h-screen bg-black overflow-hidden"
      style={{ perspective: "1400px" }}
    >
      {/* ── Image cards — all stacked, one visible at a time ──── */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          ref={(el) => { cardRefs.current[i] = el; }}
          className="absolute inset-0 will-change-transform"
          style={{
            transformOrigin: "center center",
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
          }}
        >
          {/* Portrait: full-screen image */}
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
                  "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.45) 40%, transparent 70%)",
              }}
            />
          </div>

          {/* Landscape: split layout */}
          <div className="hidden md:block absolute inset-0 bg-black">
            <div
              className="absolute left-0 top-0 bottom-0 w-[50%]"
              style={{
                background: "linear-gradient(to right, #000 0%, rgba(0,0,0,0.95) 70%, rgba(0,0,0,0.78) 100%)",
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
                  background: "linear-gradient(to right, rgba(0,0,0,0.70) 0%, transparent 40%)",
                }}
              />
            </div>
          </div>
        </div>
      ))}

      {/* ── Text overlays — one per slide ─────────────────────── */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
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
        </div>
      ))}

      {/* ── Progress dots (fixed) ─────────────────────────────── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-30 pointer-events-none">
        {SLIDES.map((_, d) => (
          <span
            key={d}
            ref={(el) => { dotRefs.current[d] = el; }}
            className="block h-[3px] rounded-full"
            style={{
              width: d === 0 ? "26px" : "7px",
              background: d === 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.18)",
              transition: "width 0.4s ease, background 0.4s ease",
            }}
          />
        ))}
      </div>

      {/* ── Corner counter ────────────────────────────────────── */}
      <span className="absolute top-8 right-8 font-mono text-[10px] tracking-widest text-white/12 pointer-events-none select-none z-30">
        0{SLIDES.length} panels
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   END SCREEN
   ═══════════════════════════════════════════════════════════════════ */
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
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 60%, rgba(110,60,230,0.14) 0%, transparent 60%)",
        }}
      />
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
            Object.assign((e.currentTarget as HTMLElement).style, {
              background: "linear-gradient(135deg, rgba(120,80,255,0.35), rgba(70,140,255,0.28))",
              border: "1px solid rgba(255,255,255,0.22)",
              color: "#fff",
            });
          }}
          onMouseLeave={(e) => {
            Object.assign((e.currentTarget as HTMLElement).style, {
              background: "linear-gradient(135deg, rgba(120,80,255,0.18), rgba(70,140,255,0.14))",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "rgba(255,255,255,0.70)",
            });
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
