# 依赖注意项

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
