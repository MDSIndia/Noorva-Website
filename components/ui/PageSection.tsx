"use client";

// Shared section shell for the light/editorial design — generous padding,
// optional alternating paper/paper-dim band for rhythm between sections,
// and a hairline top rule instead of the old dark theme's glow orbs.

import type { ReactNode } from "react";

interface PageSectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  shade?: "paper" | "dim";
  rule?: boolean;
}

export default function PageSection({ id, children, className = "", shade = "paper", rule = true }: PageSectionProps) {
  return (
    <section
      id={id}
      className={`relative w-full py-24 md:py-32 ${className}`}
      style={{ background: shade === "dim" ? "var(--paper-dim)" : "var(--paper)" }}
    >
      {rule && <div className="absolute inset-x-0 top-0 h-px bg-[color:var(--line)]" />}
      <div className="relative mx-auto max-w-7xl px-6 md:px-10">{children}</div>
    </section>
  );
}
