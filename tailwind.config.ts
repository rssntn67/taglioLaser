import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        ink: '#111111',
        mist: '#f5f5f5',
        border: '#eeeeee',
      },
    },
  },
  plugins: [],
};

export default config;
