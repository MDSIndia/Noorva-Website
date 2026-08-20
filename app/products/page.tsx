import type { Metadata } from "next";
import EcosystemShowcaseSection from "@/components/EcosystemShowcaseSection";

export const metadata: Metadata = {
  title: "Products — Noorva Ecosystem",
  description: "Noorva Companion, Noorva Video, Noorva Glasses and Noorva Phones — one connected ecosystem of human-interactive AI products.",
};

export default function ProductsPage() {
  return (
    <main className="pt-24">
      <EcosystemShowcaseSection />
    </main>
  );
}
