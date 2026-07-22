/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Poppins covers Latin glyphs; the browser automatically falls
        // back to Kantumruy Pro for Khmer characters in the same string,
        // so English and Khmer text both render with a matching modern,
        // rounded-geometric feel without needing separate classes.
        sans: [
          "Poppins",
          "Kantumruy Pro",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
