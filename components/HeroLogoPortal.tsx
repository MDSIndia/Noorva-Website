"use client";

import Image from "next/image";
import { motion } from "framer-motion";

// Deterministic seeded PRNG (not Math.random) — this repo's react-hooks/purity
// lint rule forbids impure calls during render, even inside module-scope
// array builders. Same hash function already used in CosmicCanvas.tsx.
function prng(n: number) {
  let s = (n * 1664525 + 1013904223) | 0;
  s = Math.imul(s, s ^ (s >> 16));
  return (s >>> 0) / 0xffffffff;
}

// React's server-side style serializer and the client's runtime style
// assignment don't agree on how many decimal digits a raw trig-derived float
// keeps (server: "88.3469%", client: "88.3469276007173%") — a real
// hydration mismatch, not a Framer Motion quirk (plain <span> elements hit
// it too). Rounding every generated value to 2 decimals here means both
// sides already start from the same short number, so there's no further
// precision left for either renderer to disagree about.
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

const SPARK_COLORS = ["#c084fc", "#7dd3fc", "#f0abfc", "#5eead4"];

// Scattered twinkling particles around the portal — a dense field (not just
// a few dots on a ring) is what makes the reference read as a living energy
// vortex rather than a simple spinning circle. Positions/sizes/timing are
// all seeded so the field is fixed rather than reshuffling on every render.
const STAR_COUNT = 34;
const STARS = Array.from({ length: STAR_COUNT }, (_, i) => {
  const angle = prng(i * 2 + 1) * Math.PI * 2;
  const radius = 14 + prng(i * 2 + 2) * 90; // % from center, inside + beyond the rings
  return {
    left: round2(50 + radius * Math.cos(angle)),
    top: round2(50 + radius * Math.sin(angle)),
    size: round2(1.2 + prng(i * 3 + 7) * 3.4),
    delay: round2(prng(i * 5 + 13) * 3.2),
    duration: round2(1.6 + prng(i * 7 + 19) * 2.2),
    color: SPARK_COLORS[Math.floor(prng(i * 11 + 23) * SPARK_COLORS.length)],
  };
});

// A handful of larger, softly blurred bokeh circles mixed in with the sharp
// star points — real photographic light-painting shots (the reference) have
// out-of-focus highlights of very different sizes, not a uniform field of
// identical pinpoints, so this variety is what sells the "photographed
// light" quality rather than a flat, uniform particle system.
const BOKEH_COUNT = 9;
const BOKEH = Array.from({ length: BOKEH_COUNT }, (_, i) => {
  const angle = prng(i * 13 + 101) * Math.PI * 2;
  const radius = 20 + prng(i * 13 + 102) * 80;
  return {
    left: round2(50 + radius * Math.cos(angle)),
    top: round2(50 + radius * Math.sin(angle)),
    size: round2(8 + prng(i * 13 + 103) * 22),
    delay: round2(prng(i * 13 + 104) * 4),
    duration: round2(2.6 + prng(i * 13 + 105) * 2.8),
    color: SPARK_COLORS[Math.floor(prng(i * 13 + 106) * SPARK_COLORS.length)],
  };
});

// Swirling elliptical trails at mismatched angles/eccentricities/speeds —
// several overlapping ones (rather than one clean circle) is what reads as
// a chaotic energy field crossing itself, matching the reference's tangled
// arc-line look instead of a simple orbit ring. Widths vary per-arc (not a
// uniform 1.5px) and colors span the full blue-to-cyan-to-magenta range the
// reference uses instead of just blue/purple.
const SWIRL_ARCS = [
  { rotate: 8, rx: 100, ry: 58, duration: 26, dir: 1, color: "rgba(79,168,213,0.5)", width: 1.5 },
  { rotate: -34, rx: 92, ry: 68, duration: 19, dir: -1, color: "rgba(124,92,252,0.55)", width: 2 },
  { rotate: 62, rx: 98, ry: 52, duration: 33, dir: 1, color: "rgba(219,69,215,0.45)", width: 1.25 },
  { rotate: -68, rx: 94, ry: 64, duration: 23, dir: -1, color: "rgba(192,132,252,0.5)", width: 1.75 },
  { rotate: 24, rx: 76, ry: 76, duration: 15, dir: -1, color: "rgba(124,92,252,0.4)", width: 1 },
  { rotate: -12, rx: 108, ry: 44, duration: 29, dir: 1, color: "rgba(94,234,212,0.4)", width: 1.25 },
  { rotate: 48, rx: 64, ry: 90, duration: 21, dir: -1, color: "rgba(240,171,252,0.4)", width: 1.5 },
  { rotate: -52, rx: 88, ry: 82, duration: 17, dir: 1, color: "rgba(79,168,213,0.35)", width: 1 },
];

// Concentric reflection rings beneath the portal — each one a flattened
// ellipse, shrinking and fading toward the center to read as a glowing
// pool the light beam lands in, matching the reference's rippled-floor look.
const POOL_RINGS = [1, 0.84, 0.68, 0.52, 0.38, 0.24, 0.12];

