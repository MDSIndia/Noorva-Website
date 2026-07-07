// Shared singleton — CosmicCanvas reads scroll progress directly without cyclic dependency.
export const scrollProgress = { value: 0 };

// Shared singleton — set by SmoothScroll once Lenis initializes, read by Header's
// nav links so anchor navigation goes through Lenis instead of a native jump.
export const lenisRef: { current: import("lenis").default | null } = { current: null };

// Shared singleton — describes the spiral gallery's current roll: a crossfade
// from chapter `fromIndex` to `toIndex`, at `progress` 0 (flat on fromIndex)
// to 1 (flat on toIndex). Set by StoryGallerySection's discrete per-gesture
// flip animation (GSAP-tweened, not scroll-scrubbed — flips can go either
// direction), read every frame by SpiralGallery's shader without triggering
// React renders.
export const galleryTransition = { fromIndex: 0, toIndex: 0, progress: 0 };

// Shared singleton — lets nav links force-release the gallery's scroll
// capture, and briefly suppress it from re-engaging. Without `release`,
// clicking Home/Story/Join/any CTA while the gallery has scroll locked for
// its own per-gesture flip does nothing, since Lenis stays stopped until the
// gallery's own boundary-release logic runs. Without `suppressedUntil`, a
// long nav jump that passes *through* the gallery on its way elsewhere
// (e.g. Home -> Join) gets re-captured mid-transit, since the gallery
// auto-locks whenever it fills the viewport. Nav links set `suppressedUntil`
// only when their destination isn't the gallery itself, so arriving at
// "Story" still captures immediately as expected.
// StoryGallerySection registers `release` here on mount.
export const galleryCaptureControl: { release: ((suppressMs?: number) => void) | null; suppressedUntil: number } = {
  release: null,
  suppressedUntil: 0,
};
