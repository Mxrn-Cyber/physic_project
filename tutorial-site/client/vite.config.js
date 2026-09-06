import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import seoAssets from "./vite-plugin-seo.js";

export default defineConfig({
  plugins: [react(), seoAssets()],
  // Vite's dependency scanner treats every .html file it finds as an entry
  // point, which now includes public/googleb35d0b958d506ec4.html -- Google's
  // ownership proof, which is plain text, not a page. Naming the real entry
  // keeps the scanner out of public/.
  optimizeDeps: {
    entries: ["index.html"],
  },

  // The pdf.js worker is an ES module and is wrapped by
  // src/utils/pdf-worker.js, which cannot be emitted in Vite's default IIFE
  // worker format.
  worker: { format: "es" },

  server: {
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});