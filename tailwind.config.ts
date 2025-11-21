import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./services/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        nebula: {
          dark: '#050511',
          base: '#0f0c29',
          purple: '#302b63',
          accent: '#b92b27',
          glow: '#00d2ff',
          secondary: '#3a7bd5'
        },
        glass: {
          surface: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
          highlight: 'rgba(255, 255, 255, 0.2)',
          text: 'rgba(255, 255, 255, 0.9)',
          muted: 'rgba(255, 255, 255, 0.5)',
        }
      }
    },
  },
  plugins: [],
};
export default config;