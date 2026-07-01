module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './App_3.tsx',
  ],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 20px 80px rgba(99, 102, 241, 0.18)',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top, rgba(99,102,241,0.25), transparent 28%), radial-gradient(circle at bottom right, rgba(59,130,246,0.18), transparent 20%)',
      },
    },
  },
  plugins: [],
};
