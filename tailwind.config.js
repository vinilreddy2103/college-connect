/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6366f1',    // Indigo
          secondary: '#d946ef',  // Fuchsia
          accent: '#f97316',     // Orange
        },
        surface: {
          DEFAULT: 'rgba(30, 41, 59, 0.5)',  // slate-800/50
          solid: '#1e293b',                   // slate-800
          dark: '#0f172a',                    // slate-900
          darker: '#020617',                  // slate-950
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6366f1 0%, #d946ef 50%, #f97316 100%)',
        'gradient-brand-horizontal': 'linear-gradient(90deg, #6366f1 0%, #d946ef 50%, #f97316 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(217, 70, 239, 0.1) 50%, rgba(249, 115, 22, 0.1) 100%)',
        'gradient-glow': 'radial-gradient(ellipse at center, rgba(217, 70, 239, 0.15) 0%, transparent 70%)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'heart-beat': 'heartBeat 0.3s ease-in-out',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(217, 70, 239, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(217, 70, 239, 0.5)' },
        },
        heartBeat: {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.2)' },
          '50%': { transform: 'scale(1)' },
          '75%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(217, 70, 239, 0.3)',
        'glow-lg': '0 0 40px rgba(217, 70, 239, 0.4)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.25)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
}

