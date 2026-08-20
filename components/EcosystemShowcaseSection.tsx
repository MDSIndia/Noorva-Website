"use client";

// Doc §6/§8 "Meet the Noorva Ecosystem" / "Product Showcase Section" —
// visually introduces each product as part of one ecosystem, each with a
// short explanation and a link to its detailed page.

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageSection from "./ui/PageSection";
import SectionHeading from "./ui/SectionHeading";
import Card from "./ui/Card";
import { ECOSYSTEM_PRODUCTS } from "./productsData";

export default function EcosystemShowcaseSection() {
  return (
    <PageSection id="ecosystem-showcase" shade="dim">
      <SectionHeading
        eyebrow="The Ecosystem"
        title="Meet the"
        accent="Noorva ecosystem."
        description="Four products, one connected intelligence. Explore what's available today and what's coming next."
      />

      <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {ECOSYSTEM_PRODUCTS.map((product, i) => (
          <Card key={product.slug} delay={i * 0.06}>
            <Link href={product.href} className="group block h-full p-7 md:p-8">
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-[color:var(--ink-soft)] uppercase">
                  {product.status}
                </span>
                <ArrowUpRight className="h-4 w-4 text-[color:var(--ink-faint)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[color:var(--accent)]" />
              </div>
              <h3 className="font-display mb-3 text-2xl font-normal text-[color:var(--ink)] md:text-3xl">{product.name}</h3>
              <p className="text-sm leading-relaxed text-[color:var(--ink-soft)] md:text-base">{product.message}</p>
            </Link>
          </Card>
        ))}
      </div>
    </PageSection>
  );
}
