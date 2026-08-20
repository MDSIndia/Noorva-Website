import type { Metadata } from "next";
import PageSection from "@/components/ui/PageSection";
import SectionHeading from "@/components/ui/SectionHeading";
import FaqAccordion from "@/components/FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ — Noorva",
  description: "Answers to common questions about Noorva, Noorva Companion, Noorva Video and the wider ecosystem.",
};

export default function FaqPage() {
  return (
    <main className="pt-24">
      <PageSection id="faq">
        <SectionHeading eyebrow="Questions" title="Frequently Asked" accent="questions." align="center" className="mb-16" />
        <FaqAccordion />
      </PageSection>
    </main>
  );
}
