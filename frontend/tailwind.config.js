/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090a0f",
        card: "#12141d",
        "card-hover": "#1a1d2b",
        border: "rgba(255, 255, 255, 0.08)",
        "border-glow": "rgba(99, 102, 241, 0.3)",
        primary: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
          light: "#818cf8"
        },
        instagram: {
          start: "#833ab4",
          middle: "#fd1d1d",
          end: "#fcb045"
        },
        facebook: "#1877f2"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      }
    },
  },
  plugins: [],
}
