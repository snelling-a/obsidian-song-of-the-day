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
        "**/modals/**",
        "src/main.ts",
        "src/settings/MetadataTypesSettingTab.ts",
        "src/settings/pages/",
        "src/utils/obsidian/plugins",
      ],
      include: ["src/**/*.ts"],
      reporter: ["text", "json", "html"],
    },
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts"],
    mockReset: true,
    reporters: ["tree"],
    restoreMocks: true,
  },
});
