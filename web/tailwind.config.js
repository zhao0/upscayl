/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
        },
    },
    plugins: [require("daisyui")],
    daisyui: {
        themes: [
            {
                upscayl: {
                    "primary": "#7c3aed",
                    "primary-content": "#ffffff",
                    "secondary": "#6d28d9",
                    "accent": "#a78bfa",
                    "neutral": "#1e1b2e",
                    "base-100": "#0f0d1a",
                    "base-200": "#1a1730",
                    "base-300": "#252040",
                    "info": "#38bdf8",
                    "success": "#4ade80",
                    "warning": "#facc15",
                    "error": "#ef4444",
                },
            },
            "dark",
        ],
        darkTheme: "upscayl",
    },
}
