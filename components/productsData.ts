// Shared ecosystem product data (doc §4 "Main Product Ecosystem" table) —
// used by the homepage ecosystem showcase, /products, and /ecosystem so the
// four products are described the same way everywhere instead of drifting.

export interface EcosystemProduct {
  slug: "companion" | "video" | "glasses" | "phones";
  name: string;
  role: string;
  status: "Primary Product" | "Content Product" | "Future Product";
  message: string;
  href: string;
}

export const ECOSYSTEM_PRODUCTS: EcosystemProduct[] = [
  {
    slug: "companion",
    name: "Noorva Companion",
    role: "Primary product",
    status: "Primary Product",
    message: "A personalized, human-interactive AI companion for everyday life.",
    href: "/products/companion",
  },
  {
    slug: "video",
    name: "Noorva Video",
    role: "Content product",
    status: "Content Product",
    message: "A personalized video platform focused on useful, relevant and credible content.",
    href: "/products/video",
  },
  {
    slug: "glasses",
    name: "Noorva Glasses",
    role: "Future / ecosystem product",
    status: "Future Product",
    message: "A wearable Noorva experience that can extend the companion beyond the phone.",
    href: "/products/glasses",
  },
  {
    slug: "phones",
    name: "Noorva Phones",
    role: "Future / ecosystem product",
    status: "Future Product",
    message: "A device experience designed around the Noorva ecosystem and intelligent interaction.",
    href: "/products/phones",
  },
];
