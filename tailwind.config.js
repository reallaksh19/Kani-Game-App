/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./learning-galaxy-v5.jsx"
    ],
    theme: {
        extend: {
            keyframes: {
                twinkle: {
                    '0%, 100%': { opacity: '0.3' },
                    '50%': { opacity: '1' }
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' }
                },
                slideIn: {
                    'from': { opacity: '0', transform: 'translateY(20px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' }
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-5px)' },
                    '75%': { transform: 'translateX(5px)' }
                }
            },
            animation: {
                twinkle: 'twinkle 3s ease-in-out infinite',
                float: 'float 2s ease-in-out infinite',
                slideIn: 'slideIn 0.3s ease-out both',
                shake: 'shake 0.3s ease-in-out'
            }
        }
    },
    plugins: []
};
