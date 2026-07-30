"use client";

import { useRef } from "react";
import type { MouseEvent } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Brain, Heart, Compass, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// An emotional "who Noorva is" beat, not a corporate About page — sits
// between the feature journey and the closing waitlist CTA. Built from the
// same primitives as ClosingSection.tsx (framer-motion whileInView reveal,
// gradient-border glass panels, font-playfair headings, the site's
// accent-1/2/warm palette) rather than introducing a new visual language.

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};
const slideLeft = {
  hidden: { opacity: 0, x: -36, filter: "blur(6px)" },
  show: { opacity: 1, x: 0, filter: "blur(0px)" },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
};

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURE_CARDS: FeatureCard[] = [
  { icon: Brain, title: "Learns You", description: "Remembers your routines, preferences and goals." },
  { icon: Heart, title: "Understands You", description: "Responds with empathy and context instead of generic replies." },
  { icon: Compass, title: "Guides You", description: "Provides expert-backed personalized guidance that evolves with you." },
  { icon: Sprout, title: "Grows With You", description: "Improves every interaction through continuous learning and companionship." },
];

// The phone composition sits in a fixed reference frame, scaled down via
// CSS transform for smaller viewports (see ORBIT_FRAME_PX's own use below),
// so its aura/glow sizing never has to be redone per breakpoint.
const ORBIT_FRAME_PX = 460;

// Deterministic PRNG for the background particle field — same mulberry32
// used elsewhere in the codebase (CinematicIntro's own starfield) for
// reproducible "generated, not hand-picked" scatter.
function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PARTICLE_COUNT = 28;
const particleRand = mulberry32(4477);
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, () => ({
  x: particleRand() * 100,
  y: particleRand() * 100,
  size: 1.5 + particleRand() * 2.5,
  duration: 5 + particleRand() * 7,
  delay: particleRand() * 6,
}));

/** Tilts a card toward the cursor and moves a radial-gradient glow to follow
 *  it — mutates the DOM directly instead of going through React state, so a
 *  fast mousemove never triggers a re-render (matches how the rest of the
 *  site handles high-frequency pointer/scroll-driven visuals). */
