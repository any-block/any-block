# 依赖注意项

## cm 版本冲突

注意: `"@codemirror/lang-markdown": "^6.3.4",` 升级/隐式升级到 `^6.5.0` 后，应用该扩展时，

app 版本运行时报错: 

```bash
error: TypeError: can't access property "length" of undefined
    nextChild index.js:729
    enterChild index.js:1027
    firstChild index.js:1039
    startInner index.js:1910
    advance index.js:1810
    advance index.js:1821
    work index.js:363
    withContext index.js:398
    work index.js:351
    init index.js:544
    create index.js:1758
    create index.js:1767
    create index.js:2748
    ensureAddr index.js:2013
    _EditorState index.js:2549
    create index.js:2748
    _EditorView index.js:7863
    emit_render EditableBlock_Cm.ts:460
```

然后也导致了 `'@lezer/common': 1.2.3` 变 `'@lezer/common': 1.5.2`

出现了版本不一致的冲突

解决：回退 lang-markdown，间接回退 `'@lezer/common'`

## svelete 依赖问题

eedf847ce263adc32eaad51b80c7ad132a69b2cb 引起bug: 实时模式不再生效

因为是 svelte 很久以前才依赖的，但我现在插件已经不再依赖于 svelte 了。
想着去除 `"@tsconfig/svelte": "^3.0.0",` 依赖，但结果出问题了。
应该是去除过程中也去掉了一些配置。

`"@tsconfig/svelte": "^3.0.0",` 依赖。然后 tsonfig.json 中 extends 一下。

`3.0.0` 配置参考 (在用)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Svelte",
  "_version": "3.0.0",

  "compilerOptions": {
    "moduleResolution": "node",
    "target": "es2017",
    /**
      Svelte Preprocess cannot figure out whether you have a value or a type, so tell TypeScript
      to enforce using `import type` instead of `import` for Types.
      只引入 TypeScript 类型时必须使用 import type 语法
     */
    "importsNotUsedAsValues": "error",
    /**
      TypeScript doesn't know about import usages in the template because it only sees the
      script of a Svelte file. Therefore preserve all value imports. Requires TS 4.5 or higher.
      防止 TypeScript 自动删除它认为“未被使用”的变量导入
     */
    "preserveValueImports": true,
    "isolatedModules": true,
    /**
      To have warnings/errors of the Svelte compiler at the correct position,
      enable source maps by default.
      生成 Source Map（源码映射文件）
     */
    "sourceMap": true,
    // 关闭严格模式。不会进行最严格的类型校验
    "strict": false,
    // 增强对 CommonJS 模块的兼容性。允许你以 ES 模块的方式默认导入 CommonJS 模块
    "esModuleInterop": true,
    // 跳过对所有的 .d.ts 声明文件
    // 这能显著提升编译/检查速度，同时避免因第三方库本身类型不严谨而导致你的项目报错。
    "skipLibCheck": true,
    // 强制引入文件时的大小写必须与文件系统上的真实名称一致。
    // 这可以避免跨平台开发（例如 Windows 忽略大小写，而 Linux/macOS 区分大小写）带来的路径找不到的隐患。
    "forceConsistentCasingInFileNames": true
  }
}
```

`5.0.8` 配置参考

```json
{
  "$schema": "https://www.schemastore.org/tsconfig",
  "_version": "5.0.0",

  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler",
    "target": "es2017",
    /**
      Svelte Preprocess cannot figure out whether you have a value or a type, so tell TypeScript
      to enforce using `import type` instead of `import` for Types.
     */
    "verbatimModuleSyntax": true,
    /**
      To have warnings/errors of the Svelte compiler at the correct position,
      enable source maps by default.
     */
    "sourceMap": true,

    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

配置检查: 发现若缺少以下这行。编译和运行看起来正常，
但在 Obsidian 中的实时编辑模式中，会渲染失效

`"importsNotUsedAsValues": "error",`

Gemini 3.1 Pro 分析其原因:

与打包工具的依赖擦除（Import Elision）机制有关。

```markdown
## 核心原因分析：编译器“自作聪明”删除了关键 Import

当你去掉了 `"importsNotUsedAsValues": "error"` 后，TypeScript（以及依赖 tsconfig.json 的打包工具，通常 Obsidian 插件使用的是 esbuild）的行为发生了回退，变成了默认行为：按需擦除（remove）。

什么是“按需擦除”？ 在默认情况下，如果你写了 `import { A } from 'module'`，但编译器在代码中发现你只把 A 当作类型（Type）来用（比如 `let myVar: A;`），它就会认为“这个模块在运行时是不需要的”，从而在最终打包的 JS 中完全把这一行 import 删掉。
`"importsNotUsedAsValues": "error"` 的作用 这个选项强制你明确写出 import type。如果不写 type，编译器就绝对不会自动删除这行 import。它保证了代码里的 import 会 100% 被保留到编译后的 JS 中。
```
