/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          bg: '#ffffff',
          'bg-secondary': '#f7f6f3',
          'bg-hover': '#efefef',
          text: '#37352f',
          'text-secondary': '#787774',
          border: '#e9e9e7',
          accent: '#2383e2',
        },
      },
    },
  },
  plugins: [],
}
