/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        primary: {
          DEFAULT: "#2F8F9D",
          dark: "#256E78",
          soft: "#E8F4F6"
        },
        secondary: "#5B667A",
        ink: "#0F172A",
        mist: "#F4F7F9",
        success: "#22c55e",
        danger: "#ef4444"
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