function handleCardTilt(e: MouseEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width;
  const py = (e.clientY - rect.top) / rect.height;
  el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 8}deg) rotateY(${(px - 0.5) * 8}deg) translateY(-4px)`;
  el.style.setProperty("--mx", `${px * 100}%`);
  el.style.setProperty("--my", `${py * 100}%`);
}
function resetCardTilt(e: MouseEvent<HTMLDivElement>) {
  e.currentTarget.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)";
}

export default function AboutNoorvaSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="about-noorva"
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[color:var(--bg)]/70 py-28 md:py-36"
    >
      {/* Background — /70 (not fully opaque) so the site's own moving
          starfield (CosmicBackground, fixed behind every section) actually
          shows through, same convention as ClosingSection's own bg-[...]/70
          — these are local accents layered on top of that: drifting
          blurred orbs, a couple of very faint diagonal light rays, and a
          scattered particle field. All slow, all pointer-events-none. */}
      <div className="pointer-events-none absolute -top-32 left-[8%] h-[520px] w-[520px]">
        <div className="h-full w-full rounded-full bg-[color:var(--accent-1)]/15 blur-[130px] animate-float-slow" />
      </div>
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[560px] w-[560px]">
        <div
          className="h-full w-full rounded-full bg-[color:var(--accent-2)]/15 blur-[140px] animate-float-slow"
          style={{ animationDelay: "-6s", animationDuration: "18s" }}
        />
      </div>
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-[460px] w-[460px]">
        <div
          className="h-full w-full rounded-full bg-[color:var(--accent-warm)]/10 blur-[120px] animate-float-slow"
          style={{ animationDelay: "-3s", animationDuration: "16s" }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
        <div className="about-ray about-ray-a" />
        <div className="about-ray about-ray-b" />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="about-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 vignette-edge" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-20 px-6 md:px-10 lg:flex-row lg:items-center lg:gap-16">
        {/* Right visual on desktop, FIRST on mobile per the mobile stacking
            requirement (order classes flip it, rather than reordering the
            DOM, so it reads left-to-right/logically for keyboard+SR users
            regardless of viewport). */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
          variants={scaleIn}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="order-1 flex justify-center lg:order-2 lg:flex-1"
        >
          <div
            className="relative shrink-0 origin-center scale-[0.62] sm:scale-90 md:scale-100"
            style={{ width: ORBIT_FRAME_PX, height: ORBIT_FRAME_PX }}
          >
            {/* Aura */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[100px] animate-float-slow"
              style={{ background: "radial-gradient(circle, rgba(124,92,252,0.5), transparent 70%)" }}
            />
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[90px]"
              style={{ background: "radial-gradient(circle, rgba(79,168,213,0.45), transparent 70%)", animation: "float-slow 12s ease-in-out infinite reverse" }}
            />

            {/* Phone — a real product shot (hand holding a phone, Noorva's
                mark glowing on its screen) rather than a hand-built CSS
                mockup, so it reads as an actual device instead of an
                approximation of one. */}
            <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
              <div
                className="pointer-events-none absolute inset-[-20%] -z-10 rounded-full opacity-70 blur-3xl animate-float-slow"
                style={{ background: "radial-gradient(circle, rgba(124,92,252,0.55), transparent 70%)" }}
              />
              <Image
                src="/phone-in-hand-trimmed.png"
                alt="A hand holding a phone with Noorva's companion mark glowing on the screen"
                width={1525}
                height={1475}
                priority
                className="h-auto w-[360px] md:w-[440px]"
                style={{ filter: "drop-shadow(0 20px 45px rgba(0,0,0,0.55)) drop-shadow(0 0 40px rgba(124,92,252,0.45))" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Left content */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ staggerChildren: 0.12 }}
          className="order-2 lg:order-1 lg:flex-1"
        >
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-5 text-[10px] font-light tracking-[0.5em] text-[color:var(--accent-warm)]/80 uppercase md:text-xs"
          >
            About Noorva
          </motion.p>

          <motion.h2
            variants={slideLeft}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-balance font-playfair mb-7 text-4xl leading-[1.18] font-light text-white/95 md:text-5xl lg:text-[3.4rem]"
          >
            More Than AI.
            <br />A{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #3965e5 0%, #7c5cfc 50%, #db45d7 100%)",
                filter: "drop-shadow(0 0 24px rgba(124,92,252,0.35))",
              }}
            >
              Companion
            </span>{" "}
            That Grows With You.
          </motion.h2>

          <motion.div variants={fadeUp} transition={{ duration: 0.8, ease: "easeOut" }} className="mb-12 space-y-5">
            <p className="text-base leading-relaxed font-light text-white/65 md:text-lg">
              Noorva is designed to be more than an AI assistant. It is a companion that learns
              who you are, remembers what matters, understands your goals, and walks beside you
              every day.
            </p>
            <p className="text-base leading-relaxed font-light text-white/55 md:text-lg">
              Instead of simply answering questions, Noorva offers guidance, encouragement,
              thoughtful conversations, and personalized support that evolves over time.
            </p>
            <p className="text-base leading-relaxed font-light text-white/55 md:text-lg">
              Powered by advanced intelligence and shaped by human warmth, Noorva becomes a
              trusted presence that helps you navigate work, learning, relationships, health, and
              life&rsquo;s important moments.
            </p>
            <p className="text-base leading-relaxed font-light text-white/70 md:text-lg">
              It doesn&rsquo;t replace human connection — it strengthens it.
            </p>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            variants={fadeUp}
            transition={{ staggerChildren: 0.1, delayChildren: 0.1 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {FEATURE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.title} variants={fadeUp} transition={{ duration: 0.6, ease: "easeOut" }}>
                  {/* The entrance reveal above (opacity/y, managed by
                      framer-motion on the wrapping motion.div) and the
                      mouse-tilt below (raw el.style.transform, mutated
                      directly on mousemove) must live on two different DOM
                      nodes — framer-motion re-asserts its own control over
                      `transform` on a motion.div, silently overwriting any
                      transform set on that same node from outside it. */}
                  <div
                    onMouseMove={handleCardTilt}
                    onMouseLeave={resetCardTilt}
                    className="about-card-border group relative rounded-[22px] p-[1.5px] transition-shadow duration-500 will-change-transform"
                    style={{
                      background: "linear-gradient(135deg, rgba(57,101,229,0.4), rgba(124,92,252,0.45), rgba(219,69,215,0.4))",
                      backgroundSize: "200% 200%",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <div
                      className="relative h-full overflow-hidden rounded-[21px] border border-white/10 bg-black/85 p-5 backdrop-blur-xl transition-colors duration-500 group-hover:bg-black/70"
                      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{ background: "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(124,92,252,0.28), transparent 60%)" }}
                      />
                      <div
                        className="animate-float-slow relative mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/10"
                        style={{ background: "linear-gradient(135deg, rgba(57,101,229,0.18), rgba(219,69,215,0.18))", animationDuration: "10s" }}
                      >
                        <Icon className="h-5 w-5 text-white/90" strokeWidth={1.5} />
                      </div>
                      <h3 className="relative mb-1.5 text-base font-medium text-white/95">{card.title}</h3>
                      <p className="relative text-sm leading-relaxed font-light text-white/55">{card.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom quote */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
        variants={fadeUp}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-10 mx-auto mt-28 max-w-3xl px-8 text-center md:mt-36"
      >
        <p className="font-playfair text-balance text-2xl leading-[1.5] font-light text-white/90 italic md:text-3xl lg:text-4xl">
          &ldquo;A companion that remembers your journey, understands your story, and helps shape
          your future.&rdquo;
        </p>
        <p className="mt-6 text-xs tracking-[0.4em] text-[color:var(--accent-warm)]/80 uppercase">
          — Noorva
        </p>
      </motion.div>

      <style>{`
        @keyframes about-particle-twinkle {
          0%, 100% { opacity: 0.15; transform: translateY(0) scale(0.85); }
          50%      { opacity: 0.65; transform: translateY(-10px) scale(1.1); }
        }
        .about-particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(124,92,252,0.5) 50%, transparent 75%);
          animation-name: about-particle-twinkle;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes about-ray-drift {
          0%, 100% { transform: translate(-6%, -4%) rotate(18deg); opacity: 0.5; }
          50%      { transform: translate(6%, 4%) rotate(18deg); opacity: 0.9; }
        }
        .about-ray {
          position: absolute;
          top: -20%;
          left: 20%;
          width: 3px;
          height: 140%;
          background: linear-gradient(180deg, transparent 0%, rgba(124,92,252,0.5) 45%, rgba(79,168,213,0.4) 55%, transparent 100%);
          filter: blur(6px);
          animation: about-ray-drift 22s ease-in-out infinite;
        }
        .about-ray-b {
          left: 70%;
          animation-duration: 26s;
          animation-delay: -8s;
        }
        .about-card-border {
          animation: magnetic-border-spin 8s linear infinite;
        }
      `}</style>
    </section>
  );
}
