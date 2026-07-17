import { FEATURES } from "../FeatureShowcase/featuresData";

// How much extra scroll, beyond the last feature's own home position, is
// spent purely on the Companion figure dissolving into stars and the
// camera pulling back before the pin releases — see presence()'s doc
// comment below for why this needs no special-casing of its own.
export const FINALE_TAIL = 0.5;

// The scrubbed proxy value's full range: one whole number per feature
// (0..FEATURES.length-1) plus the finale tail.
export const PROXY_MAX = FEATURES.length - 1 + FINALE_TAIL;

// How much of each scene's half-unit "away" radius is spent actively
// fading (vs. holding fully solid in the middle). 0.35 means the outer
// 35% of that radius is a smooth dissolve and the inner 65% is solid.
const DISSOLVE_WINDOW = 0.35;

// Each scene's "home" scroll position is simply its own feature index —
// the same integer phoneCarouselX/desertFlightProgress already lands on
// when that feature is fully in view (matching PhoneShowcase3D.tsx's own
// blend-at-0.5 swap convention, so phone-screen, caption, and construct
// changes all read as one synced system rather than three independently
// timed ones).
//
// presence(i, p) is a smooth trapezoid: 1 while p is within
// DISSOLVE_WINDOW's inner hold-radius of i, smoothly falling to 0 by the
// time p is 0.5 away from i (the same halfway point PhoneShowcase3D.tsx's
// blend logic already treats as the transition boundary). Two adjacent
// scenes (i and i+1) are both ~0 right around their shared p = i + 0.5
// boundary — read as "the previous construct has finished dissolving
// before the next one rises," matching the brief's sequential (not
// cross-faded) scene-to-scene description.
//
// For the LAST feature (i = FEATURES.length - 1), this same falloff on
// the "away" side doubles as the finale dissolve: there's no i+1 scene to
// hand off to, so presence(last, p) simply keeps falling from 1 (at
// p = last) to 0 (at p = last + 0.5 = PROXY_MAX) — exactly the "dissolve
// into stars, then the pin releases" finale, with no special-casing.
const PRESENCE_RADIUS = 0.5;
const HOLD_RADIUS = PRESENCE_RADIUS * (1 - DISSOLVE_WINDOW);

export function presence(i: number, p: number): number {
  const d = Math.abs(p - i);
  if (d >= PRESENCE_RADIUS) return 0;
  if (d <= HOLD_RADIUS) return 1;
  const t = (d - HOLD_RADIUS) / (PRESENCE_RADIUS - HOLD_RADIUS);
  return 1 - t * t * (3 - 2 * t); // smoothstep, inverted (1 -> 0)
}

// Which feature's caption/phone-screen should be showing right now — same
// clamp-and-blend-at-0.5 logic as PhoneShowcase3D.tsx's own displayIndex,
// centralized here so DesertShowcase3D.tsx doesn't have to re-derive it.
export function getDisplayIndex(p: number): number {
  const clamped = Math.max(0, Math.min(FEATURES.length - 1, p));
  const idxA = Math.max(0, Math.min(FEATURES.length - 1, Math.floor(clamped)));
  const idxB = Math.min(FEATURES.length - 1, idxA + 1);
  const blend = clamped - idxA;
  return blend >= 0.5 ? idxB : idxA;
}
