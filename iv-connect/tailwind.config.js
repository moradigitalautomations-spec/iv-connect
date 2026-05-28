/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef3fb',
          100: '#d5e3f5',
          200: '#adc7eb',
          300: '#7aa5dc',
          400: '#4e85cc',
          500: '#2E5496',
          600: '#234280',
          700: '#1a3263',
          800: '#122247',
          900: '#0a132b',
        },
        surface: {
          DEFAULT: '#f8f9fc',
          card:    '#ffffff',
          border:  '#e8ecf2',
        }
      },
    },
  },
  plugins: [],
}
