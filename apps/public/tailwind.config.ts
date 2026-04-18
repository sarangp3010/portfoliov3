import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: '#6366f1', dark: '#4f46e5', light: '#818cf8' },
        surface: {
          50: '#f8faff', 100: '#f1f4ff', 200: '#e4e9ff',
          900: '#0a0d1a', 950: '#03050f',
        },
        glow: { purple: '#6366f1', blue: '#3b82f6', cyan: '#06b6d4' },
      },
      fontFamily: {
        sans:    ['Outfit', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Syne', 'Outfit', 'sans-serif'],
      },
      animation: {
        'fade-up':      'fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards',
        'fade-in':      'fadeIn 0.5s ease forwards',
        'slide-in':     'slideIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
        'float':        'float 6s ease-in-out infinite',
        'float-slow':   'float 9s ease-in-out infinite',
        'pulse-glow':   'pulseGlow 3s ease-in-out infinite',
        'grid-flow':    'gridFlow 20s linear infinite',
        'gradient-x':   'gradientX 8s ease infinite',
        'spin-slow':    'spin 20s linear infinite',
        'orbit':        'orbit 12s linear infinite',
      },
      keyframes: {
        fadeUp:     { from: { opacity: '0', transform: 'translateY(28px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn:    { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        float:      { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-14px)' } },
        pulseGlow:  { '0%,100%': { opacity: '0.4', transform: 'scale(1)' }, '50%': { opacity: '0.8', transform: 'scale(1.05)' } },
        gridFlow:   { from: { backgroundPosition: '0 0' }, to: { backgroundPosition: '60px 60px' } },
        gradientX:  { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        orbit:      { from: { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' }, to: { transform: 'rotate(360deg) translateX(120px) rotate(-360deg)' } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grid-pattern':    'linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)',
      },
      boxShadow: {
        'glow-sm':  '0 0 20px rgba(99,102,241,0.15)',
        'glow':     '0 0 40px rgba(99,102,241,0.2)',
        'glow-lg':  '0 0 80px rgba(99,102,241,0.25)',
        'glow-xl':  '0 0 120px rgba(99,102,241,0.3)',
        'float':    '0 32px 64px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.1)',
        'card-3d':  '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
} satisfies Config;
