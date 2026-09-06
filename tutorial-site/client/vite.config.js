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

  server: {
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});