/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ------------------------------------------------------------------
      // ThinkTok design tokens. Named semantically (not "purple-500") so
      // components read as intent, and so the palette can be re-themed by
      // editing this file alone.
      // ------------------------------------------------------------------
      colors: {
        // Base app chrome — deep space navy, matches the video feed backdrop.
        "Brand-Main": "#0B0E24",
        "Brand-Deep": "#05060F",

        // Primary interactive accent — the glowing magenta/purple used on
        // the CEK button ring and the "Selesai Scrolling" CTA.
        "Action-Primary": "#8B3DFF",
        "Action-Primary-Soft": "#B27CFF",

        // Secondary accent used for the CEK magnifier / investigation UI.
        "Action-Secondary": "#2FB6C9",

        // Focus battery — three-stage read at a glance.
        "Battery-High": "#4ADE80",
        "Battery-Mid": "#FACC15",
        "Battery-Low": "#F43F5E",

        // Fact score star + positive feedback.
        "Score-Gold": "#FFC94A",

        // Report / danger action (the flag icon on LAPORKAN).
        "Danger-Flag": "#FB4B6A",

        // Glass overlay used behind the Reveal screen (Section 5).
        "Surface-Glass": "rgba(10, 12, 30, 0.72)",
        "Surface-Card": "#151933",
        "Surface-Card-Alt": "#1E2340",

        // Text
        "Text-Primary": "#F5F6FF",
        "Text-Secondary": "#A6ABC8",
        "Text-Muted": "#6B7094",
      },
      fontFamily: {
        // KG Blank Space Solid — chunky, playful display face for headlines.
        display: ["var(--font-display)", "'KG Blank Space Solid'", "cursive", "sans-serif"],
        // Poppins — modern, friendly body face for captions and UI labels.
        body: ["var(--font-body)", "'Poppins'", "sans-serif"],
      },
      maxWidth: {
        phone: "430px",
      },
      height: {
        screen: "100dvh",
      },
      boxShadow: {
        "glow-primary": "0 0 24px 4px rgba(139, 61, 255, 0.55)",
        "glow-secondary": "0 0 20px 3px rgba(47, 182, 201, 0.5)",
      },
      keyframes: {
        "battery-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "battery-pulse": "battery-pulse 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
