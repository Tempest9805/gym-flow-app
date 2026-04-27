/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#36adff',
          50: '#e6f4ff',
          100: '#bae0ff',
          200: '#7cc8ff',
          300: '#36adff',
          400: '#0090f0',
          500: '#0072cd',
          600: '#005aa6',
          700: '#004d89',
          800: '#004d89',
          900: '#00335c',
        },
        background: '#0d0d0d',
        surface: {
          DEFAULT: '#1a1a1a',
          primary: '#1a1a1a',
          secondary: '#262626',
          tertiary: '#333333',
        },
        card: '#1f1f1f',
        text: {
          primary: '#ffffff',
          secondary: '#a3a3a3',
          inverse: '#0d0d0d',
        },
        border: {
          DEFAULT: '#333333',
          light: '#404040',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['System'],
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
      },
      spacing: {
        'touch-min': '44px',
      },
    },
  },
  plugins: [],
};