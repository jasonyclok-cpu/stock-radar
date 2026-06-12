/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        kid: ['"Chalkboard SE"', '"PingFang HK"', '"Microsoft JhengHei"', 'sans-serif'],
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '70%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-8deg)' },
          '50%': { transform: 'rotate(8deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        cheer: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-14px) rotate(-10deg)' },
          '50%': { transform: 'translateY(0) rotate(0deg)' },
          '75%': { transform: 'translateY(-14px) rotate(10deg)' },
        },
      },
      animation: {
        pop: 'pop 0.25s ease-out',
        wiggle: 'wiggle 0.6s ease-in-out infinite',
        shake: 'shake 0.3s ease-in-out',
        floaty: 'floaty 2.5s ease-in-out infinite',
        cheer: 'cheer 0.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
