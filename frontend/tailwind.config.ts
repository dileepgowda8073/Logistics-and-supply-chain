import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#e8eaf2',
          100: '#c5cade',
          200: '#9ea6c8',
          300: '#7782b2',
          400: '#5a67a2',
          500: '#3d4d92',
          600: '#2e3a75',
          700: '#1e2758',
          800: '#111830',
          900: '#0d1220',
          950: '#0A0E1A',
        },
        teal: {
          DEFAULT: '#00E5C3',
          dark: '#009e8c',
          50:  '#e0fdf9',
          100: '#ccfbf4',
          200: '#99f6ea',
          300: '#5eead7',
          400: '#2dd4bf',
          500: '#00E5C3',
          600: '#00bfa8',
          700: '#009e8c',
          800: '#007d6e',
          900: '#005c50',
        },
        'sw-amber': {
          DEFAULT: '#F59E0B',
          light: '#FCD34D',
          dark:  '#B45309',
        },
        'sw-red': {
          DEFAULT: '#EF4444',
          light: '#FCA5A5',
          dark:  '#B91C1C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-ring':    'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
        'slide-in-right':'slide-in-right 0.4s ease-out forwards',
        'count-up':      'count-up 0.6s ease-out forwards',
        'bounce-in':     'bounce-in 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards',
        'fade-in':       'fade-in 0.3s ease-out forwards',
        'glow-pulse':    'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%':   { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        'count-up': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bounce-in': {
          '0%':   { transform: 'scale(0.3)', opacity: '0' },
          '50%':  { transform: 'scale(1.1)' },
          '70%':  { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(0,229,195,0.4)' },
          '50%':      { boxShadow: '0 0 20px 6px rgba(0,229,195,0.7)' },
        },
      },
      boxShadow: {
        'teal-glow':  '0 0 20px rgba(0,229,195,0.35)',
        'amber-glow': '0 0 20px rgba(245,158,11,0.35)',
        'red-glow':   '0 0 20px rgba(239,68,68,0.35)',
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

export default config
