/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        balootamma2: [
          "var(--font-baloo-tamma-2)",
          "var(--font-kannada)",
          "system-ui",
          "sans-serif",
        ],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
        kannada: ["var(--font-kannada)", "system-ui", "sans-serif"],
        manrope: [
          "var(--font-manrope)",
          "var(--font-kannada)",
          "system-ui",
          "sans-serif",
        ],
        roboto: ["var(--font-roboto)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
