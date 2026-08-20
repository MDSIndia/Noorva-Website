import type { Metadata } from "next";
import FutureProductPage from "@/components/FutureProductPage";

export const metadata: Metadata = {
  title: "Noorva Phones — Future Product",
  description: "A device experience designed around the Noorva ecosystem and intelligent interaction.",
};

export default function PhonesPage() {
  return (
    <FutureProductPage
      icon="phones"
      name="Noorva Phones"
      positioning="A device experience designed around the Noorva ecosystem and intelligent interaction."
      ecosystemFit="Noorva Phones is envisioned as a device-level home for the Noorva ecosystem — a phone built around intelligent, human-centered interaction from the ground up."
      companionConnection="Noorva Phones is designed to give Noorva Companion a native home, deeply integrated into the device experience rather than living as just another app."
      useCases={[
        "A device built around Noorva's companion experience",
        "Deeper, native-level ecosystem integration",
        "Continuity across every other Noorva product",
        "A foundation for future ecosystem expansion",
      ]}
    />
  );
}
