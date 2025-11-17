import eslintJs from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import perfectionist from "eslint-plugin-perfectionist";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  eslintJs.configs.recommended,
  ...tseslint.configs.strict,
  perfectionist.configs["recommended-natural"],
  prettierConfig,
  {
    files: ["**/*.{ts,mts,cts,mjs,cjs}"],
    settings: { perfectionist: { type: "natural" } },
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { args: "none", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": ["error", { args: "none" }],
    },
  },
  {
    ignores: ["main.js", "node_modules/**"],
  },
]);
