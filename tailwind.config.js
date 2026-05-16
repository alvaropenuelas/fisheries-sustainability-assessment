/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F2EDE3',
        surface: '#FFFFFF',
        'surface-elevated': '#FBF8F2',
        border: '#E0D9CB',
        teal: {
          dark: '#1B3A4B',
          mid: '#1B3A4B',
          light: '#2C5868',
        },
        muted: '#5A5A55',
        subtle: '#8A8A82',
        cream: '#1A1A18',
        status: {
          collapsed: '#B33A3A',
          overexploited: '#C77D2E',
          depleted: '#D9A856',
          declining: '#6B8FAE',
          stable: '#4A8B6F',
          recovering: '#2C6E4F',
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
