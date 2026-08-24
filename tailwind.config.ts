import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0F1E36",
        royal: "#1E3A8A",
        turquoise: "#0D9488",
        lightblue: "#E0F2FE",
        gold: "#D97706",
        amber: "#F59E0B",
        cream: "#FDFBF7",
      },
      fontFamily: {
        sans: ["var(--font-rubik)", "Assistant", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(15, 30, 54, 0.08)",
        card: "0 2px 12px -2px rgba(15, 30, 54, 0.10)",
        glow: "0 0 0 1px rgba(217, 119, 6, 0.25), 0 8px 24px -6px rgba(217, 119, 6, 0.35)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
        "royal-gradient": "linear-gradient(135deg, #1E3A8A 0%, #0F1E36 100%)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      keyframes: {
        "slide-in": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-up": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.3s ease-out",
        "fade-up": "fade-up 0.4s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
