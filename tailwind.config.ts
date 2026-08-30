import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        // domain colors from the design brief
        health: { DEFAULT: "#10b981", light: "#d1fae5" },
        fitness: { DEFAULT: "#22c55e", light: "#dcfce7" },
        career: { DEFAULT: "#3b82f6", light: "#dbeafe" },
        growth: { DEFAULT: "#a855f7", light: "#f3e8ff" },
        social: { DEFAULT: "#ec4899", light: "#fce7f3" },
        spiritual: { DEFAULT: "#14b8a6", light: "#ccfbf1" },
        recovery: { DEFAULT: "#f59e0b", light: "#fef3c7" },
        mental: { DEFAULT: "#6366f1", light: "#e0e7ff" },
        warn: { DEFAULT: "#fb923c", light: "#ffedd5" },
        critical: { DEFAULT: "#b91c1c", light: "#fee2e2" },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 20px -4px rgba(20, 20, 43, 0.08)",
        card: "0 4px 24px -8px rgba(20, 20, 43, 0.10)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
