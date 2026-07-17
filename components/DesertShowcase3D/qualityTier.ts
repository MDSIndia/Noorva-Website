import { useEffect, useState } from "react";

export type QualityTier = "desktop" | "tablet" | "mobile";

export interface TierConfig {
  starCount: number;
  milkyWay: boolean;
  nebulaLayers: number;
  planetCount: number;
  meteorPoolSize: number;
  terrainSegments: number;
  glintIntensity: number; // 0..1 — sparse hashed mineral-glint dots on the terrain, see terrainShaders.ts
  mountainSilhouettes: number;
  lunarPropCount: number;
  dustCount: number;
  guideAccentParticles: number;
  companionDustParticles: number;
  cameraRoll: boolean;
  simplifiedConstructs: boolean;
  bloom: boolean;
}

// Starting budget — thousands of points, not literal millions, real bloom
// on desktop/tablet only, no true depth-of-field/motion-blur anywhere.
// terrainSegments is lower than the old sci-fi terrain's budget at each
// tier: the new regolith/crater shader samples the height field 3x per
// vertex (center + two normal-sampling offsets) instead of once, so the
// per-vertex cost is meaningfully higher even before segment count is
// considered. Tune by feel once running on real devices.
export const TIER_CONFIGS: Record<QualityTier, TierConfig> = {
  desktop: {
    starCount: 7000,
    milkyWay: true,
    nebulaLayers: 2,
    planetCount: 2,
    meteorPoolSize: 4,
    terrainSegments: 160,
    glintIntensity: 1,
    mountainSilhouettes: 5,
    lunarPropCount: 8,
    dustCount: 400,
    guideAccentParticles: 40,
    companionDustParticles: 60,
    cameraRoll: true,
    simplifiedConstructs: false,
    bloom: true,
  },
  tablet: {
    starCount: 3800,
    milkyWay: true,
    nebulaLayers: 1,
    planetCount: 1,
    meteorPoolSize: 2,
    terrainSegments: 96,
    glintIntensity: 1,
    mountainSilhouettes: 4,
    lunarPropCount: 5,
    dustCount: 200,
    guideAccentParticles: 20,
    companionDustParticles: 30,
    cameraRoll: false,
    simplifiedConstructs: false,
    bloom: true,
  },
  mobile: {
    starCount: 1800,
    milkyWay: false,
    nebulaLayers: 0,
    planetCount: 1,
    meteorPoolSize: 0,
    terrainSegments: 48,
    glintIntensity: 0.6,
    mountainSilhouettes: 3,
    lunarPropCount: 2,
    dustCount: 0,
    guideAccentParticles: 0,
    companionDustParticles: 0,
    cameraRoll: false,
    // Turns off the small looping accents (Planner's cable status-light
    // pulse, Companion's idle dust) — the solid geometry itself (mast,
    // monolith, stakes, rover body) still renders fully; this only trims
    // the extra always-animating flourishes on top.
    simplifiedConstructs: true,
    bloom: false,
  },
};

function computeTier(): QualityTier {
  const w = window.innerWidth;
  let tier: QualityTier = w < 768 ? "mobile" : w < 1280 ? "tablet" : "desktop";
  // One-tier downgrade on low-core-count devices — a wide desktop browser
  // window on modest hardware shouldn't get the full desktop particle/
  // shader budget just because of its viewport width.
  const cores = navigator.hardwareConcurrency ?? 8;
  if (cores <= 4) {
    if (tier === "desktop") tier = "tablet";
    else if (tier === "tablet") tier = "mobile";
  }
  return tier;
}

export function useQualityTier(): QualityTier {
  const [tier, setTier] = useState<QualityTier>("desktop");
  useEffect(() => {
    const update = () => setTier(computeTier());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return tier;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}
