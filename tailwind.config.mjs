/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecf9ff",
          100: "#d7f0ff",
          200: "#b3e1ff",
          300: "#80ccff",
          400: "#4db3ff",
          500: "#1f99ff",
          600: "#0b79db",
          700: "#075fae",
          800: "#064c8a",
          900: "#063f71"
        }
      }
    }
  },
  plugins: []
};

export default config;

