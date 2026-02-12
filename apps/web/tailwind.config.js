/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
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
        /* Semántica para estados y feedback */
        success: { DEFAULT: "#059669", light: "#d1fae5", dark: "#047857" },
        warning: { DEFAULT: "#d97706", light: "#fef3c7", dark: "#b45309" },
        error: { DEFAULT: "#dc2626", light: "#fee2e2", dark: "#b91c1c" },
        info: { DEFAULT: "#0284c7", light: "#e0f2fe", dark: "#0369a1" },
      },
      fontFamily: {
        sans: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        card: "0.75rem",
        button: "0.5rem",
        badge: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        cardHover: "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
      },
      spacing: {
        page: "1.5rem",
        section: "1.5rem",
      },
    },
  },
  plugins: [],
};
