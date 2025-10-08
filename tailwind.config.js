/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', '"Courier New"', "monospace"],
      },
      colors: {
        primary: {
          DEFAULT: "#2563eb", // blue-600
          foreground: "#ffffff", // white
        },
        secondary: {
          DEFAULT: "#4f46e5", // indigo-600
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#dc2626", // red-600
          foreground: "#ffffff",
        },
        background: {
          DEFAULT: "#f5f5f5",
          dark: "#000000",
        },
        foreground: {
          DEFAULT: "#18181b",
          dark: "#fafafa",
        },
        input: "#e2e8f0",
        ring: "#1d4ed8",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

