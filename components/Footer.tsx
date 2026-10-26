"use client";

// Global site footer (doc §22). Only columns/items that map to a page built
// in this pass are linked — Business (B2B/API) and Legal (Privacy/Terms/
// Refund) aren't built yet, so those columns are omitted rather than
// shipping dead links.

import Image from "next/image";
import Link from "next/link";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Products",
    links: [
      { label: "Noorva Companion", href: "/products/companion" },
      { label: "Noorva Video", href: "/products/video" },
      { label: "Noorva Glasses", href: "/products/glasses" },
      { label: "Noorva Phones", href: "/products/phones" },
    ],
  },
  {
    heading: "Technology",
    links: [
      { label: "Noorva Properative AI", href: "/technology#human-interactive-ai" },
      { label: "Noorva Guide", href: "/technology#noorva-guide" },
      { label: "Mood Intelligence", href: "/technology#mood-algorithm" },
      { label: "Source Filtering", href: "/technology#source-filtering" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Ecosystem", href: "/ecosystem" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Noorva", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="w-full glass-strong !rounded-none !border-x-0 !border-b-0 pt-16 pb-10">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <Image src="/NoorvaLogo.png" alt="" width={24} height={24} className="h-6 w-6" />
              <span className="font-display text-xl text-[color:var(--ink)]">Noorva</span>
            </div>
            <p className="max-w-[220px] text-sm leading-relaxed text-[color:var(--ink-faint)]">
              A connected ecosystem of Noorva Properative AI products.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="mb-4 text-[10px] font-semibold tracking-[0.2em] text-[color:var(--ink-faint)] uppercase">{col.heading}</h3>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[color:var(--ink-soft)] transition-colors duration-300 hover:text-[color:var(--ink)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 border-t border-[color:var(--line)] pt-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs tracking-[0.15em] text-[color:var(--ink-faint)] uppercase">
            Noorva &middot; {new Date().getFullYear()}
          </p>
          <p className="text-xs text-[color:var(--ink-faint)]">
            Ecosystem products beyond Noorva Companion are in active development.
          </p>
        </div>
      </div>
    </footer>
  );
}
