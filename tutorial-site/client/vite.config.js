import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import seoAssets from "./vite-plugin-seo.js";

export default defineConfig({
  plugins: [react(), seoAssets()],
  server: {
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});