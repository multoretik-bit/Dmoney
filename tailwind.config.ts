import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0b0e",
        surface: "#131519",
        "surface-raised": "#191b21",
        "surface-sunken": "rgba(255,255,255,0.03)",
        card: "#131519",
        "card-elevated": "#191b21",
        accent: "#3b82f6",
        "accent-light": "#60a5fa",
        "accent-dim": "rgba(59,130,246,0.14)",
        textMain: "#F5F6F7",
        textMuted: "#9096A2",
        textSubtle: "#5B616D",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#f43f5e",
        violet: "#8b5cf6",
        "violet-dim": "rgba(139,92,246,0.14)",
      },
      borderRadius: {
        'lg': '14px',
        'xl': '16px',
        '2xl': '18px',
        '3xl': '22px',
        '4xl': '26px',
        '5xl': '30px',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0,0,0,0.3), 0 12px 24px -16px rgba(0,0,0,0.5)',
        'card-lg': '0 24px 48px -16px rgba(0,0,0,0.55)',
        'sheet': '0 -8px 40px rgba(0,0,0,0.5)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'fade-in': 'fade-in 0.25s ease-out',
        'scale-in': 'scale-in 0.18s ease-out',
      },
    },
  },
  plugins: [],
};
export default config;
