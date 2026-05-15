除了是 min 资源外，还是 use-npm-core

避免 Core 模块被过度审核

---

为了不想重构，修改对 Core 模块的 import 路径，目前用 copyfile 实现

另一个方法是 tsconfig.json 里:

```json
"@/ABConverter/*": ["node_modules/@anyblock/any-block-core/*"],
```

但还是算了，还是使用 copyfiles 吧，主要可能还有 css 文件等其他资源
