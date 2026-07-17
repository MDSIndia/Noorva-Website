// Deterministic PRNG for particle placement — matches the pattern
// CosmicCanvas.tsx already defines locally rather than sharing one copy;
// following that existing precedent rather than centralizing it. Never
// Math.random() during render: this repo's react-hooks/purity ESLint rule
// forbids it, since it breaks SSR/client hydration parity.
export function prng(n: number) {
  let s = (n * 1664525 + 1013904223) | 0;
  s = Math.imul(s, s ^ (s >> 16));
  return (s >>> 0) / 0xffffffff;
}
