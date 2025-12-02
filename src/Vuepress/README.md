# vuepress-plugin-any-block

(该页可能在 any-block/obsidian-any-block 或 LincZero/LincZero.github.io 仓库下。
如果该页没有内容，请到另一个仓库中查看)

(大概率是放在 LincZero/LincZero.github.io 仓库，不然的话 any-block 这边得绑很多vuepress相关的依赖)

## 说明

在 Vuepress 中, AnyBlock 可以以 markdown-it 方式使用，也可以使用 Vuepress Plugins 方式使用

- 前者: 不需要这个文件夹的内容，需要手动引用下 css，不支持客户端渲染
- 后者: 需要这个文件夹的内容，无需手动引用 css，支持客户端渲染

## 使用 - 源码版

当正常vuepress插件使用即可

1. 将该文件夹复制为 vuepress 的 src/.vuepress/plugins/AnyBlock/

2. 先安装 markdown-it-any-block

```ts
pnpm install -D markdown-it-any-block@latest
```

3. 修改: `src/.vuepress/config.ts`

```ts
import anyblock from "./plugins/AnyBlock/node"

const userConfig: UserConfig = {
  plugins: [
    anyblock
  ],
}
```

## 架构

主要是对 markdown-it-any-block 进行二次封装，并提供了客户端/服务端两种渲染策略

(客户端渲染暂未支持)

依赖于 `markdown-it-any-block`