export default function HeroLogoPortal() {
  return (
    <div className="pointer-events-none flex flex-col items-center">
      {/* Portal + logo */}
      <div className="relative h-[240px] w-[240px] sm:h-[310px] sm:w-[310px] lg:h-[380px] lg:w-[380px]">
        {/* Soft breathing glow behind everything */}
        <motion.div
          className="absolute inset-[-25%] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(124,92,252,0.5), transparent 68%)" }}
          animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.14, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Scattered twinkling star field. Positioning lives on a plain
            (non-motion) span, separate from the animated inner motion.span
            — round2() on every STARS field is the actual fix for the
            hydration mismatch this had (a real React SSR-vs-client
            precision disagreement on raw trig-derived floats, not a Framer
            Motion quirk); this split just keeps the deterministic layout
            values away from anything animation-related for clarity. */}
        {STARS.map((star, i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${star.left}%`, top: `${star.top}%`, width: star.size, height: star.size }}
          >
            <motion.span
              className="block h-full w-full rounded-full"
              style={{
                background: star.color,
                boxShadow: `0 0 ${round2(star.size * 2.5)}px ${round2(star.size * 0.7)}px ${star.color}`,
              }}
              animate={{ opacity: [0.15, 1, 0.15], scale: [0.7, 1.3, 0.7] }}
              transition={{ duration: star.duration, repeat: Infinity, ease: "easeInOut", delay: star.delay }}
            />
          </span>
        ))}

        {/* Swirling energy trails — overlapping ellipses at mismatched
            angles/speeds, blended additively so their crossings glow
            brighter, reading as a tangled vortex rather than a clean ring. */}
        {SWIRL_ARCS.map((arc, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 rounded-[50%] border"
            style={{
              width: `${arc.rx}%`,
              height: `${arc.ry}%`,
              borderColor: arc.color,
              borderWidth: arc.width,
              x: "-50%",
              y: "-50%",
              rotate: arc.rotate,
              mixBlendMode: "screen",
              filter: "blur(0.6px)",
            }}
            animate={{ rotate: arc.rotate + arc.dir * 360 }}
            transition={{ duration: arc.duration, repeat: Infinity, ease: "linear" }}
          />
        ))}

        {/* Soft out-of-focus bokeh highlights, mixed with the sharp star
            field above — varied sizes read as photographed light rather
            than a uniform particle system. Static fields (left/top/size)
            are already round2()'d, same fix as STARS above, so this one
            doesn't need the plain-span/motion-span split — only raw
            unrounded floats caused the hydration mismatch, not the
            animate-driven opacity itself. */}
        {BOKEH.map((b, i) => (
          <motion.span
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-md"
            style={{
              left: `${b.left}%`,
              top: `${b.top}%`,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle, ${b.color}, transparent 70%)`,
              mixBlendMode: "screen",
            }}
            animate={{ opacity: [0.15, 0.55, 0.15] }}
            transition={{ duration: b.duration, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
          />
        ))}

        {/* Logo, centered, gently floating */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            {/* Bright white-hot core, sitting behind the color bloom — the
                "lens flare hotspot" the reference has right at the logo,
                not just a flat colored glow. */}
            <div
              className="absolute inset-[-14%] -z-10 rounded-full blur-lg"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.8), transparent 72%)" }}
            />
            <div
              className="absolute inset-[-42%] -z-10 rounded-full blur-2xl"
              style={{ background: "radial-gradient(circle, rgba(192,132,252,0.65), transparent 70%)" }}
            />
            <Image
              src="/NoorvaLogo.png"
              alt="Noorva"
              width={340}
              height={308}
              priority
              className="h-auto w-[84px] drop-shadow-[0_0_34px_rgba(124,92,252,0.75)] sm:w-[110px] lg:w-[136px]"
            />
          </motion.div>
        </div>
      </div>

      {/* Light beam connecting the logo down to the reflection pool — a
          bright core line plus a wider soft glow behind it, rather than a
          single thin flat line. */}
      <div className="relative h-16 sm:h-20 lg:h-24">
        <div
          className="absolute top-0 left-1/2 h-full w-3 -translate-x-1/2 blur-md"
          style={{ background: "linear-gradient(to bottom, rgba(192,132,252,0.55), rgba(124,92,252,0))" }}
        />
        <div
          className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2"
          style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(192,132,252,0.15))" }}
        />
      </div>

      {/* Reflection pool — concentric rippled rings with a bright core and a
          horizontal light streak, plus a faint tail continuing below. */}
      <div className="relative h-[60px] w-[280px] sm:h-[76px] sm:w-[360px] lg:h-[90px] lg:w-[430px]">
        <div
          className="absolute top-1/2 left-1/2 h-[28%] w-full -translate-x-1/2 -translate-y-1/2 blur-lg"
          style={{ background: "linear-gradient(to right, transparent, rgba(124,92,252,0.5), rgba(255,255,255,0.6), rgba(124,92,252,0.5), transparent)" }}
        />
        {POOL_RINGS.map((scale, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 rounded-[50%] border"
            style={{
              width: `${scale * 100}%`,
              height: `${scale * 100}%`,
              borderColor: `rgba(124,92,252,${0.55 - i * 0.06})`,
              x: "-50%",
              y: "-50%",
            }}
            animate={{ opacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
          />
        ))}
        <div
          className="absolute top-1/2 left-1/2 h-[26%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-md"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.95), rgba(192,132,252,0.5) 55%, transparent 80%)" }}
        />
        {/* Faint reflection tail continuing below the pool */}
        <div
          className="absolute top-full left-1/2 h-10 w-px -translate-x-1/2 sm:h-14"
          style={{ background: "linear-gradient(to bottom, rgba(124,92,252,0.35), transparent)" }}
        />
      </div>
    </div>
  );
}
