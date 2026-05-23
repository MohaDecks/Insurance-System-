/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef8ff",
          100: "#d9efff",
          500: "#0b84ff",
          600: "#006ae6",
          700: "#0054b8",
          900: "#0a2341",
        },
      },
    },
  },
  plugins: [],
};
