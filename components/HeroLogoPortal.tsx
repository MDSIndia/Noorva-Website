"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// The portal was previously a from-scratch Three.js reconstruction of the
// reference art (rings + sparkle flares + baked textures), rebuilt across
// several rounds trying to match it — but a procedural approximation kept
// falling short of the actual reference photo. Using the real photo
// (public/hero-portal.png, already includes the swirl halo, logo, and
// reflection pool baked in as one flattened image) guarantees pixel-exact
// fidelity.
//
// A single flat photo has no internal motion on its own, so it's split into
// TWO stacked copies of the SAME image:
//   1. Static base — full image, motionless, grounds the reflection pool.
//      The pool must stay put: it isn't centered on the round's pivot, so
//      spinning it would swing it through an arc instead of leaving it
//      sitting flat on the ground (tried rotating everything including the
//      pool — confirmed unwanted, reverted).
//   2. Rotating disc — the whole ball, wisps, AND logo together, masked to
//      a plain disc (no inner hole) so it spins as one piece. Rotation
//      (unlike scale) never changes a circle's extent, so this mask
//      boundary stays put at every angle — no gaps, no ghosting, no
//      separate transparent source assets needed.
// Center/radius were found by testing composited alignment guides in Node
// against the actual pixels (see conversation).
const IMAGE_WIDTH = 296;
const IMAGE_HEIGHT = 277;
const CENTER_X = (150 / IMAGE_WIDTH) * 100;
const CENTER_Y = (108 / IMAGE_HEIGHT) * 100;
const LOGO_RADIUS = (63 / IMAGE_WIDTH) * 100;
// At radius 110 (the old value) the rotating layer already reached into
// where the reflection pool's glow bleeds into the ball in the source
// photo — confirmed with a pixel-level Node/sharp probe (brightness
// samples straight down from center were already ~250/255 by r=70px).
// Rotating that shared photo drags the pool's own bright pixels around
// through the full circle, so at 90/180/270° the pool visibly reappeared
// as a stray glowing blob at the side instead of staying grounded — the
// real reason the rotation kept reading as "a thin ring", not the fault
// of the radius choice itself. Fixed by rotating a SEPARATE source image
// (hero-portal-ball.png) with the pool region pre-erased (see the erase
// step in conversation), which lets this radius go much wider — now
// covering nearly the whole ball's visible wisps — without ever
// reintroducing pool pixels at other angles.
const ROUND_RADIUS = (140 / IMAGE_WIDTH) * 100;
const FEATHER = 1.3; // % — soft cross-fade width between mask boundaries

// Plain disc, no inner logo hole — logo now rotates together with the
// ball as a single piece.
const RING_MASK = `radial-gradient(circle at ${CENTER_X}% ${CENTER_Y}%, black ${ROUND_RADIUS}%, transparent ${ROUND_RADIUS + FEATHER}%)`;
// The source photo's corners are dark navy, not pure black, so laid
// directly on the page's #000 background it reads as a faint visible
// rectangle. Fading the outer margin to transparent (not a crop — content
// stays intact) removes that box outline. This layer also has to stay
// fully opaque under the whole rotating disc now (not just outside it,
// like before) — it's what shows the real, static pool through the hole
// left by the rotating layer's erased pool region.
const BASE_MASK = `radial-gradient(circle at ${CENTER_X}% ${CENTER_Y}%, black 55%, transparent 66%)`;

