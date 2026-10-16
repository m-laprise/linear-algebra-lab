import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "/linear-algebra/",
  build: {
    manifest: true,
    rollupOptions: { output: { manualChunks: { mathTypesetting: ["katex"] } } },
  },
  test: { include: ["tests/unit/**/*.test.ts"] },
});
