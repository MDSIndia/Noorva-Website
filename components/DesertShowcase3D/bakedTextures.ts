import { useMemo } from "react";
import * as THREE from "three";

// Extracted out of the old PhoneShowcase3D/Podium.tsx (now deleted — its
// glow/beam/ring techniques live on here) so every construct that wants a
// soft additive glow disc, a tapered light beam, or a neon ring's halo can
// share one audited implementation instead of re-baking near-copies.
// Baked in neutral white in every case — callers tint via the mesh
// material's own `color`, not by rebaking the texture, so one texture
// instance works for every feature's accent color.

// Radial-gradient glow disc — a flat solid color with a hard circular edge
// forshortens into a stark bar when viewed at a shallow angle (e.g. a
// ground-flush glow seen from a low flythrough camera); feathering the
// alpha to zero at the rim keeps it reading as a soft glow at any angle.
export function useGlowTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.5)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

// Tapered light-column alpha map — bright/narrow near v=0, dimmer/wider
// near v=1, feathered on every side (not just top/bottom, unlike a plain
// linear gradient) so a plane using it as its alpha map reads as a soft
// volumetric beam instead of a hard-edged cutout card at any viewing
// angle. Computed pixel-by-pixel since the taper width itself changes per
// row — not expressible as a single 1D CSS-style gradient.
export function useBeamTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const width = 64;
    const height = 192;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const image = ctx.createImageData(width, height);
    const data = image.data;
    for (let j = 0; j < height; j++) {
      // CanvasTexture's default flipY means row 0 (canvas top) lands at
      // v=1 (plane top); v here is the fraction from the plane's bottom.
      const v = 1 - j / (height - 1);
      const verticalAlpha =
        v < 0.6 ? THREE.MathUtils.lerp(1, 0.7, v / 0.6) : THREE.MathUtils.lerp(0.7, 0, (v - 0.6) / 0.4);
      const widthT = Math.min(1, v / 0.32);
      const coreFraction = THREE.MathUtils.lerp(0.22, 0.82, widthT);
      for (let i = 0; i < width; i++) {
        const nx = (i / (width - 1) - 0.5) * 2;
        const d = Math.abs(nx) / coreFraction;
        const core = d >= 1 ? 0 : Math.exp(-d * d * 1.6);
        const edgeT = THREE.MathUtils.clamp((Math.abs(nx) - 0.78) / (1 - 0.78), 0, 1);
        const edgeFade = 1 - edgeT * edgeT * (3 - 2 * edgeT);
        const horizontalAlpha = core * edgeFade;
        const alpha = Math.max(0, Math.min(1, verticalAlpha * horizontalAlpha));
        const idx = (j * width + i) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = Math.round(alpha * 255);
      }
    }
    ctx.putImageData(image, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

// Halo band for a thin neon ring line — bright in a mid-radius band,
// transparent at both the center and the rim, giving a crisp ring an
// additive bloom halo around it instead of reading as a flat outline.
export function useRingGlowTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.55, "rgba(255,255,255,0)");
    gradient.addColorStop(0.68, "rgba(255,255,255,0.55)");
    gradient.addColorStop(0.78, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.9, "rgba(255,255,255,0.3)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

// Jagged mountain-ridge silhouette alpha mask — opaque below a wandering
// ridge line, transparent above, with a soft feather at the ridge itself
// (a hard-edged cutout would alias badly at the huge distance this is
// meant to be viewed from). The ridge line is a sum of a few fixed-seed
// sine waves at different frequencies/phases rather than literal terrain
// data — cheap and reads convincingly as a distant range silhouette at
// the size/distance HorizonSilhouettes.tsx uses it at. `seed` varies the
// wave phases so multiple instances don't look identical.
export function useMountainRidgeTexture(seed: number) {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const width = 512;
    const height = 160;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const image = ctx.createImageData(width, height);
    const data = image.data;
    const p1 = seed * 0.7;
    const p2 = seed * 1.9 + 1.3;
    const p3 = seed * 3.1 + 2.7;
    for (let i = 0; i < width; i++) {
      const x = i / (width - 1);
      // 0 (top of canvas, tallest peak) .. 1 (bottom, sea-level) fraction
      // where this column's ridge line sits, built from three octaves so
      // it wanders rather than repeating a single sine period.
      const ridge =
        0.42 +
        Math.sin(x * Math.PI * 2.3 + p1) * 0.16 +
        Math.sin(x * Math.PI * 5.1 + p2) * 0.08 +
        Math.sin(x * Math.PI * 11.0 + p3) * 0.04;
      const ridgeV = THREE.MathUtils.clamp(ridge, 0.1, 0.7);
      const feather = 0.012;
      for (let j = 0; j < height; j++) {
        const v = j / (height - 1);
        const alpha = THREE.MathUtils.smoothstep(v, ridgeV - feather, ridgeV + feather);
        const idx = (j * width + i) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = Math.round(alpha * 255);
      }
    }
    ctx.putImageData(image, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [seed]);
}

// Soft dot texture (used for star points / sparkle billboards) — same
// technique CosmicCanvas.tsx's makeSoftDotTexture already uses, shared
// here so StarField.tsx and any construct's particle points can reuse it.
export function useSoftDotTexture(size = 64) {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.75)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [size]);
}
