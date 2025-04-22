import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        // Custom colors

        // NEW Inspection Status Colors
        ["status-compliant"]: {
          DEFAULT: "hsl(var(--status-compliant))",
          foreground: "hsl(var(--status-compliant-foreground))",
        },
        ["status-due-soon"]: {
          DEFAULT: "hsl(var(--status-due-soon))",
          foreground: "hsl(var(--status-due-soon-foreground))",
        },
        ["status-non-compliant"]: {
          DEFAULT: "hsl(var(--status-non-compliant))",
          foreground: "hsl(var(--status-non-compliant-foreground))",
        },
        ["status-never"]: {
          DEFAULT: "hsl(var(--status-never))",
          foreground: "hsl(var(--status-never-foreground))",
        },

        urgent: {
          DEFAULT: "hsl(var(--urgent))",
          foreground: "hsl(var(--urgent-foreground))",
        },
        important: {
          DEFAULT: "hsl(var(--important))",
          foreground: "hsl(var(--important-foreground))",
        },
        pending: {
          DEFAULT: "hsl(var(--pending))",
          foreground: "hsl(var(--pending-foreground))",
        },

        ["status-new"]: {
          DEFAULT: "hsl(var(--status-new))",
          foreground: "hsl(var(--status-new-foreground))",
        },
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.2)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "pop-once": "pop 600ms ease-out forwards",
      },
    },
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "1920px",
      "4xl": "2560px",
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
