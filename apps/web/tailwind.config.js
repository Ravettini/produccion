/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#F8FAFC",
          muted: "#F5F7FB",
        },
        sidebar: {
          DEFAULT: "#0F172A",
          hover: "#1E293B",
          active: "#1E3A5F",
          border: "#1E293B",
        },
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
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
