# AnyBlock MarkdownIt

- en
  - Welcome to learn more about it in [the GitHub project](https://github.com/any-block/any-block)
  - Here you will find more detailed function descriptions and multilingual documents.
- zh
  - 欢迎到此 [github项目](https://github.com/any-block/any-block) 中了解更多
  - 这里有更详细的功能介绍和多语言文档

## markdown-it-any-block 使用

新版 npm 流程

从npm下载并使用：

```bash
$ pnpm install -D markdown-it-any-block@latest

# 或beta/测试版 (供开发者测试使用，不建议) pnpm install -D markdown-it-any-block@beta
```

使用 (vuepress为例，其他使用markdown-it插件的类似)

`config.ts`

```ts
import { ab_mdit } from "markdown-it-any-block"

// (可选) 如果你要在 node 环境渲染而非 client 中渲染，则加上下面的语句。在 client 端不要这样做
import { jsdom_init } from "markdown-it-any-block/node"
jsdom_init()
...

const userConfig: UserConfig = {
  extendsMarkdown: (md: markdownit) => {
    md.use(ab_mdit)
  }
}
```

> [!WARNING]
> 
> 注意，构建出来的只有对应的dom结构，而没有样式。因为纯markdown-it插件是不含样式的（除非用内联样式），自己引用一下就好
> 
> 例如vuepress中可以创建/修改 `src/.vuepress/styles/index.scss`
> 并添加: `@import '../../../node_modules/markdown-it-any-block/styles';`

## 扩展补充

服务端渲染与客户端渲染

jsdom_init 命令:

- 如果模块根部有直接使用的，会报错 document 对象找不到，此时应改成同步操作
- 并非必须的，当用于markdown-it插件时 (服务端渲染) 一般需要先执行。但如果二次封装成客户端渲染，则不一定需要执行

## 构建

构建就简单的 `pnpm build`

(仅自用) 构建、上传npm:

```bash
# $ pnpm build # 设置了prepublishOnly，不需要先手动编译。但是你可以手动执行这一步，来检查编译是否正常

$ npm adduser  # 先登录，在vscode里他会让我打开浏览器来登录
Username: ...
Password: ...

$ npm publish  # 上传 (注意不要重名、npm账号可能需要邮箱验证)
               # 如果设置了 package.json::script.prepublishOnly，会先执行 (一般是build)
               # 这一步会将当前文件夹内容都上传到npm中名为 `<package.json 里 name@version>` 的包里
               # 如果没有对应包，会自动创建

# or 或
$ npm publish --tag beta  # 如果使用测试或beta版本 (包含 `-tagname`)，如 `-beta` 
                          # 需要 添加 `--tag <tagname>`，如 `--tag beta`
```
