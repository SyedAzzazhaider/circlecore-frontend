/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe",
          300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1",
          600: "#4f46e5", 700: "#4338ca", 800: "#3730a3",
          900: "#312e81", 950: "#1e1b4b"
        },
        surface: {
          0: "#ffffff", 50: "#f8fafc", 100: "#f1f5f9",
          200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8",
          500: "#64748b", 600: "#475569", 700: "#334155",
          800: "#1e293b", 900: "#0f172a", 950: "#020617"
        },
        success: { 50: "#f0fdf4", 500: "#22c55e", 700: "#15803d" },
        danger:  { 50: "#fef2f2", 400: "#f87171", 500: "#ef4444", 700: "#b91c1c" },
        warning: { 50: "#fffbeb", 500: "#f59e0b" },
        premium: { 50: "#fdf4ff", 500: "#a855f7", 700: "#7e22ce" }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Fira Code", "monospace"]
      },
      boxShadow: {
        card:    "0 0 0 1px rgb(0 0 0/0.05), 0 2px 8px -2px rgb(0 0 0/0.1)",
        "card-lg": "0 0 0 1px rgb(0 0 0/0.06), 0 8px 24px -4px rgb(0 0 0/0.12)",
        glow:    "0 0 40px -4px rgb(99 102 241/0.45)",
        "glow-sm": "0 0 20px -4px rgb(99 102 241/0.3)"
      },
      animation: {
        "fade-in":  "fadeIn 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in": "scaleIn 0.2s cubic-bezier(0.16,1,0.3,1) both"
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.96)" }, to: { opacity: "1", transform: "scale(1)" } }
      }
    }
  },
  plugins: []
};
