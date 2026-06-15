/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'canara-blue': '#0047AB',
        'canara-green': '#00A86B',
        'canara-orange': '#FF6B35',
        'canara-red': '#DC2626',
        'canara-primary': '#0047AB',
        'canara-success': '#00A86B',
        'canara-danger': '#DC2626',

        // Cybersecurity Command Center Colors
        'obsidian': {
          950: '#06091a',
          955: '#040714',
          900: '#0a0e27',
          800: '#0f1333',
          700: '#141939',
          600: '#1a1f3a',
          500: '#202540',
          400: '#262b47',
        },
        'cyber': {
          cyan: '#00d9ff',
          'cyan-light': '#00f0ff',
          'cyan-dark': '#00b8ff',
          blue: '#0088ff',
          'blue-light': '#0099ff',
          'blue-dark': '#005aff',
          green: '#00ff88',
          magenta: '#ff00ff',
          'magenta-light': '#ff33ff',
          'magenta-dark': '#cc00cc',
        },
        'glow': {
          cyan: 'rgba(0, 217, 255, 0.6)',
          blue: 'rgba(0, 136, 255, 0.6)',
          green: 'rgba(0, 255, 136, 0.6)',
          magenta: 'rgba(255, 0, 255, 0.6)',
          red: 'rgba(255, 0, 0, 0.6)',
        },

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'glow-cyan': '0 0 10px 2px rgba(0, 217, 255, 0.3), 0 0 20px rgba(0, 217, 255, 0.2)',
        'glow-cyan-intense': '0 0 15px 3px rgba(0, 217, 255, 0.5), 0 0 30px rgba(0, 217, 255, 0.3)',
        'glow-blue': '0 0 10px 2px rgba(0, 136, 255, 0.3), 0 0 20px rgba(0, 136, 255, 0.2)',
        'glow-blue-intense': '0 0 15px 3px rgba(0, 136, 255, 0.5), 0 0 30px rgba(0, 136, 255, 0.3)',
        'glow-green': '0 0 10px 2px rgba(0, 255, 136, 0.3), 0 0 20px rgba(0, 255, 136, 0.2)',
        'glow-magenta': '0 0 10px 2px rgba(255, 0, 255, 0.3), 0 0 20px rgba(255, 0, 255, 0.2)',
        'glow-red': '0 0 10px 2px rgba(255, 0, 0, 0.3), 0 0 20px rgba(255, 0, 0, 0.2)',
        'glow-red-intense': '0 0 15px 3px rgba(255, 0, 0, 0.5), 0 0 30px rgba(255, 0, 0, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-flicker': 'glow-flicker 3s ease-in-out infinite',
        'scan-lines': 'scan-lines 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'glitch': 'glitch 2s ease-in-out infinite',
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px 2px rgba(0, 217, 255, 0.5)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 20px 4px rgba(0, 217, 255, 0.3)' },
        },
        'glow-flicker': {
          '0%, 18%, 22%, 25%, 54%, 56%, 100%': { opacity: '1' },
          '20%, 24%, 55%': { opacity: '0.5' },
        },
        'scan-lines': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glitch': {
          '0%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-2px)' },
          '40%': { transform: 'translateX(2px)' },
          '60%': { transform: 'translateX(-1px)' },
          '80%': { transform: 'translateX(1px)' },
          '100%': { transform: 'translateX(0)' },
        },
        'neon-pulse': {
          '0%, 100%': { opacity: '1', textShadow: '0 0 10px currentColor' },
          '50%': { opacity: '0.8', textShadow: '0 0 20px currentColor' },
        },
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
}
