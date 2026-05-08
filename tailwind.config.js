/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: 'class',
  theme: {
    screens: {
      xs: '0',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    fontFamily: {
      display: ['var(--font-display)', 'Cormorant Garamond', 'Tiempos Headline', 'Garamond', 'Times New Roman', 'serif'],
      body: ['var(--font-body)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
    },
    borderRadius: {
      'none': '0',
      'xs': '4px',
      'sm': '6px',
      'md': '8px',
      'lg': '12px',
      'xl': '16px',
      'pill': '9999px',
      'full': '9999px',
    },
    borderWidth: {
      default: '1px',
      '0': '0',
      '2': '2px',
      '4': '4px',
    },
    extend: {
      colors: {
        // Brand & Accent
        primary: '#cc785c',
        'primary-active': '#a9583e',
        'primary-disabled': '#e6dfd8',
        'accent-teal': '#5db8a6',
        'accent-amber': '#e8a55a',
        // Surface
        canvas: '#faf9f5',
        'surface-soft': '#f5f0e8',
        'surface-card': '#efe9de',
        'surface-cream-strong': '#e8e0d2',
        'surface-dark': '#181715',
        'surface-dark-elevated': '#252320',
        'surface-dark-soft': '#1f1e1b',
        // Text
        ink: '#141413',
        'body-strong': '#252523',
        body: '#3d3d3a',
        muted: '#6c6a64',
        'muted-soft': '#8e8b82',
        'on-primary': '#ffffff',
        'on-dark': '#faf9f5',
        'on-dark-soft': '#a09d96',
        // Borders
        hairline: '#e6dfd8',
        'hairline-soft': '#ebe6df',
        // Semantic
        success: '#5db872',
        warning: '#d4a017',
        error: '#c64545',
      },
      spacing: {
        'section': '6rem',
        '96': '24rem',
        '128': '32rem',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(20, 20, 19, 0.08)',
        'medium': '0 4px 25px -5px rgba(20, 20, 19, 0.1), 0 10px 30px -5px rgba(20, 20, 19, 0.04)',
      },
    },
    future: {
      removeDeprecatedGapUtilities: true,
      purgeLayersByDefault: true,
    },
  },
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}'
  ],
  plugins: [],
}
