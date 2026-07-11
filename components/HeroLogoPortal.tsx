"use client";

import Image from "next/image";
import { motion } from "framer-motion";

// Small orbiting sparks riding the outer ring — fixed angle offsets around
// the circle (not random placement) so they read as evenly spaced
// "particles" instead of a scatter. Positioned as left/top percentages of
// the ring's own box (not a fixed pixel radius) so they land exactly on the
// ring's edge at every breakpoint instead of drifting off it as the
// responsive container resizes.
const RING_SPARKS = [
  { angle: 20, size: 5, color: "#c084fc" },
  { angle: 140, size: 4, color: "#7dd3fc" },
  { angle: 255, size: 4.5, color: "#f0abfc" },
].map((spark) => {
  const rad = (spark.angle * Math.PI) / 180;
  return {
    ...spark,
    left: 50 + 50 * Math.cos(rad),
    top: 50 + 50 * Math.sin(rad),
  };
});

// Concentric reflection rings beneath the portal — each one a flattened
// ellipse, shrinking and fading toward the center to read as a glowing
// pool the light beam lands in, matching the reference's rippled-floor look.
const POOL_RINGS = [1, 0.78, 0.56, 0.36, 0.18];

export default function HeroLogoPortal() {
  return (
    <div className="pointer-events-none flex flex-col items-center">
      {/* Portal + logo */}
      <div className="relative h-[220px] w-[220px] sm:h-[280px] sm:w-[280px] lg:h-[340px] lg:w-[340px]">
        {/* Soft breathing glow behind everything */}
        <motion.div
          className="absolute inset-[-20%] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(124,92,252,0.45), transparent 68%)" }}
          animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.12, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Outer dashed ring — slow clockwise drift */}
        <motion.div
          className="absolute inset-0 rounded-full border border-dashed"
          style={{ borderColor: "rgba(79,168,213,0.5)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        >
          {RING_SPARKS.map((spark, i) => (
            <span
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${spark.left}%`,
                top: `${spark.top}%`,
                width: spark.size,
                height: spark.size,
                background: spark.color,
                boxShadow: `0 0 8px 2px ${spark.color}`,
              }}
            />
          ))}
        </motion.div>

        {/* Mid ring — faster counter-rotation, solid, brighter */}
        <motion.div
          className="absolute inset-[13%] rounded-full border"
          style={{ borderColor: "rgba(124,92,252,0.55)" }}
          animate={{ rotate: -360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        >
          <span
            className="absolute top-0 left-1/2 h-[6%] w-[6%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "#c084fc", boxShadow: "0 0 10px 3px rgba(192,132,252,0.85)" }}
          />
        </motion.div>

        {/* Inner dashed ring — fastest, tightest */}
        <motion.div
          className="absolute inset-[26%] rounded-full border border-dashed"
          style={{ borderColor: "rgba(219,69,215,0.5)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        />

        {/* Logo, centered, gently floating */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div
              className="absolute inset-[-35%] -z-10 rounded-full blur-2xl"
              style={{ background: "radial-gradient(circle, rgba(192,132,252,0.55), transparent 70%)" }}
            />
            <Image
              src="/NoorvaLogo.png"
              alt="Noorva"
              width={340}
              height={308}
              priority
              className="h-auto w-[84px] drop-shadow-[0_0_30px_rgba(124,92,252,0.65)] sm:w-[108px] lg:w-[130px]"
            />
          </motion.div>
        </div>
      </div>

      {/* Light beam connecting the logo down to the reflection pool */}
      <div
        className="h-14 w-px sm:h-16 lg:h-20"
        style={{ background: "linear-gradient(to bottom, rgba(192,132,252,0.65), rgba(124,92,252,0.05))" }}
      />

      {/* Reflection pool — concentric rippled rings with a bright core */}
      <div className="relative h-[54px] w-[240px] sm:h-[64px] sm:w-[300px] lg:h-[76px] lg:w-[360px]">
        {POOL_RINGS.map((scale, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 rounded-[50%] border"
            style={{
              width: `${scale * 100}%`,
              height: `${scale * 100}%`,
              borderColor: `rgba(124,92,252,${0.5 - i * 0.08})`,
              x: "-50%",
              y: "-50%",
            }}
            animate={{ opacity: [0.4, 0.85, 0.4] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
          />
        ))}
        <div
          className="absolute top-1/2 left-1/2 h-[22%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-md"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.9), rgba(192,132,252,0.4) 60%, transparent 80%)" }}
        />
      </div>
    </div>
  );
}
