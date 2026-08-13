/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ash: {
          950: '#050507',
          900: '#08080c',
          850: '#0c0c12',
          800: '#111118',
          700: '#1a1a24',
          600: '#25252f',
          500: '#3a3a48',
          400: '#5a5a6e',
          300: '#8b8ba0',
          200: '#b8b8c8',
          100: '#e0e0ea',
          50: '#f4f4f8',
        },
        coral: {
          500: '#FF496C',
          400: '#FF6B85',
          300: '#FF8FA3',
        },
        ultraviolet: {
          500: '#8B5CF6',
          400: '#A78BFA',
          300: '#C4B5FD',
        },
        cyan: {
          500: '#22D3EE',
          400: '#67E8F9',
          300: '#A5F3FC',
        },
        lime: {
          500: '#C7F464',
          400: '#D9FA7E',
          300: '#E8FFA6',
        },
      },
      fontFamily: {
        display: ['Syncopate', 'sans-serif'],
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        'ultra-wide': '0.2em',
        'mega': '0.3em',
      },
    },
  },
  plugins: [],
};
