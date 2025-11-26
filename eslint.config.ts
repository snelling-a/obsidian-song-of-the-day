// @ts-expect-error - esm module without types
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import stylistic from "@stylistic/eslint-plugin";
import vitest from "@vitest/eslint-plugin";
import jsdoc from "eslint-plugin-jsdoc";
import obsidianmd from "eslint-plugin-obsidianmd";
import perfectionist from "eslint-plugin-perfectionist";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

// Augment ImportMeta to include dirname (available in Node.js 20.11.0+)
declare global {
  interface ImportMeta {
    dirname: string;
  }
}

const obsidianGlobals = {
  ajax: "readonly",
  ajaxPromise: "readonly",
  createDiv: "readonly",
  createEl: "readonly",
  createFragment: "readonly",
  createSpan: "readonly",
  createSvg: "readonly",
  fish: "readonly",
  fishAll: "readonly",
  isBoolean: "readonly",
  nextFrame: "readonly",
  ready: "readonly",
  sleep: "readonly",
} as const;

export default defineConfig([
  { ignores: ["main.js", "**/*.js", "**/__mocks__/**"] },
  eslintPluginUnicorn.configs.recommended,
  {
    rules: {
      "unicorn/expiring-todo-comments": "off",
      "unicorn/no-null": "off",
      "unicorn/no-useless-switch-case": "off",
      "unicorn/prevent-abbreviations": [
        "error",
        {
          replacements: {
            cmd: { command: true },
            el: false,
            ev: { event: false },
            pkg: false,
            utils: false,
          },
        },
      ],
    },
  },
  {
    files: ["**/*.{ts,?js}"],
    ...perfectionist.configs["recommended-natural"],
  },
  // @ts-expect-error - obsidianmd config types are incompatible with eslint config types
  ...obsidianmd.configs.recommended,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- esm module without types
  eslintComments.recommended,
  {
    files: ["**/*.{ts,?js}"],
    rules: {
      "@eslint-community/eslint-comments/require-description": "error",
    },
  },
  {
    files: ["**/*.{ts,?js}"],
    ...stylistic.configs.customize({
      arrowParens: true,
      braceStyle: "1tbs",
      quoteProps: "as-needed",
      quotes: "double",
      semi: true,
    }),
  },
  {
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      jsdoc.configs["flat/contents-typescript-flavor"],
      jsdoc.configs["flat/logical-typescript-flavor"],
      jsdoc.configs["flat/stylistic-typescript-flavor"],
    ],
    files: ["**/*.ts"],
    languageOptions: {
      globals: { ...globals.browser, ...obsidianGlobals },
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: { "@stylistic": stylistic, jsdoc },
    rules: {
      "@stylistic/operator-linebreak": "off",
      "@stylistic/padding-line-between-statements": [
        "error",
        { blankLine: "always", next: "return", prev: "*" },
      ],
      "@typescript-eslint/explicit-function-return-type": ["warn"],
      "@typescript-eslint/explicit-member-accessibility": [
        "warn",
        { accessibility: "explicit", overrides: { constructors: "no-public" } },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          format: ["camelCase"],
          leadingUnderscore: "allow",
          selector: "default",
          trailingUnderscore: "allow",
        },
        { format: ["camelCase", "PascalCase"], selector: "import" },
        {
          format: ["camelCase", "UPPER_CASE"],
          selector: "objectLiteralProperty",
        },
        {
          format: null,
          modifiers: ["requiresQuotes"],
          selector: "objectLiteralProperty",
        },
        {
          custom: { match: false, regex: "^I[A-Z]" },
          format: ["PascalCase"],
          selector: "typeLike",
        },
        { format: ["camelCase"], selector: "typeProperty" },
        {
          format: ["camelCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
          selector: "variable",
          trailingUnderscore: "allow",
        },
        {
          format: ["camelCase"],
          prefix: ["is", "should", "has", "can", "did", "will"],
          selector: "variable",
          types: ["boolean"],
        },
        {
          format: ["camelCase"],
          leadingUnderscore: "allow",
          selector: ["function"],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      curly: ["error", "all"],
      "id-length": ["error", { exceptions: ["_", "x"], min: 2 }],
      "jsdoc/match-description": [
        "warn",
        { message: "Use sentence case with proper punctuation and spacing." },
      ],
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
      "obsidianmd/ui/sentence-case": [
        "error",
        {
          acronyms: ["API", "ID", "URI", "URL"],
          allowAutoFix: true,
          brands: ["Spotify"],
        },
      ],
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "unicorn/no-process-exit": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    plugins: { vitest },
    rules: {
      ...vitest.configs.all.rules,
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "jsdoc/require-jsdoc": "off",
      "vitest/no-hooks": "off",
      "vitest/prefer-called-times": "off",
      "vitest/prefer-expect-assertions": "off",
      "vitest/valid-title": [
        "error",
        {
          ignoreTypeOfDescribeName: true,
          mustMatch: { it: ["^should\\s.*$"] },
        },
      ],
    },
  },
  { rules: { "no-prototype-builtins": "off" } },
  {
    files: ["./src/services/**/types.ts"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        { format: ["camelCase", "snake_case"], selector: "typeProperty" },
      ],
    },
  },
  {
    files: ["./src/settings/types.ts", "./src/services/spotify/index.ts"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        { format: ["camelCase", "snake_case"], selector: "typeProperty" },
      ],
    },
  },
  {
    files: ["./src/settings/constants.ts", "./src/settings/index.ts"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        {
          format: ["camelCase", "UPPER_CASE", "snake_case"],
          selector: "objectLiteralProperty",
        },
        {
          format: null,
          modifiers: ["requiresQuotes"],
          selector: "objectLiteralProperty",
        },
      ],
    },
  },
  {
    files: ["eslint.config.ts"],
    rules: {
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },
  {
    files: ["vitest.config.ts"],
    rules: {
      "import/no-nodejs-modules": "off",
    },
  },
  {
    files: ["**/__mocks__/**/*.ts", "test/fixtures/**/*.ts"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-member-accessibility": "off",
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "jsdoc/no-blank-blocks": "off",
      "jsdoc/tag-lines": "off",
      "obsidianmd/*": "off",
      "perfectionist/sort-classes": "off",
    },
  },
]);
