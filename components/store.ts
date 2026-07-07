// Shared singleton — CosmicCanvas reads scroll progress directly without cyclic dependency.
export const scrollProgress = { value: 0 };

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
