import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        // Backward link (historical context) — amber
        backward: {
          DEFAULT: "#d97706",
          bg: "#fffbeb",
          border: "#fcd34d",
        },
        // Sideways link (concurrent/related) — cyan
        sideways: {
          DEFAULT: "#0891b2",
          bg: "#ecfeff",
          border: "#67e8f9",
        },
        // Forward link (predictive/future) — emerald
        forward: {
          DEFAULT: "#059669",
          bg: "#ecfdf5",
          border: "#6ee7b7",
        },
      },
    },
  },
  plugins: [],
};

export default config;
