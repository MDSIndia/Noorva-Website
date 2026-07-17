"use client";

import { motion } from "framer-motion";

// Full-bleed looping background video for the hero section — no player
// chrome (autoplay/loop/muted, no controls), filling whatever container
// it's placed in. Same clip on every breakpoint — the container this
// mounts into is what changes shape between mobile and desktop (see
// CinematicIntro.tsx), not the video itself. A dark radial tint sits on
// top of the footage (not a mask on the video itself) purely so the
// white hero text stays readable when it's overlaid on top of this on
// desktop.
export default function HeroLogoPortal() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.06, filter: "blur(16px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      >
        <video
          src="/hero-portal-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
          style={{ filter: "contrast(1.08) saturate(1.12) brightness(0.72)" }}
        />
      </motion.div>

      {/* Readability tint over the whole frame (heaviest right at
          center, where the heading/buttons actually sit — the source
          footage has a bright energy ring right through that spot) plus
          the usual heavier edge/corner falloff. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0.9) 100%)",
        }}
      />
    </div>
  );
}
