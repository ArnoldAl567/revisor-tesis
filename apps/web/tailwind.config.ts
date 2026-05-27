import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores extraídos de tus imágenes
        primary: {
          DEFAULT: "#185FA5", // Azul institucional
          light: "#eef2ff",
          dark: "#0c447c",
        },
        sidebar: "#f7f6f2", // Fondo gris/crema de la sidebar
        accent: "#f1f5f9",
        success: "#1D9E75", // Verde de las notas (88%)
        warning: "#BA7517", // Ámbar de las alertas (74%)
        danger: "#E24B4A",  // Rojo de las alertas (61%)
      },
      fontFamily: {
        // Fuente Inter para el look moderno
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        // Sombra suave para las tarjetas (Cards)
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      }
    },
  },
  plugins: [],
};

export default config;