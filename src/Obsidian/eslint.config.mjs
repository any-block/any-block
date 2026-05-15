// take from https://github.com/obsidianmd/eslint-plugin
import tsparser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  ...obsidianmd.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: "./tsconfig.json" },
    },

    // You can add your own configuration to override or add rules
    rules: {
      // example: turn off a rule from the recommended set
      "obsidianmd/sample-names": "off",
      // example: add a rule not in the recommended set and set its severity
      "obsidianmd/prefer-file-manager-trash-file": "error",
    },
  },
]);
