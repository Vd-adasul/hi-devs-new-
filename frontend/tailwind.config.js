/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--border-color, rgba(255, 255, 255, 0.08))',
        input: 'var(--border-color, rgba(255, 255, 255, 0.08))',
        ring: '#6366f1',
        background: 'var(--background-color, #0b0f19)',
        foreground: 'var(--foreground-color, #f3f4f6)',
        primary: {
          DEFAULT: '#6366f1',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#1e293b',
          foreground: '#f8fafc',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#1e293b',
          foreground: '#94a3b8',
        },
        accent: {
          DEFAULT: '#1e293b',
          foreground: '#f8fafc',
        },
        popover: {
          DEFAULT: 'var(--card-color, #111827)',
          foreground: 'var(--foreground-color, #f3f4f6)',
        },
        card: {
          DEFAULT: 'var(--card-color, #111827)',
          foreground: 'var(--foreground-color, #f3f4f6)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
