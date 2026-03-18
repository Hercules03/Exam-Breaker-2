export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        correct: '#22c55e',
        incorrect: '#ef4444',
        warning: '#f97316',
        progressing: '#eab308',
      }
    },
  },
  plugins: [],
}
