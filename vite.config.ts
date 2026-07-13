import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.OPENRELIEF_BASE_PATH ?? "/",
  plugins: [react()],
  root: "apps/web",
  build: {
    outDir: "../../dist",
    emptyOutDir: true
  },
  server: {
    host: "127.0.0.1",
    port: 5173
  }
});
