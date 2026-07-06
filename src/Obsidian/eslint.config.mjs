// take from https://github.com/obsidianmd/eslint-plugin
import tsparser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  {
    // 否则会检查 esbuild.config.mjs 代码
    ignores: ["**/*.mjs", "**/*.json"]
  },
  ...obsidianmd.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: "./tsconfig.json" },
    },

    // 您可以添加自己的配置来覆盖或添加规则
    rules: {
      // 示例: 从推荐集中关闭一条规则
      // "obsidianmd/sample-names": "off",
      // 示例：添加一个不在推荐集合中的规则，并设置其严重程度
      // "obsidianmd/prefer-file-manager-trash-file": "error",

      // 允许 console.log
      // 允许说明: 我会使用 isDebug (default false) 来统一控制是否打印，以保持控制台的简洁
      "obsidianmd/rule-custom-message": "off",
      // 允许使用 docuemnt
      // 允许说明: obsidian 会让你用 activeDocument 代替之以避免弹出窗口的问题，但 activeDocuemnt 非通用代码
      "obsidianmd/prefer-active-doc": "off",

      // 允许使用 any 类型
      "@typescript-eslint/no-explicit-any": "off",
      // 允许使用空内容的 `{}`
      "no-empty": "off",
    },
  },
]);
