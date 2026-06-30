"use client";

import { useEffect, useRef, useState } from "react";
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

/* ─── ALL 8 IMAGES ─────────────────────────────────────────────── */
const IMAGES = [bg1, bg2, bg3, bg4, bg5, bg6, bg7, bg8];
const N = IMAGES.length;

const DATA = [
  { title: "Where Every Journey Begins", subtitle: "Chapter I", description: "Before guidance, there is curiosity. Noorva is born from the belief that every person deserves a companion that truly listens, learns, and leads the way forward.", button: "Explore" },
  { title: "Intelligence Shaped Around You", subtitle: "Chapter II", description: "Noorva learns your rhythms — your mornings, your goals, your moments of doubt and ambition.", button: "Discover" },
  { title: "A Smarter Path Ahead", subtitle: "Chapter III", description: "With every interaction, Noorva deepens its understanding. Trusted knowledge, timely guidance, and human-like conversation.", button: "Learn More" },
  { title: "Built on Deep Listening", subtitle: "Chapter IV", description: "Noorva doesn't just process words — it hears the meaning behind them.", button: "Experience" },
  { title: "Knowledge At Your Pace", subtitle: "Chapter V", description: "Whether you need a quick answer or a deep dive, Noorva matches your tempo.", button: "Begin" },
  { title: "Clarity Through Complexity", subtitle: "Chapter VI", description: "In a world of overwhelming information, Noorva cuts through the noise.", button: "See How" },
  { title: "A Presence You Can Trust", subtitle: "Chapter VII", description: "More than an assistant, Noorva is a presence — consistent, thoughtful, and always in your corner.", button: "Connect" },
  { title: "The Beginning Of What's Next", subtitle: "Chapter VIII", description: "This is only the start. Noorva evolves with you — anticipating tomorrow's challenges.", button: "Start Now" },
];

/* ─── EASING HELPERS ────────────────────────────────────────────── */
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const smooth = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ═══════════════════════════════════════════════════════════════════
   SHOWCASE SECTION — 3D rotating scroll carousel with full-screen expansion
   ═══════════════════════════════════════════════════════════════════ */
