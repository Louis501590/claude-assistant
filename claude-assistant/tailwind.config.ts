import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050816",
        accent: "#00D4FF",
        ink: "#FFFFFF",
        mist: "#A8B2D1",
        panel: "rgba(255,255,255,0.035)",
        line: "rgba(168,178,209,0.14)",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "Inter", "Segoe UI", "sans-serif"],
      },
      letterSpacing: { wordmark: "0.42em" },
    },
  },
  plugins: [],
} satisfies Config;
