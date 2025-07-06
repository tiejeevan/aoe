import type {Config} from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Cinzel', 'serif'],
        'sans': ['Quattrocento Sans', 'sans-serif'],
      },
      colors: {
        parchment: {
          light: '#fdf6e3',
          DEFAULT: '#fbf1c7',
          dark: '#ebdbb2',
        },
        stone: {
          light: '#665c54',
          DEFAULT: '#504945',
          dark: '#3c3836',
        },
        brand: {
          red: '#cc241d',
          green: '#98971a',
          blue: '#458588',
          gold: '#d79921',
        }
      },
      keyframes: {
        'fade-up-out': {
            '0%': { transform: 'translateY(0)', opacity: '1' },
            '100%': { transform: 'translateY(-20px)', opacity: '0' },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        'fade-up-out': 'fade-up-out 1.5s ease-out forwards',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
