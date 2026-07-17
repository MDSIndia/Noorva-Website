"use client";

import StarField from "./StarField";
import NebulaLayers from "./NebulaLayers";
import DistantPlanets from "./DistantPlanets";
import MeteorShower from "./MeteorShower";
import type { TierConfig } from "./qualityTier";

interface SkyProps {
  tier: TierConfig;
}

export default function Sky({ tier }: SkyProps) {
  return (
    <>
      <StarField count={tier.starCount} milkyWay={tier.milkyWay} />
      {tier.nebulaLayers > 0 && <NebulaLayers count={tier.nebulaLayers} />}
      {tier.planetCount > 0 && <DistantPlanets count={tier.planetCount} />}
      {tier.meteorPoolSize > 0 && <MeteorShower poolSize={tier.meteorPoolSize} />}
    </>
  );
}
