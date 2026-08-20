"use client";

// Doc §6/§8 "Meet the Noorva Ecosystem" / "Product Showcase Section" —
// visually introduces each product as part of one ecosystem, each with a
// short explanation and a link to its detailed page. Laid out as a
// featured-plus-three bento grid (Companion gets the large slot, as the
// doc's "primary product") rather than four uniform tiles.

import Link from "next/link";
import { ArrowUpRight, MessageCircleHeart } from "lucide-react";
import PageSection from "./ui/PageSection";
import SectionHeading from "./ui/SectionHeading";
import Card from "./ui/Card";
import { ECOSYSTEM_PRODUCTS } from "./productsData";

export default function EcosystemShowcaseSection() {
  const [featured, ...rest] = ECOSYSTEM_PRODUCTS;

  return (
    <PageSection id="ecosystem-showcase" shade="dim">
      <SectionHeading
        eyebrow="The Ecosystem"
        title="Meet the"
        accent="Noorva ecosystem."
        description="Four products, one connected intelligence. Explore what's available today and what's coming next."
      />

      <div className="mt-16 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Link href={featured.href} className="group relative flex h-full flex-col overflow-hidden p-8 md:p-10">
            <div className="relative z-10 mb-10 flex items-center justify-between">
              <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-[color:var(--ink-soft)] uppercase">
                {featured.status}
              </span>
              <ArrowUpRight className="h-5 w-5 text-[color:var(--ink-faint)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[color:var(--accent)]" />
            </div>

            {/* Fills the space a two-line title + description leaves behind
                in a card this tall, instead of a bare gap. */}
            <div className="relative flex flex-1 items-center justify-center py-10">
              <div
                className="pointer-events-none absolute h-56 w-56 rounded-full opacity-[0.16] blur-3xl"
                style={{ backgroundImage: "var(--accent-gradient)" }}
              />
              <div
                className="relative flex h-28 w-28 items-center justify-center rounded-full shadow-[0_20px_44px_-18px_var(--shadow-cool)] transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: "var(--accent-gradient)" }}
              >
                <MessageCircleHeart className="h-12 w-12 text-white" strokeWidth={1} />
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="font-display mb-3 text-3xl font-normal text-[color:var(--ink)] md:text-4xl">{featured.name}</h3>
              <p className="max-w-md text-sm leading-relaxed text-[color:var(--ink-soft)] md:text-base">{featured.message}</p>
            </div>
          </Link>
        </Card>

        <div className="flex flex-col gap-5">
          {rest.map((product, i) => (
            <Card key={product.slug} delay={i * 0.06} className="flex-1">
              <Link href={product.href} className="group flex h-full flex-col justify-between p-6">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-[10px] font-medium tracking-[0.15em] text-[color:var(--ink-faint)] uppercase">{product.status}</span>
                  <ArrowUpRight className="h-4 w-4 text-[color:var(--ink-faint)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[color:var(--accent)]" />
                </div>
                <div>
                  <h3 className="font-display mb-2 text-xl font-normal text-[color:var(--ink)]">{product.name}</h3>
                  <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{product.message}</p>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </PageSection>
  );
}
