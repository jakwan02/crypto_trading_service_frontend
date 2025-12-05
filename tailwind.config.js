/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0d1117',
        card: '#161b22',
        primary: '#1f6feb',
        success: '#3fb950',
        danger: '#e5534b'
      }
    }
  },
  plugins: []
};