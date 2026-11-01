/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7FBF9',
        foreground: '#2E3A3A',
        muted: '#5B6B68',
        teal: {
          dark: '#1F5F55',
          primary: '#1F5F55',
          light: '#2B8376',
          surface: '#EBF5F2',
        },
        coral: {
          primary: '#D9694A',
          hover: '#C2573A',
          light: '#FCECE8',
        },
        pastel: {
          mint: '#D6EFE3',
          peach: '#FFE2D1',
          lavender: '#E4DEF7',
          sky: '#D6E9F8',
          butter: '#FFF0B8',
          pink: '#FBD9E3',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'Noto Sans Devanagari', 'sans-serif'],
        body: ['Nunito', 'Noto Sans Devanagari', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
    },
  },
  plugins: [],
}
