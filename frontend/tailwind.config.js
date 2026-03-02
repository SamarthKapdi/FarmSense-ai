module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    darkMode: ["class", '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                primary: "var(--primary)",
                accent: "var(--accent)",
                dark: "var(--bg-main)",
                darker: "var(--bg-card)",
                light: "var(--text-light)",
                muted: "var(--text-muted)",
                gray: {
                    50: "var(--gray-50)",
                    100: "var(--gray-100)",
                    200: "var(--gray-200)",
                    300: "var(--gray-300)",
                    400: "var(--gray-400)",
                    500: "var(--gray-500)",
                    600: "var(--gray-600)",
                    700: "var(--gray-700)",
                    800: "var(--gray-800)",
                    900: "var(--gray-900)",
                },
            },
        },
    },
    plugins: [],
};
