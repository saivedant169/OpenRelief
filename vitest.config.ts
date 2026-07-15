import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./apps/web/src/test/setup.ts"],
    include: ["packages/**/*.test.ts", "apps/**/*.test.tsx", "docs/**/*.test.ts"],
    exclude: ["apps/web/e2e/**", "node_modules/**", "dist/**"],
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 30000
  }
});
