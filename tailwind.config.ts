import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E07A5F",
          hover: "#C96A52",
        },
        secondary: {
          DEFAULT: "#3D405B",
          hover: "#2D3142",
        },
        accent: "#81B29A",
        background: "#F4F1DE",
        surface: "#FFFFFF",
        text: "#2D3142",
        "text-muted": "#6B7280",
        border: "#E5E7EB",
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};
export default config;
