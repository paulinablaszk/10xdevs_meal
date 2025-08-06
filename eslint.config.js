import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import eslintPluginAstro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";
import globals from "globals";

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

const baseConfig = tseslint.config({
  extends: [eslint.configs.recommended, tseslint.configs.strict, tseslint.configs.stylistic],
  rules: {
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-unused-vars": "off",
    "prettier/prettier": [
      "error",
      {
        endOfLine: "auto",
        astroAllowShorthand: true,
      },
    ],
  },
});

const testConfig = tseslint.config({
  files: ["**/test/**/*", "**/e2e/**/*", "**/playwright/**/*"],
  rules: {
    "no-console": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
  },
});

const serverConfig = tseslint.config({
  files: ["**/api/**/*", "**/services/**/*", "**/middleware/**/*"],
  rules: {
    "no-console": "off",
  },
});

const jsxA11yConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  extends: [jsxA11y.flatConfigs.recommended],
  languageOptions: {
    ...jsxA11y.flatConfigs.recommended.languageOptions,
  },
  rules: {
    ...jsxA11y.flatConfigs.recommended.rules,
  },
});

const reactConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  extends: [pluginReact.configs.flat.recommended],
  languageOptions: {
    ...pluginReact.configs.flat.recommended.languageOptions,
    globals: {
      window: true,
      document: true,
    },
  },
  plugins: {
    "react-hooks": eslintPluginReactHooks,
    "react-compiler": reactCompiler,
  },
  settings: { react: { version: "detect" } },
  rules: {
    ...eslintPluginReactHooks.configs.recommended.rules,
    "react/react-in-jsx-scope": "off",
    "react-compiler/react-compiler": "error",
  },
});

const nodeConfig = tseslint.config({
  files: ["**/*.mjs", "**/*.config.js"],
  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
});

const astroConfig = tseslint.config({
  files: ["**/*.astro"],
  rules: {
    "prettier/prettier": "off",
  },
});

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  {
    ignores: ["**/*.astro"],
  },
  baseConfig,
  testConfig,
  serverConfig,
  jsxA11yConfig,
  reactConfig,
  nodeConfig,
  astroConfig,
  eslintPluginAstro.configs["flat/recommended"],
  eslintPluginPrettier
);
