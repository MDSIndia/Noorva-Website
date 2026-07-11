// Shared singleton — CosmicCanvas reads scroll progress directly without cyclic dependency.
export const scrollProgress = { value: 0 };

// Shared singleton — PhoneShowcase3D's ScrollTrigger writes a continuous
// "which feature, fractionally" position here every scrubbed scroll tick
// (0 at the first feature, 1 at the second, 1.5 halfway into the turn from
// second to third, etc). Each mounted PhoneModel instance reads this inside
// useFrame and compares it against its own fixed feature index to compute
// how far off-center to slide — the whole carousel is driven by this one
// value. Kept out of React state since it updates on every scroll frame and
// would otherwise re-render the whole 3D tree.
export const phoneCarouselX = { value: 0 };

// Shared singleton — set by SmoothScroll once Lenis initializes, read by Header's
// nav links so anchor navigation goes through Lenis instead of a native jump.
export const lenisRef: { current: import("lenis").default | null } = { current: null };

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

// Shared singleton — lets WelcomeOverlay trigger CinematicIntro's star-blast
// reveal directly on the same click that dismisses the overlay, instead of
// requiring a separate second click on the (now-visible) intro section.
// CinematicIntro registers `play` here on mount.
export const introRevealControl: { play: (() => void) | null } = { play: null };

// Reference-counted scroll lock, keyed by owner id. WelcomeOverlay and
// CinematicIntro both need page scroll frozen during their own gated phase,
// and their phases can overlap/outlive each other (e.g. the overlay can
// dismiss on the same interaction that's still mid-way through the intro's
// own gate). A plain `document.body.style.overflow = ""` from either one
// alone would clobber the other's lock — tracking owners in a set means
// scroll only re-enables once *every* owner has released it.
const scrollLockOwners = new Set<string>();

export function acquireScrollLock(owner: string) {
  scrollLockOwners.add(owner);
  document.body.style.overflow = "hidden";
  lenisRef.current?.stop();
}

export function releaseScrollLock(owner: string) {
  scrollLockOwners.delete(owner);
  if (scrollLockOwners.size === 0) {
    document.body.style.overflow = "";
    lenisRef.current?.start();
  }
}
