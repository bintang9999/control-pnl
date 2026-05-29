/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1120',
        card: '#111827',
        primary: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#1D4ED8',
          foreground: '#FFFFFF',
        },
        glass: 'rgba(17, 24, 39, 0.7)',
        glassBorder: 'rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(to bottom right, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8))',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        'glass': '10px',
      }
    },
  },
  plugins: [],
}
