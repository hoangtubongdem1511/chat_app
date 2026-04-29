import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // hoặc đường dẫn phù hợp với project của bạn
  ],
  theme: {
    extend: {},
  },
  plugins: [
    forms,
  ],
}