/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
    theme: {
    extend: {
      colors: {
        brown: {
          50: '#fdfbf7',
          100: '#f9f3e9',
          500: '#8b5a2b', 
          800: '#5C4033', // Your Primary Deep Brown
          900: '#3e2a21', // Darker Deep Brown for hover states
        },
        cream: {
          50: '#FFFDD0', // Your Secondary Cream
          100: '#fdf5e6', // Old Lace (slightly darker cream for backgrounds)
          200: '#faebd7', // Antique White
        }
      }
    },
  },
  plugins: [],
}