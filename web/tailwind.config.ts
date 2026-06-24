import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0d0d0f',
        surface: '#1a1a1f',
        'surface-2': '#22222a',
        border: 'rgba(255,255,255,0.06)',
        primary: '#7c6af7',
        'primary-hover': '#6b58e8',
        teal: '#22d3a5',
        orange: '#f97316',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}

export default config
