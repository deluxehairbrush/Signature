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
          DEFAULT: '#C7F464',
          dark: '#9FD230',
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