export default function ShowcaseSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  const layoutRef = useRef({
    cardW: 0, cardH: 0, activeW: 0, activeH: 0, activeX: 0,
    inactiveX: 0, inactiveZ: 0, inactiveRotY: 0, inactiveRotZ: 0,
    spacing: 0, borderRadius: 0, isMobile: false
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Dynamically calculate layout properties in pixels for performance and responsiveness
    const updateLayout = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = w < 768;
      if (isMobile) {
        layoutRef.current = {
          cardW: w * 0.74,
          cardH: h * 0.46,
          activeW: w,
          activeH: h,
          activeX: 0,
          inactiveX: w * 0.62,
          inactiveZ: -280,
          inactiveRotY: -35,
          inactiveRotZ: -6,
          spacing: w * 0.58,
          borderRadius: 20,
          isMobile: true
        };
      } else {
        layoutRef.current = {
          cardW: w * 0.35,
          cardH: h * 0.56,
          activeW: w * 0.58,
          activeH: h,
          activeX: w * 0.21, // Aligns card center to the right panel
          inactiveX: w * 0.38,
          inactiveZ: -360,
          inactiveRotY: -42,
          inactiveRotZ: -8,
          spacing: w * 0.30,
          borderRadius: 24,
          isMobile: false
        };
      }
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);

    // Initial position setup for cards
    const layout = layoutRef.current;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const isFirst = i === 0;
      const x = isFirst ? layout.activeX : layout.activeX + layout.inactiveX + (i - 1) * layout.spacing;
      const z = isFirst ? 0 : layout.inactiveZ;
      const rotY = isFirst ? 0 : layout.inactiveRotY;
      const rotZ = isFirst ? 0 : layout.inactiveRotZ;
      const w = isFirst ? layout.activeW : layout.cardW;
      const h = isFirst ? layout.activeH : layout.cardH;
      const br = isFirst ? 0 : layout.borderRadius;
      const zIndex = isFirst ? 100 : 100 - i * 10;
      const op = isFirst ? 1.0 : (i === 1 ? 0.85 : (i === 2 ? 0.55 : 0.0));

      gsap.set(card, {
        x,
        y: 0,
        z,
        rotateY: rotY,
        rotateZ: rotZ,
        width: w,
        height: h,
        borderRadius: br,
        zIndex,
        opacity: op,
      });
    });

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: `+=${N * 120}%`, // smooth scroll
      pin: true,
      pinSpacing: true,
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress;
        const activeIdx = p * (N - 1);
        const currentScene = Math.min(N, Math.max(1, Math.round(activeIdx + 1)));

        // Update progress bar width
        if (progressRef.current) {
          progressRef.current.style.width = `${(activeIdx / (N - 1)) * 100}%`;
        }

        // Update counter scene digit
        if (counterRef.current) {
          counterRef.current.innerText = `${String(currentScene).padStart(2, "0")}`;
        }

        const layout = layoutRef.current;

        cardRefs.current.forEach((card, i) => {
          if (!card) return;

          const diff = i - activeIdx;
          const absDiff = Math.abs(diff);
          const sign = Math.sign(diff);

          // 1. Calculate Base Inactive Properties
          let baseX = 0;
          let baseY = 0;
          let baseZ = 0;
          let baseRotY = 0;
          let baseRotZ = 0;
          let baseOpacity = 0;

          if (sign >= 0) {
            baseX = layout.activeX + layout.inactiveX + (diff - 1) * layout.spacing;
            baseZ = layout.inactiveZ - (diff - 1) * 80;
            baseRotY = layout.inactiveRotY;
            baseRotZ = layout.inactiveRotZ;
            // Cards further than index 2 in stack have 0 opacity
            baseOpacity = diff <= 2 ? 0.85 - (diff - 1) * 0.30 : 0.0;
          } else {
            baseX = layout.activeX - layout.inactiveX + (diff + 1) * layout.spacing;
            baseZ = layout.inactiveZ - (-diff - 1) * 80;
            baseRotY = -layout.inactiveRotY;
            baseRotZ = -layout.inactiveRotZ;
            // Receding cards to the left fade out completely behind the dark overlay
            baseOpacity = 0.0;
          }

          // 2. Interpolate if within active range
          let x = baseX;
          let y = baseY;
          let z = baseZ;
          let rotY = baseRotY;
          let rotZ = baseRotZ;
          let w = layout.cardW;
          let h = layout.cardH;
          let br = layout.borderRadius;
          let opacity = baseOpacity;

          // Transition factor (0 to 1)
          const t = clamp01(1 - absDiff);
          const ease = smooth(t); // smooth transition curve

          if (absDiff < 1) {
            x = x + (layout.activeX - x) * ease;
            y = 0;
            z = z + (0 - z) * ease;
            rotY = rotY + (0 - rotY) * ease;
            rotZ = rotZ + (0 - rotZ) * ease;
            w = w + (layout.activeW - w) * ease;
            h = h + (layout.activeH - h) * ease;
            br = br + (0 - br) * ease;
            opacity = opacity + (1.0 - opacity) * ease;
          }

          // Add float to the front card when scroll is steady
          let floatY = 0;
          if (absDiff < 0.05) {
            floatY = Math.sin(p * Math.PI * 6) * 6;
          }

          // Apply styles dynamically for maximal performance (bypasses Virtual DOM rendering lags)
          card.style.width = `${w}px`;
          card.style.height = `${h}px`;
          card.style.borderRadius = `${br}px`;
          card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y + floatY}px, ${z}px) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
          card.style.zIndex = `${Math.round(100 - absDiff * 10)}`;
          card.style.opacity = `${clamp01(opacity)}`;
        });

        // 3. TEXT TRANSITIONS (prevents overlap by fading out fully before the next enter)
        textRefs.current.forEach((text, i) => {
          if (!text) return;
          const diff = i - activeIdx;
          const absDiff = Math.abs(diff);

          const textActive = absDiff < 0.5;
          const textOp = textActive ? easeOut((0.5 - absDiff) / 0.5) : 0;
          const textY = 32 * (1 - textOp);

          text.style.opacity = `${textOp}`;
          text.style.transform = `translateY(${textY}px)`;
          text.style.visibility = textOp > 0 ? "visible" : "hidden";
        });

        // 4. LIQUID DOTS (mobile)
        dotRefs.current.forEach((dot, i) => {
          if (!dot) return;
          const diff = i - activeIdx;
          const absDiff = Math.abs(diff);
          const dotWeight = clamp01(1 - absDiff);
          dot.style.width = `${6 + (24 - 6) * dotWeight}px`;
          dot.style.background = `rgba(255,255,255, ${0.15 + (0.90 - 0.15) * dotWeight})`;
        });
      },
    });

    return () => {
      st.kill();
      window.removeEventListener("resize", updateLayout);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full h-screen bg-black overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 75% 50%, rgba(120,80,255,0.06) 0%, transparent 55%)",
        zIndex: 0,
      }} />

      {/* ── Fixed deep dark left overlay for desktop readability ── */}
      <div
        className="hidden md:block absolute left-0 top-0 bottom-0 w-[52%] pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(to right, #000000 0%, rgba(0,0,0,0.96) 65%, rgba(0,0,0,0.80) 90%, transparent 100%)",
        }}
      />

      {/* ── Fixed dark bottom overlay for mobile readability ── */}
      <div
        className="md:hidden absolute inset-x-0 bottom-0 h-[45%] pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.50) 45%, transparent 100%)",
        }}
      />

      {/* ── 8 CARDS ALWAYS IN DOM (3D position relative to center) ── */}
      <div className="absolute inset-0 w-full h-full z-10 pointer-events-none" style={{ transformStyle: "preserve-3d" }}>
        {IMAGES.map((img, i) => (
          <div
            key={i}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="absolute left-1/2 top-1/2 overflow-hidden bg-neutral-950 will-change-transform shadow-2xl pointer-events-auto"
            style={{
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
          >
            <Image
              src={img}
              alt={DATA[i].title}
              fill
              className="object-cover pointer-events-none select-none"
              sizes="(max-width: 768px) 80vw, 55vw"
              priority={i === 0}
            />
            {/* Inner shadow overlay for cinematic depth */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.40) 0%, transparent 60%)",
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Text overlays — 2D flat, left-aligned ─────────────── */}
      <div className="absolute inset-0 z-20 pointer-events-none w-full h-full">
        {DATA.map((item, i) => (
          <div
            key={i}
            ref={(el) => { textRefs.current[i] = el; }}
            className={[
              "absolute inset-0 flex flex-col pointer-events-none justify-end pb-24 px-8 items-start",
              "md:justify-center md:pb-0 md:px-20 lg:px-28 md:items-start md:max-w-[48%]",
            ].join(" ")}
            style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}
          >
            <span className="text-[10px] tracking-[0.6em] uppercase text-white/40 mb-4 font-light">
              {item.subtitle}
            </span>
            <h2
              className="font-[var(--font-playfair)] text-3xl md:text-5xl lg:text-6xl font-extralight text-white leading-[1.08] max-w-xl"
              style={{ textShadow: "0 4px 60px rgba(0,0,0,0.9)" }}
            >
              {item.title}
            </h2>
            <div className="mt-5 w-16 h-px bg-gradient-to-r from-white/50 to-transparent" />
            <p className="mt-4 max-w-sm text-sm md:text-base font-light text-white/52 leading-relaxed">
              {item.description}
            </p>
            <a
              href="#"
              className="mt-8 inline-flex items-center gap-3 rounded-full px-8 py-3.5 font-light text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:translate-y-[-2px] pointer-events-auto"
              style={{
                background: "linear-gradient(135deg, rgba(120,80,255,0.22), rgba(70,140,255,0.16))",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {item.button} <span className="opacity-50">→</span>
            </a>
          </div>
        ))}
      </div>

      {/* ── Progress bar (desktop) ─────────────────────────────── */}
      <div className="hidden md:block absolute bottom-12 left-20 lg:left-28 w-48 h-[2px] bg-white/[0.08] rounded-full overflow-hidden z-30" style={{ zIndex: 200 }}>
        <div ref={progressRef}
          className="h-full bg-gradient-to-r from-violet-400 to-blue-400 rounded-full"
          style={{ width: "0%", transition: "width 0.3s ease" }}
        />
      </div>

      {/* ── Counter (desktop) ──────────────────────────────────── */}
      <span className="hidden md:block absolute bottom-10 right-12 font-mono text-[10px] tracking-widest text-white/20 z-30" style={{ zIndex: 200 }}>
        <span ref={counterRef}>01</span> / 0{N}
      </span>

      {/* ── Dots (mobile) ──────────────────────────────────────── */}
      <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-30" style={{ zIndex: 200 }}>
        {Array.from({ length: N }).map((_, i) => (
          <span
            key={i}
            ref={(el) => { dotRefs.current[i] = el; }}
            className="block h-[3px] rounded-full"
            style={{
              width: i === 0 ? "24px" : "6px",
              background: i === 0 ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.15)",
              transition: "width 0.1s ease, background 0.1s ease",
            }}
          />
        ))}
      </div>
    </section>
  );
}
