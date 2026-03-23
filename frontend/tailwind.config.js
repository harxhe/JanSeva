/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0b1220",
          800: "#111b2f",
          700: "#1b2741",
          600: "#233150",
        },
        jade: {
          600: "#1aa179",
          500: "#26b389",
          400: "#3fd2a3",
        },
        sun: {
          500: "#f2a93b",
          400: "#ffc069",
        },
        coral: {
          500: "#f06449",
        },
      },
      boxShadow: {
        soft: "0 18px 40px rgba(8, 16, 32, 0.12)",
        card: "0 12px 30px rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
};
