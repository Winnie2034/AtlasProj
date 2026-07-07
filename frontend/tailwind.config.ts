import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        paper: "#f7f8f5",
        line: "#d8ded6",
        moss: "#506b4f",
        berry: "#8a3b5b",
        river: "#256d85",
        status: {
          success: "#2f7d51",
          warning: "#b7791f",
          error: "#b42318",
          neutral: "#64748b",
        },
      },
      boxShadow: {
        panel: "0 1px 2px rgba(31, 41, 51, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
