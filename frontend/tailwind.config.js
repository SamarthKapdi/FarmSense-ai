module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    darkMode: ["class", '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "var(--primary)",
                    dark: "var(--primary-dark)",
                    light: "var(--primary-light)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    muted: "var(--accent-muted)",
                },
                surface: {
                    main: "var(--bg-main)",
                    card: "var(--bg-card)",
                    elevated: "var(--bg-elevated)",
                    input: "var(--bg-input)",
                },
                content: {
                    primary: "var(--text-primary)",
                    secondary: "var(--text-secondary)",
                    muted: "var(--text-muted)",
                },
                // Keep backward compatibility
                dark: "var(--bg-main)",
                darker: "var(--bg-card)",
                light: "var(--text-primary)",
                muted: "var(--text-muted)",
            },
            borderRadius: {
                'xl': '16px',
                '2xl': '20px',
                '3xl': '24px',
            },
            boxShadow: {
                'glow': '0 0 20px rgba(52,211,153,0.15)',
                'glow-lg': '0 0 40px rgba(52,211,153,0.2)',
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
