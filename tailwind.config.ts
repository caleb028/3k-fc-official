import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        club: {
          primary: 'var(--club-primary, #E11D2A)',
          primaryDark: 'var(--club-primary-dark, #B91C1C)',
          secondary: 'var(--club-secondary, #0E4494)',
          secondaryDark: 'var(--club-secondary-dark, #0A2E68)',
          red: 'var(--club-red, #E11D2A)',
          redDark: 'var(--club-red-dark, #B91C1C)',
          blue: 'var(--club-blue, #0E4494)',
          blueDark: 'var(--club-blue-dark, #0A2E68)',
          accent: 'var(--club-accent, #D4AF37)',
          gold: 'var(--club-gold, #D4AF37)',
          surfaceLight: 'var(--surface-light, #FFFFFF)',
          surfaceOffwhite: 'var(--surface-offwhite, #F4F7FB)',
          surfaceDark: 'var(--surface-dark, #081326)',
          surfaceCardDark: 'var(--surface-card-dark, #0E1E3A)',
          muted: 'var(--text-muted, #64748B)',
          border: 'var(--border-subtle, #E2E8F0)',
          success: '#15803D',
          warning: '#D97706',
          error: '#DC2626',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Rubik', 'Nunito', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'Rubik', 'Nunito', 'system-ui', 'sans-serif'],
        condensed: ['var(--font-display)', 'Rubik', 'Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
