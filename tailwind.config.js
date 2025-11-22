/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                'poppins': ['Poppins', 'sans-serif'],
                'aleo': ['Aleo', 'serif'],
            },
            borderRadius: {
                'lingoblitz': '20px',
            }
        },
    },
    plugins: [],
}
