/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#090A0F',
        surface: '#14161D',
        border: '#F4F4F6',
        primaryText: '#FFFFFF',
        secondaryText: '#94A3B8',
        aiPurple: '#8B5CF6',
        groupBlue: '#3B82F6',
        presenceGreen: '#22C55E',
        warning: '#F59E0B',
        offline: '#6B7280',
      },
      fontFamily: {
        sans: ['"Geist Variable"', 'sans-serif'],
        mono: ['"Geist Variable"', 'monospace'],
      },
      boxShadow: {
        brutal: '3px 3px 0 0 #FFFFFF',
        group: '4px 4px 0 0 #3B82F6',
        ai: '4px 4px 0 0 #8B5CF6',
        panel: '4px 4px 0 0 #F4F4F6',
      },
      transitionDuration: {
        175: '175ms',
      },
    },
  },
  plugins: [],
};
