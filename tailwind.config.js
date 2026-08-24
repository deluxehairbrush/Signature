/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#12120D',
          soft: '#2A2A22',
        },
        paper: {
          DEFAULT: '#F6F4EC',
          dim: '#EDEADD',
        },
        accent: {
          DEFAULT: '#86C22A',
          dark: '#6FA31E',
          soft: '#F3F7A8',
        },
        signal: {
          DEFAULT: '#7C3AED',
          dark: '#5B21B6',
        },
        muted: '#7A796C',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        pill: '999px',
      },
    },
  },
  plugins: [],
}
