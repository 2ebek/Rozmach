import path from "node:path";
import { defineConfig } from "vitest/config";

// Testy jednostkowe: src/**/*.test.ts. Testy E2E (Playwright) są w e2e/ i uruchamia je `npm run test:e2e`.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["src/**/*.test.ts"], environment: "node", setupFiles: ["src/test-setup.ts"] },
});
