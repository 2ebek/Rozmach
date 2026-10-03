import type { Config } from "tailwindcss";

// Paleta i typografia wg makiety „ROZMACH – strona główna” (granat + malinowy akcent); kontrasty zgodne z WCAG 2.1 AA.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef3fa", // jasne tło sekcji
          100: "#dfe7f5", // tło kart demonstracyjnych
          600: "#3557b7",
          700: "#24418f", // linki – 8.4:1 na białym
          900: "#13214f", // granat makiety
        },
        accent: "#db1e56", // malinowy – 4.8:1 z białym tekstem
        sun: "#ff6d2c", // tylko dekoracyjnie (bez tekstu na białym)
        mist: "#f1f4f9",
        ink: "#1b2540",
        muted: "#55627f", // tekst pomocniczy – 6:1 na białym, 5.4:1 na brand-50
        line: "#7d8aa5", // obramowania pól – 3.5:1 (WCAG 1.4.11)
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Arial", "sans-serif"],
        display: ['"Momo Trust Display"', "var(--font-sans)", "Arial", "sans-serif"],
      },
      fontSize: {
        base: ["1.0625rem", "1.7rem"],
      },
      // Makieta używa półgrubych krojów – „font-black” w całym serwisie to Inter Bold.
      fontWeight: {
        bold: "650",
        black: "700",
      },
    },
  },
  plugins: [],
};

export default config;
