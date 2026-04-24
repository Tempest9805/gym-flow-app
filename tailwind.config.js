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
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#bae0ff',
          300: '#7cc8ff',
          400: '#36adff',
          500: '#0090f0',
          600: '#0072cd',
          700: '#005aa6',
          800: '#004d89',
          900: '#004071',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f8f9fa',
          tertiary: '#f1f3f5',
        },
        text: {
          primary: '#1a1a2e',
          secondary: '#6c757d',
          inverse: '#ffffff',
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
