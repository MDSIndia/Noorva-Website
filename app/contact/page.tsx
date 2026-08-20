import type { Metadata } from "next";
import { Mail, Briefcase, Users } from "lucide-react";
import PageSection from "@/components/ui/PageSection";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Contact — Noorva",
  description: "Reach out to Noorva for general questions, business inquiries or creator partnerships.",
};

// No backend/email service exists in this repo yet, so these route through
// mailto: rather than a form that would silently go nowhere. Addresses are
// placeholders pending the client's confirmed official contact details
// (doc §26/§27).
const CHANNELS = [
  { icon: Mail, title: "General Inquiries", description: "Questions about Noorva or the ecosystem.", email: "hello@noorva.com" },
  { icon: Briefcase, title: "Business & Partnerships", description: "B2B, integrations and partnership requests.", email: "business@noorva.com" },
  { icon: Users, title: "Creators", description: "Interested in creating on Noorva Video?", email: "creators@noorva.com" },
];

export default function ContactPage() {
  return (
    <main className="pt-24">
      <PageSection id="contact">
        <SectionHeading
          eyebrow="Get in Touch"
          title="We'd love to"
          accent="hear from you."
          description="Whether you're curious about the ecosystem, exploring a partnership, or interested in creating on Noorva Video — reach out below."
          align="center"
        />

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {CHANNELS.map((c, i) => {
            const Icon = c.icon;
            return (
              <Card key={c.title} delay={i * 0.06}>
                <a href={`mailto:${c.email}`} className="group block h-full p-7">
                  <Icon className="mb-5 h-6 w-6 text-[color:var(--accent)]" strokeWidth={1.5} />
                  <h3 className="mb-2 text-base font-medium text-[color:var(--ink)]">{c.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-[color:var(--ink-soft)]">{c.description}</p>
                  <span className="text-sm font-medium text-[color:var(--accent)] transition-opacity duration-300 group-hover:opacity-70">
                    {c.email}
                  </span>
                </a>
              </Card>
            );
          })}
        </div>
      </PageSection>
    </main>
  );
}
