import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        arctic: {
          background: "rgb(var(--color-bg) / <alpha-value>)",
          canvas: "rgb(var(--color-canvas) / <alpha-value>)",
          surface: "rgb(var(--color-surface) / <alpha-value>)",
          border: "rgb(var(--color-border) / <alpha-value>)",
          ice: "rgb(var(--color-primary) / <alpha-value>)",
          primary: "rgb(var(--color-primary) / <alpha-value>)",
          "primary-hover": "rgb(var(--color-primary-hover) / <alpha-value>)",
          text: "rgb(var(--color-text) / <alpha-value>)",
          muted: "rgb(var(--color-text-muted) / <alpha-value>)"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"]
      },
      boxShadow: {
        glass: "0 0 30px rgb(169 216 255 / 0.12)",
        "brutal-sm": "2px 2px 0px 0px rgb(var(--color-shadow) / 1)",
        brutal: "6px 6px 0px 0px rgb(var(--color-shadow) / 1)",
        "brutal-lg": "10px 10px 0px 0px rgb(var(--color-shadow) / 1)"
      },
      backdropBlur: {
        panel: "18px"
      }
    }
  },
  plugins: []
} satisfies Config;
