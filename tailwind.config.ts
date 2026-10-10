import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette from mdsindia.in
        primary: "#0055FF",
        "primary-dark": "#0044CC",
        secondary: "#7B2FBE",
        accent: "#00D4FF",
        "bg-section": "#060914",
        "text-main": "#FFFFFF",
        "text-muted": "rgba(255,255,255,0.65)",
        "text-soft": "rgba(255,255,255,0.35)",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "Segoe UI", "Arial", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-primary": "linear-gradient(135deg, #0055FF, #7B2FBE)",
        "gradient-blue-cyan": "linear-gradient(135deg, #0055FF, #00D4FF)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "floatSlow 8s ease-in-out infinite",
        "pulse-soft": "pulseSoft 4s ease-in-out infinite",
        "orb-drift": "orbDrift 12s ease-in-out infinite",
        "rotate-slow": "rotateSlow 25s linear infinite",
        "rotate-slow-r": "rotateSlowReverse 20s linear infinite",
        "glow-pulse": "glowPulse 2.5s ease-in-out infinite",
      },
      boxShadow: {
        "card": "0 8px 32px rgba(0,0,0,0.25), inset 0 1px rgba(255,255,255,0.07)",
        "card-hover": "0 16px 48px rgba(0,85,255,0.25), 0 4px 16px rgba(0,0,0,0.3)",
        "glow-blue": "0 0 40px rgba(0,85,255,0.35), 0 0 80px rgba(0,85,255,0.15)",
        "glow-purple": "0 0 40px rgba(123,47,190,0.35)",
        "btn": "0 0 20px rgba(0,153,255,0.35)",
        "btn-hover": "0 0 30px rgba(0,212,255,0.55)",
      },
      borderRadius: {
        "2xl": "20px",
        "3xl": "28px",
        "4xl": "36px",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
