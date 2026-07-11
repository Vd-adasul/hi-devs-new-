/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Editorial-luxe obsidian scale (dark). These are the *raw* palette
        // colors. The semantic tokens below (background, card, border…) also
        // resolve to these via CSS variables so future re-themes stay easy.
        obsidian: {
          50:  '#e8ebf1',
          100: '#c6cddb',
          200: '#8b95ad',
          300: '#5b6786',
          400: '#374262',
          500: '#1E293B',   // ink
          600: '#141b2c',
          700: '#0D1322',   // paper (card)
          800: '#0A0F1C',   // deep paper
          900: '#060913',   // default background
          950: '#03050c',   // deepest well
        },
        // Brass / gold accent scale — sparingly used
        brass: {
          50:  '#fbf7ea',
          100: '#f6ecc1',
          200: '#efd989',
          300: '#e5c158',
          400: '#D4AF37',   // main brass
          500: '#B5955C',   // brushed brass
          600: '#9E8022',
          700: '#7c651a',
          800: '#5b4a17',
          900: '#3d3211',
        },
        // Semantic tokens (CSS-var backed) — keep app-wide styles portable
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'ui-serif', 'Georgia', 'serif'],
        display: ['"Cormorant Garamond"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        'editorial': '-0.02em',
        'overline': '0.22em',
      },
      boxShadow: {
        'glow-brass': '0 0 24px -4px rgba(212, 175, 55, 0.35), 0 0 8px -2px rgba(212, 175, 55, 0.2)',
        'glow-brass-lg': '0 20px 60px -20px rgba(212, 175, 55, 0.45), 0 0 24px -6px rgba(212, 175, 55, 0.25)',
        'ink': '0 10px 40px -10px rgba(0, 0, 0, 0.7), 0 2px 8px -2px rgba(0, 0, 0, 0.4)',
        'ink-lg': '0 30px 80px -20px rgba(0, 0, 0, 0.8), 0 8px 24px -6px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'brass-gradient': 'linear-gradient(135deg, #F3D573 0%, #D4AF37 40%, #B5955C 100%)',
        'brass-shine': 'linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0) 100%)',
        'obsidian-vignette': 'radial-gradient(ellipse at center, transparent 0%, rgba(6, 9, 19, 0.6) 60%, rgba(6, 9, 19, 1) 100%)',
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up': 'fadeUp 700ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 800ms ease-out both',
        'shimmer': 'shimmer 3.5s linear infinite',
        'marquee': 'marquee 45s linear infinite',
        'pulse-brass': 'pulseBrass 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseBrass: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 175, 55, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(212, 175, 55, 0)' },
        },
      },
    },
  },
  plugins: [],
}
