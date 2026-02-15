import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
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
        // Semantic colors
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        // Whiskey-specific palette for direct use
        amber: {
          50: "hsl(40, 60%, 97%)",
          100: "hsl(38, 55%, 92%)",
          200: "hsl(36, 55%, 82%)",
          300: "hsl(34, 55%, 70%)",
          400: "hsl(32, 60%, 55%)",
          500: "hsl(30, 75%, 45%)",
          600: "hsl(28, 80%, 38%)",
          700: "hsl(26, 75%, 30%)",
          800: "hsl(24, 70%, 22%)",
          900: "hsl(22, 65%, 14%)",
          950: "hsl(20, 60%, 8%)",
        },
        copper: {
          50: "hsl(25, 50%, 95%)",
          100: "hsl(24, 48%, 88%)",
          200: "hsl(22, 45%, 75%)",
          300: "hsl(20, 42%, 60%)",
          400: "hsl(18, 50%, 48%)",
          500: "hsl(16, 55%, 40%)",
          600: "hsl(14, 52%, 32%)",
          700: "hsl(12, 48%, 25%)",
          800: "hsl(10, 45%, 18%)",
          900: "hsl(8, 40%, 12%)",
        },
        // Chart colors - warm palette
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
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        heading: ['DM Serif Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
      boxShadow: {
        "warm-sm": "0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px 0 rgb(120 80 40 / 0.05)",
        "warm": "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(120 80 40 / 0.07)",
        "warm-md": "0 6px 12px -2px rgb(0 0 0 / 0.08), 0 3px 6px -3px rgb(120 80 40 / 0.08)",
        "warm-lg": "0 10px 20px -3px rgb(0 0 0 / 0.1), 0 4px 8px -4px rgb(120 80 40 / 0.1)",
        "warm-xl": "0 20px 40px -5px rgb(0 0 0 / 0.12), 0 8px 16px -8px rgb(120 80 40 / 0.12)",
        "glow": "0 0 20px rgb(var(--primary) / 0.3)",
        "glow-lg": "0 0 40px rgb(var(--primary) / 0.4)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
