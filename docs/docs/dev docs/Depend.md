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

因为是 svelte 很久以前才依赖的，想着去除，但出问题了。应该是去除过程中也去掉了一些配置。

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
     */
    "importsNotUsedAsValues": "error",
    /**
      TypeScript doesn't know about import usages in the template because it only sees the
      script of a Svelte file. Therefore preserve all value imports. Requires TS 4.5 or higher.
     */
    "preserveValueImports": true,
    "isolatedModules": true,
    /**
      To have warnings/errors of the Svelte compiler at the correct position,
      enable source maps by default.
     */
    "sourceMap": true,

    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
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

有空再看看是哪个配置的影响
