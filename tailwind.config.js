/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas:         'rgb(var(--canvas) / <alpha-value>)',
        surface:        'rgb(var(--surface) / <alpha-value>)',
        'surface-soft': 'rgb(var(--surface-soft) / <alpha-value>)',
        elevated:       'rgb(var(--elevated) / <alpha-value>)',

        line:           'rgb(var(--line) / <alpha-value>)',
        'line-strong':  'rgb(var(--line-strong) / <alpha-value>)',

        ink:            'rgb(var(--ink) / <alpha-value>)',
        muted:          'rgb(var(--muted) / <alpha-value>)',
        subtle:         'rgb(var(--subtle) / <alpha-value>)',

        brand:          'rgb(var(--brand) / <alpha-value>)',
        'brand-soft':   'rgb(var(--brand-soft) / <alpha-value>)',
        accent:         'rgb(var(--accent) / <alpha-value>)',
        'accent-soft':  'rgb(var(--accent-soft) / <alpha-value>)',

        success:        'rgb(var(--success) / <alpha-value>)',
        'success-soft': 'rgb(var(--success-soft) / <alpha-value>)',
        warning:        'rgb(var(--warning) / <alpha-value>)',
        'warning-soft': 'rgb(var(--warning-soft) / <alpha-value>)',
        danger:         'rgb(var(--danger) / <alpha-value>)',
        'danger-soft':  'rgb(var(--danger-soft) / <alpha-value>)',
        info:           'rgb(var(--info) / <alpha-value>)',
        'info-soft':    'rgb(var(--info-soft) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.6875rem',
      },
    },
  },
  plugins: [],
}