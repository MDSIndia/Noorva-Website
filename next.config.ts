import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    // Next 15+ only serves the default [75] quality tier unless declared
    // here — HeroLogoPortal.tsx requests quality={100} for its hero
    // artwork (fine sparkle/particle detail that compresses visibly at
    // 75), which was otherwise silently 400ing at the /_next/image
    // endpoint ("q" parameter (quality) of 100 is not allowed"),
    // leaving the image blank with no thrown JS error.
    qualities: [75, 100],
  },
};

export default nextConfig;
