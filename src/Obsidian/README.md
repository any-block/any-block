# 开发README

## 编译与发布

### 编译

```bash
pnpm i
pnpm build
```

### 使用

然后复制这三个文件：

- main.js
- manifest.json
- styles.css

本地使用就复制到 .obsidian/插件名文件夹/

发布到 Github Release 也是发布这三个文件

### 发布到社区 - 手动

1. 打包产物更新到Release里
2. 记得检查更新 manifest.json 和 package.json 里的版本号 (最好是在项目搜索 `"version": "3.1."` 然后修改，面得漏改了)
    (发布才改，并需要保证github release有东西了。平时别乱改，ob社区仓库好像会自动发现你改了然后就更新过去)
3. 更新到GitHub，代码推送更新
4. 不再需要去Obsidian社区那个仓库里更新他的那个json里的版本号 (你manifest.json修改了他那边会自动更新)

### 发布到社区 - Github Action 自动

参考：[Using GitHub actions to release plugins](https://forum.obsidian.md/t/using-github-actions-to-release-plugins/7877)

## 程序设计

这部分更多的内容我会写到公开md笔记里，去官网看

### 转化器与选择器模块

整个Ob插件的核心分为两个部分：

- 主插件，`AnyBlock`，代码缩写 `AB`
    - 转换器，`AnyBlockConvert`，代码缩写 `ABC`
        - 用法：将txt转化为html
        - 特征：通用、可扩展
        - 类别：可以动态注册各种转换器 (2mermaid、2lt、2mindmap等)
    - 管理器，`AnyBlockManager`，代码缩写 `ABM`
        - 用法：由于替换器和选择器是一起的，这里就合起来了
        - 类别
            - 在Obsidian中，这个支持Ob的三种选择器：
                - 代码块选择器，代码缩写 `ABS_CodeBlock` (自带选择器)
                - CM选择器，代码缩写 `ABS_CM`
                - 后选择器，代码缩写 `ABS_Html`
            - 在VuePress中，这个也支持多种选择器：
                - Markdown-it 的 TokensStream
                - `:::` 选择器 (markdown-it-container)
            - 其他 TokensStream 或 AST 架构的软件
        - 再包含
            - 选择器 `AnyBlockSelector`，代码缩写 `ABS`
                - 用法：选择范围，并返回范围值
                - 特征：定义通用、实现不通用、可扩展
                - 类别：可以动态注册各种选择器 (list、table、quote、codeblock等，其中codeblock选择器一般是内置了的)
            - 替换器，`AnyBlockReplacer`，代码缩写 `ABR`
                - 用法：选择器选择完范围后，替换器将这部分范围的东西交给转换器，并将转换后的结果替换掉原内容
                - 特征：非通用、不可扩展
            
其中每个**区域**需要都实现一遍**替换器**和**选择器**。即实现数是他俩的乘积

（其中：CodeBlock 一般自带选择器，一般来说无需再次选择。除非存在嵌套 AnyBlock 的情况）

## Dev Note

注意一些迁移问题：anyblock的开发过程中，obsidian也在更新。有些接口是发生过改变的

### Deprecated activeLeaf

```ts
// old
this.plugin_this.app.workspace.activeLeaf.containerEl

// new
this.plugin_this.app.workspace.getActiveViewOfType(MarkdownView).containerEl

// 区别-1, dom
- div.workspace-leaf.mod-active // el2
  - hr.workspace-leaf-resize-handle
  - div.workspace-leaf-content[data-type="markdown"][data-mode="source"]

// 区别-2
// el1的用法是新的，el2的用法弃用了，且el1能保证当前活跃窗口下的是Markdown编辑区域

// 区别-3
// el1 api完全兼容el2
(this.plugin_this.app.workspace.getActiveViewOfType(MarkdownView).leaf == this.plugin_this.app.workspace.activeLeaf)
```

```ts
// old
import  { type View } from 'obsidian';
const view: View|null = this.plugin_this.app.workspace.activeLeaf.file.view; // 未聚焦(active)会返回null

// new
import  { MarkdownView } from 'obsidian';
const view: MarkdownView|null = this.plugin_this.app.workspace.getActiveViewOfType(MarkdownView); // 未聚焦(active)会返回null

// 区别：如果是View类型，这里会下面都要ts-ignore。而用MarkdownView就不需要了
this.view = view
// ts-ignore 这里会说View没有file属性
this.initialFileName = this.view.file.basename
// ts-ignore 这里会说View没有editor属性
this.editor = this.view.editor
// ts-ignore 这里会说Editor没有cm属性
this.editorView = this.editor.cm
this.editorState = this.editorView.state
```

### Deprecated readerMarkdown

```ts
MarkdownRenderer.renderMarkdown(...) // 旧
MarkdownRenderer.render(...) // 新

// 一个区别是：新版能更好地支持内部的图片显示
```

### Other

```ts
// new
el.empty();
el.addChild(sanitizeHTMLToDom(html));

// old
insertAdjacentHTML("beforeend", "xxx")

// old
innerHTML = "xxx"

// 区别:
// insertAdjacetHTML插入，不清空内容（但还是解析HTML，只安全一点点）
// sanitizeHTMLToDom 更安全
```

> [!quote]
> Use window.setTimeout, window.clearTimeout, window.setInterval, window.clearInterval instead of their versions without window.
> 
> Use number instead of NodeJs.Timeout.

原因：和JS 运行环境以及TypeScript 的类型推断机制有很大关系。

用 window.setTimeout 明确表示你要用浏览器的实现，确保返回值是 number，而不是 Node.js 下的 Timeout 对象。
