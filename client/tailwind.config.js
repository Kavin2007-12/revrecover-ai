/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rzp: {
          dark: '#0B0E14',
          card: '#131A26',
          border: '#1E293B',
          blue: '#3884F6',
          accent: '#0C66E4',
          gold: '#FFB800',
          green: '#22C55E',
          red: '#EF4444'
        }
      }
    },
  },
  plugins: [],
}
