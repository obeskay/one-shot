/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // === COLORES ===
            colors: {
                // Core Mappings (generic aliases used in components)
                background: 'var(--color-canvas)',
                border: 'var(--color-stroke)',
                primary: 'var(--color-ink)',     // Used for main text, active states
                secondary: 'var(--color-ink-muted)', // Used for secondary text
                accent: 'var(--color-status-active)',

                // Superficies
                canvas: 'var(--color-canvas)',
                surface: {
                    DEFAULT: 'var(--color-surface)',
                    muted: 'var(--color-surface-muted)',
                    elevated: 'var(--color-surface-elevated)',
                },

                // Dark specific (legacy)
                dark: {
                    DEFAULT: 'var(--color-dark)',
                    surface: 'var(--color-dark-surface)',
                    muted: 'var(--color-dark-muted)',
                },

                // Texto & Elementos
                ink: {
                    DEFAULT: 'var(--color-ink)',
                    muted: 'var(--color-ink-muted)',
                    subtle: 'var(--color-ink-subtle)',
                    inverted: 'var(--color-ink-inverted)',
                },

                // Bordes
                stroke: {
                    DEFAULT: 'var(--color-stroke)',
                    subtle: 'var(--color-stroke-subtle)',
                    emphasis: 'var(--color-stroke-emphasis)',
                    dark: 'var(--color-stroke-dark)',
                },

                // Semánticos
                status: {
                    ready: 'var(--color-status-ready)',
                    active: 'var(--color-status-active)',
                    warning: 'var(--color-status-warning)',
                    error: 'var(--color-status-error)',
                },

                // Legacy aliases
                ash: 'var(--color-ash)',
                smoke: 'var(--color-smoke)',
            },

            // === TIPOGRAFÍA ===
            fontFamily: {
                sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
                mono: ['"SF Mono"', '"Fira Code"', 'Consolas', 'monospace'],
            },

            fontSize: {
                'display': ['clamp(2.5rem, 6vw, 4.5rem)', {
                    lineHeight: '0.9',
                    letterSpacing: '-0.025em',
                    fontWeight: '600'
                }],
                'h1': ['clamp(1.875rem, 4vw, 2.5rem)', {
                    lineHeight: '1.1',
                    letterSpacing: '-0.02em',
                    fontWeight: '600'
                }],
                'h2': ['1.25rem', {
                    lineHeight: '1.25',
                    letterSpacing: '-0.015em',
                    fontWeight: '500'
                }],
                'body': ['0.875rem', {
                    lineHeight: '1.6',
                    letterSpacing: '0.01em',
                    fontWeight: '400'
                }],
                'micro': ['0.625rem', {
                    lineHeight: '1.4',
                    letterSpacing: '0.1em',
                    fontWeight: '500'
                }],
            },

            letterSpacing: {
                tighter: '-0.05em',
                tight: '-0.025em',
                normal: '0em',
                wide: '0.025em',
                wider: '0.05em',
                widest: '0.1em',
            },

            // === BORDER RADIUS ===
            borderRadius: {
                'subtle': '4px',
                'base': '8px',
                'medium': '12px',
                'large': '16px',
                'xl': '24px',
                'pill': '9999px',
                'organic-sm': '20px',
                'organic': '40px',
                'organic-lg': '80px',
            },

            // === SOMBRAS ===
            boxShadow: {
                'subtle': '0 1px 2px rgba(0,0,0,0.04)',
                'base': '0 2px 8px rgba(0,0,0,0.06)',
                'elevated': '0 4px 16px rgba(0,0,0,0.08)',
                'prominent': '0 8px 32px rgba(0,0,0,0.12)',
                'float': '0 12px 40px rgba(0,0,0,0.15)',
                'slide-up': '0 -50px 100px -20px rgba(0,0,0,0.3)',
            },

            // === ANIMACIONES ===
            animation: {
                'reveal': 'reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'fade-in': 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
            },

            keyframes: {
                reveal: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseSubtle: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.6' },
                },
            },

            // === TRANSICIONES ===
            transitionDuration: {
                'fast': '150ms',
                'normal': '300ms',
                'slow': '500ms',
                'reveal': '700ms',
            },

            transitionTimingFunction: {
                'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
                'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
                'enter': 'cubic-bezier(0, 0, 0.2, 1)',
                'exit': 'cubic-bezier(0.4, 0, 1, 1)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
