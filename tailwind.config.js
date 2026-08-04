/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        ice: {
          50: '#F5FAFC',
          100: '#E8F7FC',
          200: '#C8EDFA',
          300: '#A8E0FF',
          400: '#7FD4F5',
          500: '#5BCEE6',
          600: '#2FB8D8',
          700: '#1E9CBF',
        },
        navy: {
          50: '#E7F3FA',
          100: '#CFE7F5',
          200: '#9FCFEB',
          300: '#6FB7E0',
          400: '#3F9FD6',
          500: '#0B1F33',
          600: '#09182A',
          700: '#071321',
          800: '#050E19',
          900: '#030910',
        },
        frost: '#7FD4F5',
        snow: '#F5FAFC',
        glaceon: '#5BCEE6',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(11, 31, 51, 0.1), 0 2px 4px -2px rgba(11, 31, 51, 0.1)',
        'card-hover': '0 10px 15px -3px rgba(11, 31, 51, 0.15), 0 4px 6px -4px rgba(11, 31, 51, 0.1)',
      },
    },
  },
  plugins: [],
}
