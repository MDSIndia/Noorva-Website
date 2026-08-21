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
      style={{ background: shade === "dim" ? "var(--paper-dim)" : "var(--paper)" }}
    >
      {mesh && <div className="gradient-mesh" />}
      {rule && <div className="absolute inset-x-0 top-0 z-10 h-px bg-[color:var(--line)]" />}
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10">{children}</div>
    </section>
  );
}
