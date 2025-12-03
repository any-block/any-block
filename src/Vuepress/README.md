# vuepress-plugin-any-block

(该页可能在 any-block/obsidian-any-block 或 LincZero/LincZero.github.io 仓库下。
如果该页没有内容，请到另一个仓库中查看)

(大概率是放在 LincZero/LincZero.github.io 仓库，不然的话 any-block 这边得绑很多vuepress相关的依赖)

## 说明 两种用法

在 Vuepress 中, AnyBlock 可以以 markdown-it 方式使用，也可以使用 Vuepress Plugins 方式使用

- 前者 markdown-it + node端渲染:
  - 不需要这个文件夹的内容
  - 需要手动引用下 css
  - 不支持客户端渲染
- 后者 Vuepress Plugins + node/client端渲染:
  - 需要这个文件夹的内容
  - 无需手动引用 css
  - 支持服务端/客户端渲染

切换 node/client 端渲染

- 默认 node 端渲染
- 切换方式: 修改 node/index.ts 和 client/clientConfig.ts 两个文件 IS_CLIENT 变量

比较 node/client 端渲染，重点说缺点

- node端渲染
  - 需要在node端通过 JSDOM 模拟浏览器环境 (可能存在插件和vitepress的冲突风险)
  - (减少一些client端存在的问题)
  - 事件方法不好写，需要函数转字符串
  - 可以为其他插件也提供一个虚拟 dom 环境 (同时为优缺点)
- client端渲染
  - 无需在node端模拟浏览器环境
  - (减少一些node端存在的问题)
  - 缺少url修正，vuepress中可能图片等资源的路径会被改变，在client端无法指向
  - 缺少选择器类型，一些别名可能会失效
  - 无法使用 node 端生效的 markdown-it 插件，只能用原生的 markdown-it 进行再渲染

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
