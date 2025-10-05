/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Helvetica Neue','Helvetica','Arial','ui-sans-serif','system-ui','sans-serif'],
      },
    },
  },
  plugins: [],
}
