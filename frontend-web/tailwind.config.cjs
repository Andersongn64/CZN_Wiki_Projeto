/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx,html}',
    './frontend-admin/**/*.html',
  ],
  darkMode: 'class',
  safelist: [
    'bg-blue-600',
    'bg-green-600',
    'text-red-500',
    {
      pattern: /bg-(blue|green|red)-(400|500|600|700)/,
      variants: ['hover', 'focus', 'dark'],
    },
  ],
  theme: {
    extend: {
      colors: {
        'chaos-dark':    '#1a1a2e',
        'chaos-primary': '#e94560',
        'chaos-accent':  '#0f3460',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      screens: {
        'xs':  '480px',
        '3xl': '1600px',
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-in-out',
        'fade-in-slow': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};