# ForDevelopor

(很多东西挺旧的，存档用处较多)

## 开发/设计/架构补充

（先读src下的README）

### 架构

也叫 Any Block Render (text->html时)

因为模块化内置了很多 Converter (text->text等)，所以整体叫 Any Block Converter

### 架构 - 该模块设计不应依赖于Ob插件

**这个模块以前是依赖Ob插件接口的**，后来才改成可复用的 AnyBlock 转化器。

为了高复用 (不仅仅在Ob插件上使用，还在md-it的等其他地方使用)

1. 要与选择器解耦
2. 相较于V2版本，为了不依赖于Ob底层，使用一个回调函数去替代 `MarkdownRenderer` 相关函数

### 架构 - 格式转换所在位置

> ##### 思考

例如我有两个格式：格式1（有格式1解析渲染、将自己格式转别人格式，将别人格式转自己格式）、格式2（有格式2解析渲染、将别人的格式转自己式、将自己的格式转别人的格式）。问题在于：1转2和2转1的功能，应该怎么设置？

1. 都放在两个文件中
    - 优点：两模块互相独立
    - 缺点：造成冗余，而非复用 —— 只写一遍，两个程序都用一份
2. 只放格式2
    - 思想：该方式视为先有的格式1后有的格式2扩展。或视为格式1是更通用更广泛的格式，格式2属于扩展格式，自然由格式2负责12的互转
    - 采用：abc_mermaid、abc_markmap 与 list 的转换属于此类，后期增加的新格式也属于此类
3. 1转2由2实现，2转1则由1实现
    - 思想：该方式视为1和2是两个商业软件，他们乐意于让对方的用户转移到自己这边，但并不乐意让自己的用户转到对方那边
    - 采用：list、table 的互相转换属于此类

> ##### 总结

按格式的通用性分为：(越往上通用级别越高)

1. str
2. html
3. list、table
4. mermaid、mindmap、……以后的扩展

> ##### 策略

1. 低通用级格式要实现对高通用级格式的互转
2. 同通用级则实现其他同通用级格式对自己格式的转化

### 规范 - 程序缩写

- `AnyBlock`：`AB`
- `AnyBlockConvert`：`ABC`
- `AnyBlockSelector`：`ABS`
- `AnyBlockRender`：`ABR`

## bug、踩坑记录 - npm

### 迁移到npm方式的坑

这里从源码版迁移到npm版踩了很多坑：

- 源码使用
  - 就是一开始的做法
  - 相关文件: 无
  - 使用结果: 成功
- build_tsc
  - 使用结果: 成功，但上传npm后失败
  - NPM使用结果：[ERR_MODULE_NOT_FOUND]
- build_tsup
  - 使用结果: Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'markdown-it' imported from ...
- build_vite
  - 参考: https://github.com/ebullient/markdown-it-obsidian-callouts/
  - 相关文件: package.json、tsconfig.json、vite.config.ts
  - 构建结果: 成功
  - 使用结果: Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'markdown-it' imported from ...
    安装mdit后：TypeError: Cannot read properties of undefined (reading 'prototype')
  - NPM使用结果：TypeError: Cannot read properties of undefined (reading 'prototype')
- build_rollup

解决：

- 使用报错 `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'markdown-it' imported from`
  解决方法: 后来发现是 JSDOM 的原因，暂时把他移到主项目部分了
- 使用报错 `ReferenceError: Node is not defined`
  解决方法: 暂时把 import "./converter/abc_markmap" 处理器给禁用了

### 构建测试

新测试、测试汇总

```typescript
// 新版
// import { ab_mdit } from "./plugins/ABConvertManager/MarkdownIt/dist/index.js"  // 编译版tsup (ab环境编译成功，vp环境编译失败，使用未测试)
// import { ab_mdit } from "./plugins/ABConvertManager/MarkdownIt/lib/index.js"   // 编译版rollup (编译成功，使用失败，打包缺失了很多东西，体积很小)
// import { ab_mdit } from "./plugins/ABConvertManager/MarkdownIt/dist/mdit-any-block.js"// 编译版vite (成功)
// import { ab_mdit, jsdom_init } from "./plugins/ABConvertManager/MarkdownIt/index.js"  // 源码版 (成功)
// import { ab_mdit, jsdom_init } from "markdown-it-any-block"              // npm-rsup (使用失败：error Error: Dynamic require of "node:process" is not supported)
// import { ab_mdit, jsdom_init } from "markdown-it-any-block"              // npm-vite (成功，jsdom封装问题待测试)

// 旧版
// import ab_mdit from "./plugins/ABConvertManager/dist/index_mdit.js"     // 编译版tsc (成功)
// import ab_mdit from "./plugins/ABConvertManager/dist/index_mdit"        // 编译版tsup (编译成功，使用失败 Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'markdown-it')
// import ab_mdit from "./plugins/ABConvertManager/dist/mdit-any-block.js" // 编译版vite (没记录)
// import ab_mdit from "./plugins/ABConvertManager/src/index_mdit.js"      // 源码版 (成功)
// import ab_mdit from "any-block-converter-markdown-it"                   // npm版 (成功，但需要在主项目侧添加jsdom工具。并且也忘了是哪个构建器编译出来的)
```

