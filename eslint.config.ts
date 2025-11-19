import eslintJs from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import prettierConfig from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import perfectionist from "eslint-plugin-perfectionist";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  eslintJs.configs.recommended,
  ...tseslint.configs.strict,
  jsdoc.configs["flat/recommended-typescript-error"],
  stylistic.configs.recommended,
  perfectionist.configs["recommended-natural"],
  prettierConfig,
  {
    files: ["**/*.{ts,mts,cts,mjs,cjs}"],
    rules: {
      "@stylistic/padding-line-between-statements": [
        "error",
        // Always blank line before return statements
        { blankLine: "always", next: "return", prev: "*" },
        // Always blank line after import groups
        { blankLine: "always", next: "*", prev: "import" },
        // Always blank line after variable declarations
        { blankLine: "always", next: "*", prev: ["const", "let", "var"] },
        // Always blank line before block-like statements
        {
          blankLine: "always",
          next: ["if", "switch", "for", "while", "try", "function", "class"],
          prev: "*",
        },
        // Always blank line before export statements
        { blankLine: "always", next: "export", prev: "*" },
        // Always blank line after directives (like "use strict")
        { blankLine: "always", next: "*", prev: "directive" },
        // Allow consecutive variable declarations without blank lines
        {
          blankLine: "any",
          next: ["const", "let", "var"],
          prev: ["const", "let", "var"],
        },
        // Allow consecutive imports without blank lines
        { blankLine: "any", next: "import", prev: "import" },
        // Never blank line between case statements
        { blankLine: "never", next: "case", prev: "case" },
      ],
    },
    // Use natural sorting for perfectionist plugin (e.g., "item2" before "item10")
    settings: { perfectionist: { type: "natural" } },
  },
  // Type-aware TypeScript rules (requires type information from tsconfig.json)
  // Only applied to src/**/*.ts files for better performance
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ["src/**/*.ts"],
  })),
  // Type-aware stylistic TypeScript rules for consistent code patterns
  // Enforces array syntax, type assertions, interface vs type, optional chaining, etc.
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: ["src/**/*.ts"],
  })),
  // Source file specific configuration
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        // Enable TypeScript project service for type-aware linting
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { args: "none", varsIgnorePattern: "^_" },
      ],
      // Require JSDoc comments for classes, functions, and methods
      "jsdoc/require-jsdoc": [
        "warn",
        {
          require: {
            ClassDeclaration: true,
            FunctionDeclaration: true,
            MethodDefinition: true,
          },
        },
      ],
      // Require @param tags for all function parameters
      "jsdoc/require-param": "warn",
      // Require @returns tag for functions that return values
      "jsdoc/require-returns": "warn",
    },
  },
  // Build script specific configuration
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      // Enable Node.js global variables (e.g., __dirname, process)
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "jsdoc/require-jsdoc": "off",
      "no-unused-vars": ["error", { args: "none" }],
    },
  },
  { ignores: ["main.js", "node_modules/**"] },
]);
