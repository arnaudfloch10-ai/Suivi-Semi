/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Sous-chemin d'URL : "/" en local, "/Suivi-Semi/" sur GitHub Pages
// (injecté par le workflow via VITE_BASE).
declare const process: { env: Record<string, string | undefined> };
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "programme.json"],
      manifest: {
        name: "Suivi — carnet d'entraînement",
        short_name: "Suivi",
        description: "Carnet d'entraînement pour suivre mon plan de course.",
        lang: "fr",
        start_url: base,
        scope: base,
        display: "standalone",
        orientation: "portrait",
        background_color: "#F1F3F2",
        theme_color: "#2F6E52",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,json}"],
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
  test: {
    globals: true,
    environment: "node",
  },
});
