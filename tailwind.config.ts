import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4D7CFF",
        "primary-dark": "#3A6AEE",
        secondary: "#6D5BFF",
        accent: "#00C8FF",
        "bg-section": "#F8FAFF",
        "text-main": "#111827",
        "text-muted": "#6B7280",
        "text-soft": "#9CA3AF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        jakarta: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-primary": "linear-gradient(135deg, #4D7CFF, #6D5BFF)",
        "gradient-blue-cyan": "linear-gradient(135deg, #4D7CFF, #00C8FF)",
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
        "card": "0 4px 24px rgba(77,124,255,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        "card-hover": "0 16px 48px rgba(77,124,255,0.14), 0 4px 16px rgba(0,0,0,0.06)",
        "glow-blue": "0 0 40px rgba(77,124,255,0.25), 0 0 80px rgba(77,124,255,0.1)",
        "glow-purple": "0 0 40px rgba(109,91,255,0.25)",
        "btn": "0 4px 20px rgba(77,124,255,0.35)",
        "btn-hover": "0 8px 32px rgba(77,124,255,0.45)",
      },
      borderRadius: {
        "2xl": "20px",
        "3xl": "28px",
        "4xl": "36px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
