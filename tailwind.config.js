/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#2D4A3E", dark: "#1e3329", mid: "#3D6B5C", light: "#D4EFDF" }
      }
    }
  },
  plugins: []
}