// Light rays escaping the ring's edge, rotating together with it. A
// repeating-conic-gradient makes the wedge pattern; the radial mask keeps
// it invisible under the ring itself (RING_MASK already covers that area
// opaquely) and only lets it show as a fading band starting right at the
// ring's outer edge — so it reads as light being flung outward by the
// spin, not a static sunburst sitting behind the whole graphic.
//
// This layer needs to fade out well past ROUND_RADIUS, but the portal's
// own box is barely bigger than the ball (CENTER_Y sits close to the top
// edge — only ~38% of box height above it), so a mask sized to the box
// itself (inset-0, like every other layer) hits the box's rectangular
// edge and hard-clips the ray tips before they finish fading — confirmed
// visually (a flat cut line appeared exactly at the box edge). Fixed by
// giving this one layer its own oversized (2x), independently-centered
// box via explicit inset math instead of inset-0, so CENTER_X/Y sits at
// its exact geometric middle with equal room in every direction. Every
// percentage below is expressed in THIS box's own coordinate space (2x
// the portal's), which is why the same radii are all halved.
const RAYS_SCALE = 2;
const RAYS_ROUND_RADIUS = ROUND_RADIUS / RAYS_SCALE;
const RAY_COUNT = 12;
const RAY_STEP_DEG = 360 / RAY_COUNT;
const RAYS_BG = `repeating-conic-gradient(from 0deg at 50% 50%, rgba(196,168,255,0) 0deg, rgba(196,168,255,0.55) ${RAY_STEP_DEG * 0.1}deg, rgba(140,180,255,0) ${RAY_STEP_DEG * 0.32}deg, rgba(140,180,255,0) ${RAY_STEP_DEG}deg)`;
const RAYS_MASK = `radial-gradient(circle at 50% 50%, transparent ${RAYS_ROUND_RADIUS - 3}%, black ${RAYS_ROUND_RADIUS + 1.5}%, black ${RAYS_ROUND_RADIUS + 7}%, transparent ${RAYS_ROUND_RADIUS + 19}%)`;

// A handful of twinkling points woven through the ring — fixed angle/radius/
// timing (not Math.random(), which this repo's react-hooks/purity lint rule
// forbids during render) so they're deterministic across renders but still
// scattered at irregular-looking positions and offsets.
interface SparkleSpec {
  angleDeg: number;
  radiusFactor: number; // fraction of ROUND_RADIUS
  size: number; // px at the lg breakpoint's ~420px box
  delay: number;
  duration: number;
}
// Placed with real trigonometry (not just equal width/height offsets) since
// the source image isn't square (296x277) — converting the sine term by the
// width/height ratio keeps points on an actual circle around the ring
// instead of a slightly squashed ellipse.
// Rounded to 4 decimal places — the build's server-side constant folding
// produces a shorter-precision literal for this same Math.cos/sin
// expression than the client's runtime evaluation does, so the raw
// (unrounded) values differed between SSR and hydration by trailing
// digits, throwing a hydration-mismatch error. Rounding both sides to the
// same fixed precision makes the SSR and client strings byte-identical
// regardless of how each one got there.
function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}
function toPositions(specs: SparkleSpec[]) {
  return specs.map((s) => {
    const rad = (s.angleDeg * Math.PI) / 180;
    const radiusPct = ROUND_RADIUS * s.radiusFactor;
    return {
      ...s,
      left: round4(CENTER_X + Math.cos(rad) * radiusPct),
      top: round4(CENTER_Y + Math.sin(rad) * radiusPct * (IMAGE_WIDTH / IMAGE_HEIGHT)),
    };
  });
}

// Galaxy texture inside the ring band — rotates together with the ball
// (rendered inside the same rotating layer as the ring image) so the stars
// sweep around with the spin instead of just sitting on top of it.
const RING_STARS: SparkleSpec[] = [
  { angleDeg: 18, radiusFactor: 0.6, size: 4, delay: 0, duration: 2.6 },
  { angleDeg: 64, radiusFactor: 0.97, size: 3, delay: 0.6, duration: 3.1 },
  { angleDeg: 112, radiusFactor: 0.74, size: 5, delay: 1.2, duration: 2.3 },
  { angleDeg: 158, radiusFactor: 1.02, size: 3, delay: 0.3, duration: 2.9 },
  { angleDeg: 206, radiusFactor: 0.66, size: 4, delay: 1.7, duration: 2.7 },
  { angleDeg: 252, radiusFactor: 0.92, size: 3, delay: 0.9, duration: 3.3 },
  { angleDeg: 298, radiusFactor: 0.58, size: 5, delay: 2.1, duration: 2.4 },
  { angleDeg: 336, radiusFactor: 0.88, size: 3, delay: 1.4, duration: 3.0 },
  { angleDeg: 10, radiusFactor: 0.22, size: 2, delay: 0.4, duration: 2.2 },
  { angleDeg: 55, radiusFactor: 0.42, size: 3, delay: 1.1, duration: 2.8 },
  { angleDeg: 95, radiusFactor: 0.3, size: 2, delay: 0.2, duration: 2.4 },
  { angleDeg: 140, radiusFactor: 0.48, size: 3, delay: 1.6, duration: 3.1 },
  { angleDeg: 190, radiusFactor: 0.25, size: 2, delay: 0.8, duration: 2.5 },
  { angleDeg: 230, radiusFactor: 0.45, size: 3, delay: 0.1, duration: 2.9 },
  { angleDeg: 275, radiusFactor: 0.35, size: 2, delay: 1.9, duration: 2.3 },
  { angleDeg: 320, radiusFactor: 0.5, size: 3, delay: 0.6, duration: 3.2 },
];
const RING_STAR_POSITIONS = toPositions(RING_STARS);

