# README

此处作为 [../README.md](../README.md) 的补充，以及一些旧版版本的备份

## 模块的上下游关系

- vuepress-plugin-any-block 依赖 markdown-it-any-block
- markdown-it-any-block 依赖 ~~any-block-converter-markdown-it~~
- 然后 any-block-converter-markdown-it 模块现在废弃了，不要直接使用
  请使用 markdown-it-any-block 或  vuepress-plugin-any-block

## any-block-converter-markdown-it 模块的使用

### 废弃声明 (备用)

```ts
// 模板
npm deprecate <your-old-package>@* "❗ 此包已废弃，请改用新包：<your-new-package> → https://www.npmjs.com/package/<your-new-package>"
// 实际
npm deprecate any-block-converter-markdown-it@* "❗ This package has been discarded. Please use a new one instead： markdown-it-any-block → https://www.npmjs.com/package/markdown-it-any-block"
```

或更新 package.json 和 README

```json
{
  "name": "your-old-package",
  "deprecated": "❗ 此包已废弃，请改用：https://www.npmjs.com/package/your-new-package",
  // ...其他字段
}
```

### 使用流程 - 源码版

```typescript
// 转换器模块
import { ABConvertManager } from "ABConvertManager"
// 加载所有转换器 (都是可选的)
// (当然，如果A转换器依赖B转换器，那么你导入A必然导入B)
import {} from "./ABConverter/converter/abc_text"
import {} from "./ABConverter/converter/abc_code"
import {} from "./ABConverter/converter/abc_list"
import {} from "./ABConverter/converter/abc_table"
import {} from "./ABConverter/converter/abc_deco"
import {} from "./ABConverter/converter/abc_ex"
import {} from "./ABConverter/converter/abc_echarts"
import {} from "./ABConverter/converter/abc_mermaid" // 可选建议：非 min 环境下 7.1MB
import {} from "./ABConverter/converter/abc_markmap" // 可选建议：1.3MB

// 先注册默认渲染行为
ABConvertManager.getInstance().redefine_renderMarkdown((markdown: string, el: HTMLElement): void => {...})

// 然后按下面这个原型正常使用即可
ABConvertManager.autoABConvert(el:HTMLDivElement, header:string, content:string): HTMLElement
```

**其中，回调函数设置详细说下**

Obsidian 回调设置如下：

```typescript
ABConvertManager.getInstance().redefine_renderMarkdown((markdown: string, el: HTMLElement): void => {
    /**
     * Renders markdown string to an HTML element.
     * @deprecated - use {@link MarkdownRenderer.render}
     * 
     * 原定义： 
     * @param markdown - The markdown source code
     * @param el - The element to append to
     * @param sourcePath - The normalized path of this markdown file, used to resolve relative internal links
     *     此标记文件的规范化路径，用于解析相对内部链接
     *     TODO 我可能知道为什么重渲染图片会出现bug了，原因应该在这里
     * @param component - A parent component to manage the lifecycle of the rendered child components, if any
     *     一个父组件，用于管理呈现的子组件(如果有的话)的生命周期
     * @public
     * 
     */
    //MarkdownRenderer.renderMarkdown(markdown, el, "", new MarkdownRenderChild(el))

    /**
     * Renders markdown string to an HTML element.
     * @param app - A reference to the app object
     * @param markdown - The markdown source code
     * @param el - The element to append to
     * @param sourcePath - The normalized path of this markdown file, used to resolve relative internal links
     * @param component - A parent component to manage the lifecycle of the rendered child components.
     * @public
     */
    // @ts-ignore 新接口，但旧接口似乎不支持
    MarkdownRenderer.render(app, markdown, el, "", new MarkdownRenderChild(el))
})
```

MarkdownIt 回调函数设置如下：

```typescript
ABConvertManager.getInstance().redefine_renderMarkdown((markdown: string, el: HTMLElement): void => {
    const result: string = md.render(markdown)
    const el_child = document.createElement("div"); el.appendChild(el_child); el_child.innerHTML = result;
})
```

至于其他平台的可以参考上面两者进行设置

### 使用流程 - npm改良版 (旧版)

从npm下载并使用：

```bash
$pnpm install -D any-block-converter-markdown-it@3.1.3-beta11
# 后面操作的使用和前面类似
```

但是npm版本需要注意：

1. 由于某bug未解决，不支持markmap
2. 需要在父项目提供jsdom环境：(还要 pnpm install -D jsdom)
  ```ts
  import jsdom from "jsdom"
  const { JSDOM } = jsdom
  const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
    url: 'http://localhost/', // @warn 若缺少该行，则在mdit+build环境下，编译报错
  });
  // @ts-ignore 不能将类型“DOMWindow”分配给类型“Window & typeof globalThis”
  global.window = dom.window
  global.history = dom.window.history // @warn 若缺少该行，则在mdit+build环境下，编译报错：ReferenceError: history is not defined
  global.document = dom.window.document
  global.NodeList = dom.window.NodeList
  global.HTMLElement = dom.window.HTMLElement
  global.HTMLDivElement = dom.window.HTMLDivElement
  global.HTMLPreElement = dom.window.HTMLPreElement
  global.HTMLQuoteElement = dom.window.HTMLQuoteElement
  global.HTMLTableElement = dom.window.HTMLTableElement
  global.HTMLUListElement = dom.window.HTMLUListElement
  global.HTMLScriptElement = dom.window.HTMLScriptElement
  dom.window.scrollTo = ()=>{} // @warn 若缺少该行，编译警告：Error: Not implemented: window.scrollTo
  global.MutationObserver = dom.window.MutationObserver
  ```

