"use client";

// Doc §6/§13/§14 — "Connected Future": Glasses and Phones introduced as
// future/ecosystem products. No hardware specs, sensors, battery or OS
// claims are made — the supplied documentation explicitly withholds those
// pending client-approved specifications, so this stays concept-level.

import { Glasses, Smartphone } from "lucide-react";
import PageSection from "./ui/PageSection";
import SectionHeading from "./ui/SectionHeading";
import Card from "./ui/Card";
import { ECOSYSTEM_PRODUCTS } from "./productsData";

const ICONS = { glasses: Glasses, phones: Smartphone } as const;

export default function ConnectedFutureSection() {
  const futureProducts = ECOSYSTEM_PRODUCTS.filter((p) => p.slug === "glasses" || p.slug === "phones");

  return (
    <PageSection id="connected-future">
      <SectionHeading
        eyebrow="Beyond the Phone"
        title="A connected future,"
        accent="one companion at a time."
        description="Noorva Companion is the beginning. The wider ecosystem is designed to travel with you — into wearables, devices and whatever comes next."
      />

      <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {futureProducts.map((product, i) => {
          const Icon = ICONS[product.slug as "glasses" | "phones"];
          return (
            <Card key={product.slug} delay={i * 0.08}>
              <div className="p-8 md:p-10">
                <Icon className="mb-6 h-8 w-8 text-[color:var(--accent)]" strokeWidth={1} />
                <span className="mb-3 block text-[10px] font-medium tracking-[0.2em] text-[color:var(--ink-faint)] uppercase">
                  Future / Concept
                </span>
                <h3 className="font-display mb-3 text-2xl font-normal text-[color:var(--ink)] md:text-3xl">{product.name}</h3>
                <p className="text-sm leading-relaxed text-[color:var(--ink-soft)] md:text-base">{product.message}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </PageSection>
  );
}
