export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['DM Sans', 'system-ui', 'sans-serif'] },
      colors: {
        primary: {
          50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
          400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
          800: '#115e59', 900: '#134e4a'
        }
      },
      boxShadow: {
        'teal-sm': '0 1px 3px 0 rgb(13 148 136 / 0.15)',
        'teal-md': '0 4px 16px 0 rgb(13 148 136 / 0.18)',
        'teal-lg': '0 10px 40px 0 rgb(13 148 136 / 0.15)'
      }
    }
  },
  plugins: []
};
