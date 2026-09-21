/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0B0F19',
          900: '#111726',
          800: '#171F31',
          700: '#1F2A40',
        },
        gold: '#D4AF37',
      },
      boxShadow: {
        card: '0 10px 30px -10px var(--shadow-color)',
      },
    },
  },
  plugins: [],
}
