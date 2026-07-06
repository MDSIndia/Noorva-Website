// Shared singleton — CosmicCanvas reads scroll progress directly without cyclic dependency.
export const scrollProgress = { value: 0 };

// Shared singleton — set by each StoryChapter's own pin ScrollTrigger (via onToggle),
// read by Header. Avoids attaching a second ScrollTrigger to an already-pinned element.
export const activeChapter = { value: 0 };

// Shared singleton — set by SmoothScroll once Lenis initializes, read by Header's
// nav links so anchor navigation goes through Lenis instead of a native jump.
export const lenisRef: { current: import("lenis").default | null } = { current: null };

// Shared singleton — continuous 0..8 progress through the spiral gallery
// (integer part = chapter index, fractional part = roll/transition progress
// into the next chapter). Set by StoryGallerySection's single ScrollTrigger,
// read every frame by SpiralGallery's shader without triggering React renders.
export const galleryProgress = { value: 0 };
