import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fond: "#F1F3F2",
        encre: "#16201C",
        sourdine: "#6B7A74",
        repos: "#DDE2E0",
        zone1: "#7C93A3",
        zone2: "#2F6E52",
        zone3: "#8A7A2E",
        zone4: "#B4552B",
        zone5: "#8C2C21",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Inter Tight"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      maxWidth: {
        app: "26rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
