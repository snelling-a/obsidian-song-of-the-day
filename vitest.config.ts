import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      obsidian: resolve(__dirname, "./test/__mocks__/obsidian.ts"),
      src: resolve(__dirname, "./src"),
      test: resolve(__dirname, "./test"),
    },
  },
  test: {
    clearMocks: true,
    coverage: {
      exclude: [
        "node_modules/",
        "scripts/",
        "test/",
        "**/*.config.{ts,mjs,js}",
        "**/*.{test,spec}.ts",
        "**/types/**",
        "src/main.ts",
      ],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    environment: "happy-dom",
    globals: true,
    include: ["src/**/*.{test,spec}.ts"],
    mockReset: true,
    reporters: ["tree"],
    restoreMocks: true,
  },
});
