"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Below this width, the portrait mobile clip is used instead of the
// landscape desktop one — matches Tailwind's default `md` breakpoint,
// the same boundary the rest of this codebase's responsive hooks use.
const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

// Full-bleed looping background video for the hero section — no player
// chrome (autoplay/loop/muted, no controls), filling the whole section
// behind the text/buttons rather than sitting in a small side panel. A
// dark radial tint sits on top of the footage (not a mask on the video
// itself — nothing here needs to fade into an edge anymore since the
// video already fills the entire section, no boundary to hide) purely
// so the white hero text and buttons stay readable over whatever's
// playing underneath.
//
// Two source clips: a landscape one (desktop) and a portrait one
// (mobile, public/hero-portal-video-mobile.mp4) — the desktop clip's
// wide 16:9 framing crops awkwardly tight under `object-cover` in a
// narrow phone viewport, where the portrait clip already frames the
// same subject correctly. Only one <video> is ever mounted (picked via
// a matchMedia hook, not a CSS-hidden pair) so a phone never also
// downloads the desktop clip it isn't showing.
export default function HeroLogoPortal() {
  const isMobile = useIsMobile();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.06, filter: "blur(16px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      >
        <video
          key={isMobile ? "mobile" : "desktop"}
          src={isMobile ? "/hero-portal-video-mobile.mp4" : "/hero-portal-video.mp4"}
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
