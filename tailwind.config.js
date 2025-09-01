/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fuel: {
          full: '#22c55e',
          medium: '#f59e0b',
          low: '#ef4444',
          empty: '#991b1b'
        },
        dark: {
          bg: '#111827',
          card: '#1f2937',
          border: '#374151'
        }
      }
    }
  },
  plugins: []
}