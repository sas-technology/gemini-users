import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        sas: {
          blue: '#1a2d58',
          red: '#a0192a',
          yellow: '#fabc00',
          gray: '#d8dadb',
        },
        division: {
          es: '#228ec2',
          ms: '#a0192a',
          hs: '#1a2d58',
          admin: '#6d6f72',
        },
        usage: {
          high: '#ff0000',
          medium: '#ff9900',
          low: '#ffcc00',
          zero: '#28a745',
        },
        gemini: {
          pro: '#c42384',
          basic: '#97999c',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        dashboard: '1600px',
      },
    },
  },
  plugins: [],
};

export default config;
