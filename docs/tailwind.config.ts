import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: '#0f172a',
        sky: '#38bdf8',
        sand: '#fcd34d'
      }
    }
  },
  plugins: []
};

export default config;
