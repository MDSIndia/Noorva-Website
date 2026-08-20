import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Noorva — A Connected Ecosystem of Human-Interactive AI",
  description:
    "Noorva is building a connected ecosystem of human-interactive AI products — Noorva Companion, Noorva Video, and the wearables and devices that follow.",
  keywords: [
    "Noorva",
    "Noorva Companion",
    "Noorva Video",
    "Human Interactive AI",
    "AI Ecosystem",
    "Personal AI",
    "AI Companion",
  ],
  authors: [{ name: "Noorva" }],
  openGraph: {
    title: "Noorva — A Connected Ecosystem of Human-Interactive AI",
    description: "Noorva Companion, Noorva Video, and the wearables and devices that follow — one connected ecosystem.",
    type: "website",
    siteName: "Noorva",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noorva — A Connected Ecosystem of Human-Interactive AI",
    description: "Noorva Companion, Noorva Video, and the wearables and devices that follow — one connected ecosystem.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} antialiased`}>
        <SmoothScroll>
          <div className="paper-grain" />
          <Header />
          {children}
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
