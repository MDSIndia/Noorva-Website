"use client";

// Shared section shell for the light/editorial design — generous padding,
// optional alternating paper/paper-dim band for rhythm between sections,
// and a hairline top rule instead of the old dark theme's glow orbs.
// `mesh` adds the same atmospheric gradient bloom used in the homepage
// Hero — pass it on the first section of a page so every page opens with
// some depth instead of a flat rectangle of text.

import type { ReactNode } from "react";

interface PageSectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  shade?: "paper" | "dim";
  rule?: boolean;
  mesh?: boolean;
}

export default function PageSection({ id, children, className = "", shade = "paper", rule = true, mesh = false }: PageSectionProps) {
  return (
    <section
      id={id}
      className={`relative w-full overflow-hidden py-24 md:py-32 ${className}`}
      // "paper" is fully transparent so the fixed cosmos shows through; "dim"
      // is a frosted-glass band so alternating bands still read as bands.
      style={shade === "dim" ? { background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" } : { background: "transparent" }}
    >
      {mesh && <div className="gradient-mesh" />}
      {rule && <div className="absolute inset-x-0 top-0 z-10 h-px bg-[color:var(--line)]" />}
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10">{children}</div>
    </section>
  );
}
