/**
 * vite版的编译，带混淆、带cjs和js的双编译
 */

import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: "ESNext",
    assetsInlineLimit: 0, // 禁用文件hash
    minify: false, // 禁用代码压缩，包括混淆
    sourcemap: true,
    lib: {
      entry: './index.ts',

      name: 'MdItAnyBlock',
      formats: ['es', 'cjs'], //  ['es', 'cjs']
      fileName: (format) => format == 'es'
        ? `mdit-any-block.js`
        : `mdit-any-block.cjs`,
    },
    rollupOptions: {
      // 确保您的库与其他包兼容
      external: [
        'markdown-it',
        'jsdom',
        'mermaid',
        '@mermaid-js/mermaid-mindmap',
      ],
      output: {
        // Provide global variables to other scripts
        globals: {
          'markdown-it': 'markdownIt'
        }
      }
    }
  }
})
