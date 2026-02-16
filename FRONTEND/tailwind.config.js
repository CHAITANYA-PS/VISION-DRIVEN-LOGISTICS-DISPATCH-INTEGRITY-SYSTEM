/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
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
        success: {
          DEFAULT: "#10B981",
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#10B981",
          600: "#059669",
        },
        warning: {
          DEFAULT: "#F59E0B",
          50: "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
        },
        danger: {
          DEFAULT: "#EF4444",
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#DC2626",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#ffffff",
        },
        purple: {
          DEFAULT: "#8B5CF6",
          50: "#F5F3FF",
          100: "#EDE9FE",
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        // REFERENCE_UI color tokens
        background: "var(--background, #ffffff)",
        foreground: "var(--foreground, #111827)",
        card: {
          DEFAULT: "var(--card, #ffffff)",
          foreground: "var(--card-foreground, #111827)",
        },
        popover: {
          DEFAULT: "var(--popover, #ffffff)",
          foreground: "var(--popover-foreground, #111827)",
        },
        secondary: {
          DEFAULT: "var(--secondary, #f3f4f6)",
          foreground: "var(--secondary-foreground, #111827)",
        },
        muted: {
          DEFAULT: "var(--muted, #ececf0)",
          foreground: "var(--muted-foreground, #717182)",
        },
        accent: {
          DEFAULT: "var(--accent, #e9ebef)",
          foreground: "var(--accent-foreground, #111827)",
        },
        border: "var(--border, rgba(0, 0, 0, 0.1))",
        input: "var(--input, transparent)",
        ring: "var(--ring, #2563EB)",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },
      borderRadius: {
        DEFAULT: "var(--radius, 0.625rem)",
        sm: "calc(var(--radius, 0.625rem) - 4px)",
        md: "calc(var(--radius, 0.625rem) - 2px)",
        lg: "var(--radius, 0.625rem)",
        xl: "calc(var(--radius, 0.625rem) + 4px)",
      },
      keyframes: {
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out",
      },
    },
  },
  plugins: [],
};
