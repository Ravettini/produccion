/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          muted: "#F5F7FB",
        },
        sidebar: {
          DEFAULT: "rgb(var(--sidebar) / <alpha-value>)",
          hover: "rgb(var(--sidebar-hover) / <alpha-value>)",
          active: "rgb(var(--sidebar-active) / <alpha-value>)",
          border: "rgb(var(--sidebar-border) / <alpha-value>)",
        },
        brand: {
          50: "rgb(var(--brand-50) / <alpha-value>)",
          100: "rgb(var(--brand-100) / <alpha-value>)",
          200: "rgb(var(--brand-200) / <alpha-value>)",
          300: "rgb(var(--brand-300) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)",
          800: "rgb(var(--brand-800) / <alpha-value>)",
          900: "rgb(var(--brand-900) / <alpha-value>)",
        },
        gov: {
          50: "#f0f5fa",
          100: "#dbe6f2",
          200: "#bdd0e6",
          300: "#92b3d4",
          400: "#618fbe",
          500: "#4071a6",
          600: "#30598b",
          700: "#284972",
          800: "#253e60",
          900: "#233651",
          950: "#172238",
        },
        success: { DEFAULT: "#059669", light: "#D1FAE5", dark: "#047857" },
        warning: { DEFAULT: "#D97706", light: "#FEF3C7", dark: "#B45309" },
        error: { DEFAULT: "#DC2626", light: "#FEE2E2", dark: "#B91C1C" },
        info: { DEFAULT: "#0284C7", light: "#E0F2FE", dark: "#0369A1" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        card: "0.875rem",
        button: "0.625rem",
        badge: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(15 23 42 / 0.04), 0 1px 2px -1px rgb(15 23 42 / 0.04)",
        cardHover: "0 8px 24px -4px rgb(15 23 42 / 0.08), 0 4px 8px -4px rgb(15 23 42 / 0.04)",
        sidebar: "4px 0 24px -4px rgb(0 0 0 / 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
