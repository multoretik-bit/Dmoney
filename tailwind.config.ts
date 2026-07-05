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
        background: "#060B14",
        card: "#0d1626",
        "card-elevated": "#111d30",
        surface: "#0a1020",
        accent: "#3b82f6",
        "accent-light": "#60a5fa",
        "accent-dim": "rgba(59,130,246,0.15)",
        textMain: "#FFFFFF",
        textMuted: "#94a3b8",
        textSubtle: "#475569",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        violet: "#8b5cf6",
        "violet-dim": "rgba(139,92,246,0.15)",
      },
      backgroundImage: {
        "gradient-card": "linear-gradient(145deg, #0d1626 0%, #090e1a 100%)",
        "gradient-card-blue": "linear-gradient(145deg, rgba(30,58,138,0.3) 0%, #090e1a 65%)",
        "gradient-card-purple": "linear-gradient(145deg, rgba(88,28,135,0.3) 0%, #090e1a 65%)",
        "gradient-accent": "linear-gradient(135deg, #3b82f6 0%, #818cf8 100%)",
        "gradient-text": "linear-gradient(135deg, #93c5fd 0%, #60a5fa 50%, #818cf8 100%)",
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '28px',
        '5xl': '36px',
      },
      boxShadow: {
        'glow-blue': '0 0 30px -5px rgba(59,130,246,0.5)',
        'glow-sm': '0 0 15px -4px rgba(59,130,246,0.4)',
        'card': '0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset',
        'card-lg': '0 20px 60px rgba(0,0,0,0.6)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
export default config;
