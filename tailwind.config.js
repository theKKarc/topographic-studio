/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          50: '#FAF6F0',
          100: '#F0E6D8',
          200: '#E8D4B8',
          300: '#D4A574',
          400: '#B8845C',
          500: '#8B6B47',
          600: '#6B5237',
          700: '#4A3825',
          800: '#2E2317',
          900: '#1A1410',
        },
        accent: {
          peach: '#E8B89A',
          terracotta: '#C97A5A',
          cream: '#F5E8D8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}