// Wider ambient starfield around the portal itself (distinct from the
// page-level star background) — stays put (no rotation) since it's meant
// to read as open space around the portal, not part of the spinning ball.
const OUTER_STARS: SparkleSpec[] = [
  { angleDeg: 8, radiusFactor: 1.15, size: 2, delay: 0.3, duration: 3.4 },
  { angleDeg: 34, radiusFactor: 1.4, size: 3, delay: 1.2, duration: 4.1 },
  { angleDeg: 62, radiusFactor: 1.1, size: 2, delay: 2.0, duration: 3.7 },
  { angleDeg: 118, radiusFactor: 1.25, size: 2, delay: 1.6, duration: 3.2 },
  { angleDeg: 146, radiusFactor: 1.45, size: 3, delay: 0.1, duration: 4.4 },
  { angleDeg: 172, radiusFactor: 1.12, size: 2, delay: 2.3, duration: 3.6 },
  { angleDeg: 228, radiusFactor: 1.2, size: 2, delay: 1.4, duration: 3.9 },
  { angleDeg: 254, radiusFactor: 1.5, size: 3, delay: 0.5, duration: 4.4 },
  { angleDeg: 280, radiusFactor: 1.15, size: 2, delay: 1.9, duration: 3.3 },
  { angleDeg: 306, radiusFactor: 1.42, size: 3, delay: 0.2, duration: 4.2 },
  { angleDeg: 332, radiusFactor: 1.28, size: 2, delay: 1.1, duration: 3.8 },
  { angleDeg: 350, radiusFactor: 1.48, size: 3, delay: 0.6, duration: 4.0 },
];
const OUTER_STAR_POSITIONS = toPositions(OUTER_STARS);

