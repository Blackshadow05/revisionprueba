/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8f9ff',
          100: '#e8eaff',
          200: '#c5caff',
          300: '#a2a9ff',
          400: '#7f89ff',
          500: '#5c68ff',
          600: '#3947ff',
          700: '#1627ff',
          800: '#0012f2',
          900: '#000ec5',
        },
      },
    },
  },
  plugins: [],
} 