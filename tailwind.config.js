/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                canvas: 'var(--color-canvas)',
                surface: {
                    DEFAULT: 'var(--color-surface)',
                    muted: 'var(--color-surface-muted)',
                    elevated: 'var(--color-surface-elevated)',
                },
                ink: {
                    DEFAULT: 'var(--color-ink)',
                    muted: 'var(--color-ink-muted)',
                    subtle: 'var(--color-ink-subtle)',
                    inverted: 'var(--color-ink-inverted)',
                },
                stroke: {
                    DEFAULT: 'var(--color-stroke)',
                    subtle: 'var(--color-stroke-subtle)',
                    emphasis: 'var(--color-stroke-emphasis)',
                },
                status: {
                    ready: 'var(--color-status-ready)',
                    active: 'var(--color-status-active)',
                    warning: 'var(--color-status-warning)',
                    error: 'var(--color-status-error)',
                },
                accent: 'var(--color-status-active)',
            },

            // === TIPOGRAFÍA ===
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['"SF Mono"', '"Fira Code"', 'monospace'],
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
            },

            // === SOMBRAS ===
            boxShadow: {
                'subtle': 'var(--shadow-subtle)',
                'base': 'var(--shadow-base)',
                'elevated': 'var(--shadow-elevated)',
                'glow': 'var(--shadow-glow)',
                'glow-active': 'var(--shadow-glow-active)',
            },

            // === ANIMACIONES ===
            animation: {
                'reveal': 'reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'fade-in': 'fadeIn 0.4s ease-out forwards',
                'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'pop-in': 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
            },

            keyframes: {
                reveal: {
                    '0%': { opacity: '0', transform: 'translateY(12px)' },
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
                popIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                pulseGlow: {
                    '0%, 100%': { opacity: '1', boxShadow: '0 0 20px var(--color-accent-glow)' },
                    '50%': { opacity: '0.7', boxShadow: '0 0 10px var(--color-accent-glow)' },
                }
            },

            // === TRANSICIONES ===
            transitionDuration: {
                'fast': '150ms',
                'normal': '300ms',
                'slow': '500ms',
                'reveal': '700ms',
            },

            transitionTimingFunction: {
                'expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
