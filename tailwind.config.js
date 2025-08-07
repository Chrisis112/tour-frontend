/** @type {import('tailwindcss').Config} */
module.exports = {
  
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',      // Если используешь pages/
    './layouts/**/*.{js,ts,jsx,tsx}',    // Если есть layout-папка
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5', // Можно задать свои кастомные цвета
        secondary: '#6366F1',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),           // Поддержка форм (опционально)
    require('@tailwindcss/typography'),      // Поддержка красивой типографики
    require('@tailwindcss/line-clamp'),      // Поддержка line-clamp (обрезка текста)
  ],
};
