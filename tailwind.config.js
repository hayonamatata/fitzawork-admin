/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#6EC8F8", dark: "#4AAFEB", mid: "#8DD4FA", light: "#E0F4FE" }
      }
    }
  },
  plugins: []
}
