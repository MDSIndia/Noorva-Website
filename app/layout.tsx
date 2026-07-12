import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Playfair_Display, Oxanium } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const oxanium = Oxanium({
  variable: "--font-oxanium",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Noorva — The Future of Human-AI Companionship",
  description:
    "Noorva is a next-generation Human-Interactive AI Companion. Not another assistant — a guide, mentor, planner, and companion that grows with you.",
  keywords: [
    "AI Companion",
    "Human Interactive AI",
    "Digital Companion",
    "AI Guide",
    "Smart Assistant",
    "Personalized AI",
    "Future of AI",
    "AI Mentor",
    "Noorva",
  ],
  authors: [{ name: "Noorva" }],
  openGraph: {
    title: "Noorva — The Future of Human-AI Companionship",
    description: "Not another assistant. A guide, mentor, planner, and companion that grows with you.",
    type: "website",
    siteName: "Noorva",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noorva — The Future of Human-AI Companionship",
    description: "Not another assistant. A guide, mentor, planner, and companion that grows with you.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jakarta.variable} ${playfair.variable} ${oxanium.variable} antialiased`}>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
