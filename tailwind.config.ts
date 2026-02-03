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
        surface: {
          800: "#1a1d21",
          700: "#22262b",
          600: "#2a2f36",
          500: "#343a42",
        },
        teal: {
          glow: "rgba(45, 212, 191, 0.15)",
          accent: "#2dd4bf",
          muted: "#5eead4",
        },
      },
      boxShadow: {
        "teal-glow": "0 0 20px rgba(45, 212, 191, 0.12)",
        "teal-glow-sm": "0 0 12px rgba(45, 212, 191, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
