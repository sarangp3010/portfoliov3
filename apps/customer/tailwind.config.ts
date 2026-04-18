import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent:  { DEFAULT: '#6366f1', dark: '#4f46e5', light: '#818cf8' },
        surface: { 900: '#0a0d1a', 950: '#03050f' },
        glow:    { purple: '#6366f1', blue: '#3b82f6' },
      },
      fontFamily: {
        sans:    ['Outfit', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'Outfit', 'sans-serif'],
      },
      animation: {
        'fade-up':    'fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards',
        'float':      'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float:     { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        pulseGlow: { '0%,100%': { opacity: '0.4' }, '50%': { opacity: '0.8' } },
      },
      boxShadow: {
        'glow':    '0 0 40px rgba(99,102,241,0.2)',
        'card-3d': '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
} satisfies Config;
