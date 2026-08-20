import type { Metadata } from "next";
import FutureProductPage from "@/components/FutureProductPage";

export const metadata: Metadata = {
  title: "Noorva Glasses — Future Product",
  description: "A planned wearable extension of the Noorva experience, beyond the phone.",
};

export default function GlassesPage() {
  return (
    <FutureProductPage
      icon="glasses"
      name="Noorva Glasses"
      positioning="A wearable Noorva experience that can extend the companion beyond the phone."
      ecosystemFit="Noorva Glasses is envisioned as a wearable layer of the ecosystem — a way for Noorva's guidance to travel with you, hands-free, wherever you go."
      companionConnection="Noorva Glasses is designed to work in step with Noorva Companion, carrying the same understanding of your goals, preferences and context into a wearable form."
      useCases={[
        "Hands-free access to Noorva's guidance",
        "A wearable extension of everyday companionship",
        "Continuity between phone and wearable experiences",
        "Future integration with the wider Noorva ecosystem",
      ]}
    />
  );
}
