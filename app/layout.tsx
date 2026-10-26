import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CosmicBackground from "@/components/CosmicBackground";

// Same typeface as mdsindia.in.
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#020208",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Noorva — A Connected Ecosystem of Noorva Properative AI",
  description:
    "Noorva is building a connected ecosystem of Noorva Properative AI products — Noorva Companion, Noorva Video, and the wearables and devices that follow.",
  keywords: [
    "Noorva",
    "Noorva Companion",
    "Noorva Video",
    "Noorva Properative AI",
    "AI Ecosystem",
    "Personal AI",
    "AI Companion",
  ],
  authors: [{ name: "Noorva" }],
  openGraph: {
    title: "Noorva — A Connected Ecosystem of Noorva Properative AI",
    description: "Noorva Companion, Noorva Video, and the wearables and devices that follow — one connected ecosystem.",
    type: "website",
    siteName: "Noorva",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noorva — A Connected Ecosystem of Noorva Properative AI",
    description: "Noorva Companion, Noorva Video, and the wearables and devices that follow — one connected ecosystem.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={outfit.variable} style={{ backgroundColor: "#020208" }}>
      <body className="antialiased" style={{ color: "#ffffff" }}>
        <CosmicBackground />
        <SmoothScroll>
          <div className="noise-grain" />
          <Header />
          {children}
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