多个构建系统的一些旧测试

```typescript
// import ab_mdit from "./plugins/ABConvertManager/dist/index_mdit.js"     // 编译版tsc (成功)
// import ab_mdit from "./plugins/ABConvertManager/dist/index_mdit"        // 编译版tsup (使用失败 Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'markdown-it')
// import ab_mdit from "./plugins/ABConvertManager/dist/mdit-any-block.js" // 编译版vite
import ab_mdit from "./plugins/ABConvertManager/src/index_mdit.js"         // 源码版
// import ab_mdit from "any-block-converter-markdown-it"                   // npm版


// JsDom。仅用于提供document对象支持 (如果Ob等客户端渲染环境中则不需要，服务端渲染则需要)
// const { default: jsdom } = await import('jsdom')
import jsdom from "jsdom"
const { JSDOM } = jsdom
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
  url: 'http://localhost/', // @warn 若缺少该行，则在mdit+build环境下，编译报错
});
// @ts-ignore 不能将类型“DOMWindow”分配给类型“Window & typeof globalThis”
global.Storage = function () { // @warn 若缺少改行，则在不知名环境下会出现"Storage is not defined"错误
  this.temp_method = function () {
  }
}
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


export default  (md: markdownit) => {
  md.use(ab_mdit)
}
```

## bug、踩坑记录

### mdit环境下onclick需要内嵌才生效

```typescript
// TODO，onClick代码在mdit环境下按钮点击失效。测试代码如下
const btn = document.createElement("button"); table.appendChild(btn); btn.textContent = "测试按钮1";
btn.onclick = () => { console.log("btn.onclick") }
const btndiv = document.createElement("div"); table.appendChild(btndiv);
btndiv.innerHTML = `<button onclick="console.log('Button was clicked!')">测试按钮2</button>`
// 发现mdit环境下，按钮1无法正常按动，而按钮2可以
// 原因应该是：因为mdit环境下的document对象是jdsom创建的，假的。这个dom对象后面会被转化为html_str，onclick的信息就丢失了
```

### mermaid找不到DOMPurify

mermaid的一个未定义行为的报错 (不过修复了这个之后又说BBox找不到了)

```typescript
// 见：https://github.com/kkomelin/isomorphic-dompurify

// 用
import DOMPurify from "isomorphic-dompurify"
// 替换
import DOMPurify from "dompurify"
```

### npm使用可能遇到的报错

Error [ERR_MODULE_NOT_FOUND]: Cannot find module

解决见：https://stackoverflow.com/questions/65384754/error-err-module-not-found-cannot-find-module

1. 手动添加.js扩展名
2. 设置别名，
   tsconfig.json: 
   ```json
   "paths": {
      "@theme-hope/*": ["./src/client/*.js"]
    }
   ```
3. 设置环境变量 (windows设置麻烦点，见我个人网站的仓库的主repo那里写过一次，这里不写了)
   `NODE_OPTIONS='--experimental-specifier-resolution=node'`

### JSDOM 的使用导致 `Buffer$1.prototype` Cannot read properties of undefined

(使用报错：TypeError: Cannot read properties of undefined (reading 'prototype') 在 `safer.Buffer.prototype = Buffer$1.prototype;`)

这个是V3.3.0出现的。
直接在根部 import jsdom 后，npm 方式引入，就会报的一个错误。
封装成动态import函数的话，一调用也会报这个错误。

解决1 (无效)

之前提供的Storage有问题

```ts
// @ts-ignore 不能将类型“DOMWindow”分配给类型“Window & typeof globalThis”
global.Storage = function () { // @warn 若缺少改行，则在不知名环境下会出现"Storage is not defined"错误
  this.temp_method = function () {
  }
}

// 换成

global.Storage = dom.window.Storage;
```

解决2 (成功)

后来把jsdom添加到external，排除掉，不将其二次打包。还给jsdom升了个级。就可以了

### 压缩打包大小问题

可以排除依赖，压缩打包后的大小。然后别人使用你的包时，会再自动去使用对应的依赖

```ts
external: ['markdown-it', 'jsdom'], // 手动指定

// 或

external: Object.keys(pkg.dependencies || {}), // 排除所有依赖
```

### error ReferenceError: document is not defined

新版看一下是不是漏了 jsdom_init

```ts
import { ab_mdit, jsdom_init } from "markdown-it-any-block"

jsdom_init() // 如果模块根部有直接使用的，可能要改成 await jsdom_init() 同步操作

...
```