export default function HeroLogoPortal() {
  const containerRef = useRef<HTMLDivElement>(null);
  // Cursor parallax — subtle 3D tilt that follows the pointer anywhere on
  // the page (not just over the portal, which is pointer-events-none so it
  // never blocks clicks on the hero text/buttons behind/beside it). Springs
  // smooth the raw pointer delta into an easing follow instead of a snap.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 55, damping: 16, mass: 0.6 });
  const springY = useSpring(rawY, { stiffness: 55, damping: 16, mass: 0.6 });
  const rotateX = useTransform(springY, [-1, 1], [5, -5]);
  const rotateY = useTransform(springX, [-1, 1], [-5, 5]);

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      rawX.set(Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1)));
      rawY.set(Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1)));
    }
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [rawX, rawY]);

  return (
    <div className="pointer-events-none flex flex-col items-center">
      <div ref={containerRef} style={{ perspective: 900 }}>
        <motion.div
          className="relative w-[280px] sm:w-[340px] lg:w-[420px]"
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Ambient glow breathing behind the image — kept small/tight and
              radial so it reads as light bleeding off the ring, not a soft
              rectangular halo sitting on the page's flat black background.
              Earlier versions stacked this with two expanding "light
              release" rings and a much bigger logo halo — all fighting for
              the same dark space around the logo made it read as a muddy
              smudge rather than clean light, so it's pared back to just
              this one soft wash plus a small, tight glow on the logo. */}
          <motion.div
            className="absolute h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{
              top: `${CENTER_Y}%`,
              left: `${CENTER_X}%`,
              background: "radial-gradient(circle, rgba(124,92,252,0.22), transparent 72%)",
            }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Logo glow — small and tight, sitting close behind the logo
              disc so it reads as a rim-light, not a wash bleeding into the
              dark gap between the icon and the ring (which is part of the
              source photo, not something to cover up). */}
          <motion.div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-lg"
            style={{
              top: `${CENTER_Y}%`,
              left: `${CENTER_X}%`,
              width: `${LOGO_RADIUS * 1.35}%`,
              height: `${LOGO_RADIUS * 1.35}%`,
              background: "radial-gradient(circle, rgba(192,132,252,0.5), rgba(124,92,252,0.2) 60%, transparent 80%)",
            }}
            animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.96, 1.06, 0.96] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Static base — grounds the reflection pool. Next's Image
              component never resolved (currentSrc/naturalWidth stayed empty
              indefinitely) once the container passed ~1024px width,
              confirmed with a Playwright probe; a plain img loads reliably
              at every breakpoint and the source is already a small baked
              composite that doesn't need Next's resize pipeline. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-portal.png"
            alt=""
            aria-hidden
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
            className="h-auto w-full"
            style={{ maskImage: BASE_MASK, WebkitMaskImage: BASE_MASK }}
          />

          {/* Light rays — sits behind the ring layer (painted first here, so
              the opaque ring covers its own interior) and rotates on the
              exact same duration/easing so the rays stay locked to the
              ring's spin instead of drifting out of phase with it.
              mix-blend-mode: screen adds light additively over the black
              backdrop instead of a flat-colored wedge sitting on top. */}
          <motion.div
            className="absolute"
            style={{
              top: `${CENTER_Y - 50 * RAYS_SCALE}%`,
              left: `${CENTER_X - 50 * RAYS_SCALE}%`,
              width: `${100 * RAYS_SCALE}%`,
              height: `${100 * RAYS_SCALE}%`,
              background: RAYS_BG,
              maskImage: RAYS_MASK,
              WebkitMaskImage: RAYS_MASK,
              mixBlendMode: "screen",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />

          {/* Whole ball — ring, outer wisps, AND logo — rotates together as
              one piece. Uses hero-portal-ball.png — the same photo with the
              reflection pool's region pre-erased — instead of the plain
              hero-portal.png, so rotating a wide radius never drags pool
              pixels around to other angles (see ROUND_RADIUS comment
              above). The static base layer beneath shows the real pool
              through the erased hole. */}
          <motion.img
            src="/hero-portal-ball.png"
            alt="Noorva"
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
            className="absolute inset-0 h-auto w-full"
            style={{
              maskImage: RING_MASK,
              WebkitMaskImage: RING_MASK,
              transformOrigin: `${CENTER_X}% ${CENTER_Y}%`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />

          {/* Galaxy star texture woven through the ring — same rotation as
              the ring image above (separate element, identical transition,
              so it stays visually locked to the spin) rather than being a
              child of the img, since the img's own mask/rotate is already
              handling the photo and dots need their own independent
              opacity/scale twinkle animation nested inside the spin. */}
          <motion.div
            className="absolute inset-0"
            style={{ transformOrigin: `${CENTER_X}% ${CENTER_Y}%` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            {RING_STAR_POSITIONS.map((s, i) => (
              <motion.div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                style={{
                  top: `${s.top}%`,
                  left: `${s.left}%`,
                  width: s.size,
                  height: s.size,
                  boxShadow: "0 0 4px 1px rgba(216,180,254,0.7), 0 0 8px 2px rgba(139,124,246,0.35)",
                }}
                animate={{ opacity: [0, 0.85, 0], scale: [0.4, 1.2, 0.4] }}
                transition={{ duration: s.duration, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
              />
            ))}
          </motion.div>

          {/* Ambient starfield around the portal — does not rotate, reads
              as open space rather than part of the spinning ball. */}
          {OUTER_STAR_POSITIONS.map((s, i) => (
            <motion.div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
              style={{
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: s.size,
                height: s.size,
                boxShadow: "0 0 3px 1px rgba(216,180,254,0.6), 0 0 6px 1px rgba(139,124,246,0.3)",
              }}
              animate={{ opacity: [0, 0.75, 0], scale: [0.4, 1.1, 0.4] }}
              transition={{ duration: s.duration, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
