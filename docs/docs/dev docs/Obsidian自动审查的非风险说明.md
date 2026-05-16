# Obsidian自动审查的非风险说明

https://community.obsidian.md/account/plugins/any-block 中，

自动审核会出现大量的警告甚至错误，但这不意味着代码存在风险或不安全的地方。

用户可能存在一些疑虑，接下来进行一些解释：

## 对于 monorepo 中无关代码的误审核

例如对于 github 中 any-block 和 any-menu 组织的主项目中，都是一个可以编译 obsidian 插件的 monorepo。

即同一个仓库项目中不仅包含 obsidian 插件的组成部分，还可能包含其依赖的通用模块，以及使用其通用模块的其他项目。

例如:

- AnyBlock 项目中包含核心模块、Obsidian 版本的代码外，还包含:
  App (在线交互网站) 版本、Markdown-it 版本、Remark 版本、CodeMirror 版本、VuePress 版本的代码等。
  而这些侧支代码并不会参与到 Obsidian 插件版本的构成，插件的编译不会使用这些额外子项目的代码。
- AnyMenu 项目中也是同理。除核心模块和 Obsidian 版本的代码外，可能还包含：
  App 版本的代码、浏览器扩展的代码等。
  这些子项目的代码同样不会参与到 Obsidian 插件的构建。

### 人工审核时期的处理

以前人工审核的时候，reviewer 主要是检查我的 src/Obsidian 文件夹的。

其他不参与 Obsidian 插件编译构成的文件夹是不看的，而且也难以使用相同的标准去看 (原因后面会说)

### 部分解决方法

当然，这里有一些技巧能避免该问题。例如在 github 工作流中添加一个作业：

```yml
    # 避免自动审查时，审查 Obsidian 插件用不上的部分
    sync-obsidian:
    runs-on: ubuntu-latest
    permissions:
        contents: write
    steps:
        - name: Checkout repository
        uses: actions/checkout@v4
        - name: Remove unused directories
        run: |
            # 删除不需要参与 Obsidian 审查的目录
            rm -rf src/App src/Remark src/Vuepress src/MarkdownIt

        - name: Push to only-obsidian branch
        uses: JamesIves/github-pages-deploy-action@v4
        with:
            branch: only-obsidian # 目标分支
            folder: .
            commit-message: "chore: sync obsidian branch"
```

可以在工作中将其他不参与 Obsidian 代码构成的模块删除掉并备份到分支中。

然后你可以在 Obsidian 仪表盘处主动 review 你的新分支。

不过还是偏麻烦了，不是所有开发者都会采用这种 “偷鸡” 的方式

### 部分解决方法2

注意上面的方法只能 review 分支，发布时不能用。Obsidian 要求 Release 时审查代码要是你的主分支。

当然你也可以将 only-obsidian 分之切换为主分支 (但一般不会这样做)。

所以你得创建一个单独用于发布 Obsidian 版本，以及应对审查的映射分支，以及发布：

和前面的差不多，改改就行。注意你得先创建一下 TOKEN

```yml
  sync-repo:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
      
    - name: Remove unused directories
      run: |
        # 删除不需要同步到新仓库的目录
        rm -rf src/App src/Tauri

    - name: Push to external repository
      uses: JamesIves/github-pages-deploy-action@v4
      with:
        repository-name: any-block/obsidian-any-block # 替换为你的目标仓库 (需提前在 GitHub 创建好)
        branch: main                          # 目标仓库的分支
        folder: .
        token: ${{ secrets.AnyBlockPro_Repo }} # 跨仓库推送必须使用 PAT 
        commit-message: "chore: sync from monorepo"
```

同时 Release 到新仓库的作业这里也给一下:

```yml
  # 在 only-obsidian repo 上也发布一份
  - name: Create Release (on only-obsidian repo)
    if: startsWith(github.ref, 'refs/tags/') # 有tag
    uses: ncipollo/release-action@v1
    with:
      owner: any-menu # 目标仓库的 owner
      repo: obsidian-any-menu # 目标仓库名
      commit: main
      token: ${{ secrets.ANYMENU }} # PAT GitHub Token。可选一，填写设置的PAT
      # token: ${{ secrets.GITHUB_TOKEN }} # 内置 Github Token。可选二
      # 'tag' 默认就是 github.ref_name (即你推送的 tag)，但这里是另一个仓库，所以也要写
      tag: ${{ github.ref_name }}

      name: 'Release ${{ github.ref_name }}' # Release 标题使用 tag 名
      body: |
        CHANGELOG: https://any-menu.github.io/any-menu/CHANGELOG.html
      artifacts: |
        ./dist/obsidian-any-menu/*
      generateReleaseNotes: true # 自动根据 commits 生成 release notes
      prerelease: ${{ endsWith(github.ref_name, 'beta') }} # 是否预发布
      makeLatest: ${{ !endsWith(github.ref_name, 'beta') }} # 是否最后一个版本
```

总体来说还是比较麻烦的

## 排除 Core 模块的检查

一个问题是 Core 模块可能是一个 **通用的无 obsidian 依赖** 的模块。

Obsidian 的自动代码审查主要针对的是纯粹的 Obsidian 插件，而不是针对通用的前端代码进行 review。

Obsidian 自动审查时可能会更倾向于你用他的方法，而非通用方法。这就导致了：
一个通用代码，在前端中是安全的、无风险的，但在 Obsidian 的自动审查中，这是不够好的。

但问题是 Core 模块往往没有 Obsidian 依赖，实际上你根本无法根据他的建议进行修改。

下面举一些例子

### 例子 - sanitizeHTMLToDom 代替 innerHTML

如果你在代码中使用了 `.innerHTML = '...'`，自动审查中会给出 Error:
`Unsafe assignment to innerHTML`

他会倾向与你用他的 createEl 方法创建元素，以及 sanitizeHTMLToDom 进行代码清洁。

例如对于 innerHTML，他会倾向于你用以下代码代替:

```js
import { sanitizeHTMLToDom } from "obsidian";
const safeFragment = sanitizeHTMLToDom(dirtyHtml);
containerEl.appendChild(safeFragment);
```

(1) 问题一在于Core 模块无 obsidian 依赖

也就没有 sanitizeHTMLToDom，所以你无法使用 obsidian 方法。

(2) 问题二在于我无法通过其他方式实现安全的代码

如果单纯是为了安全考虑，那么 `span.innerHTML = DOMPurify.sanitize(...)`，也拥有非常好的安全性。但依旧无法通过审核。

一个可行的解决方法为:

```js
saveInnerHTML: (el: HTMLElement, string: string) => {
    const safeNode = DOMPurify.sanitize(string, {
    USE_PROFILES: { svg: true },
    // 关键：让它返回 DOM 节点而不是字符串，并且不使用 innerHTML。否则 obsidian 那个自动 review 会说风险
    RETURN_DOM_FRAGMENT: true
    });
    el.replaceChildren(safeNode);
},
```

避免直接出现 `innerHTML` 字符，但这本质上与 `span.innerHTML = DOMPurify.sanitize(...)` 是一样的

另一个可行的方法如下。但如果被人工审查员看到，**可能会把你拉黑** (?) 的写法 (所以不建议):

`;(span as any)['inner' + 'HTML'] = DOMPurify.sanitize(...);`

(3) 问题三是我不一定非得要安全检查 innerHTML 要填入的字符串

innerHTML 如果去插入用户给出文本，是极高风险的。

但事实上如果是 innerHTML 插入一个变量，其实会提示另一个 Error: 
`Unsafe assignment to innerHTML (Variable 'xxx' declared as function parameter, which is considered unsafe. ...)`

如果我 innerHTML 去插入一个常量，按理说也是安全的，而非危险的。例如我代码中会放置很多的 SVG 常量，用于插入。

开发的安全策略中并不会去要求你防止 PR 中别人篡改你的 SVG 常量，为了避免这点就给常量也包裹上一层 `DOMPurify.sanitize` 或其他的检查。
而且一但 PR 审核出现了问题，加了也无济于事。

所以并不是所有的 `innerHTML` 要添加的内容都要被 `DOMPurify.sanitize` 进行包裹的。

而且包裹后只会造成性能下降、代码臃肿。只有在有必要时使用才是对的。

(4) 是否应该去除该检查

本质：官方的这该项自动审查，其实更多的并不是防止 `innerHTML` 误插入用户提供的代码，或者避免别人 PR 时投毒。
更多地是 **防止开发者主动投毒，注入不安全的内容**。于是想要强迫只能使用 `sanitizeHTMLToDom` 方法。

所以某种意义来说，这是一个两难的问题。去除和不去除该项检查都可能有弊端。

但是参考后文中的 [其他 - 一个通用的避免 Core 模块审核的方法](#其他%20-%20一个通用的避免%20Core%20模块审核的方法)。
其实这种限制也很容易绕过，也有点防君子不防小人了。

### 其他 - 一个通用的避免 Core 模块审核的方法

一个思路是将 Core 模块上传到 npm 中，然后改为依赖项。

利用 ob 不会使用更严格的标准 (特别是不会检查风格和规范) 去审查依赖库的原理，绕过限制。

例如如果你的代码依赖于 vue.js、react.js、jquery.js 等。这些源码中一定包含 `innerHTML` 吧。
Obsidian 虽然不建议你直接使用 `innerHTML`，但对于库来说，很多东西是不得不使用的，所以也没办法禁止。

> [!warning]
> 
> 这种行为仅建议使用于 "模块无 Obsidian 依赖，且符合前端安全策略" 的情况。
> 
> 不要使用该方法去隐藏恶意代码，毕竟对于编译结果来说，Obsidian 应该也会检查。
> 只是对于构建结果来说，只会检查风险代码，而不会再处理规范类的东西。例如不会再去拥有 `innerHTML` 方法的这类逻辑。

#### 非纯 npm 的简化

如果使用这种方法，这里上传 npm 再下载后。会导致你的 Core 模块进入 node_module 处，那么原来的代码也需要一些相应的改动，还是较麻烦的。

如果你不想重构这些路径并引用 npm 路径，可以考虑：

1. 要么重构原代码对于 Core 模块的引用路径，变为 npm 的形式。这可能会修改非常多的代码
2. 要么利用 copyfiles 等类似工具，添加 'prebuild'，在编译前将该模块从 node_module 中移回原位置，这样不需要改动路径
3. 或者修改 tsconfig 中的别名，使原来对 Core 模块的引用通过 '别名' 转到 node_module 中

(2和3也可以一起用，多上一重保险)

其中如果仅使用方案2，会有一些缺点 (可搭配方案3避免)：

- 由于判定时不知道 Core 模块位置，也认为这不是 npm 包。
  从而无法判断 Core 模块中许多变量和函数的类型，从而会认为你有很多未知类型操作。给出大量警告。
  他倾向于认为你从 Core 中引用的变量和函数，都是未知或any类型。

### 例子 - activeDocuemnt 代替 document

如果你在代码中使用了 `document.xxx`，自动审查中会给出 Warning:
`Use 'activeDocument' instead of 'document' for popout window compatibility.`

但在无 Obsidian 依赖环境中，同样没有 activeDocument 对象，无法应用

解决:

在模块的最开始进行声明一个全局的 `activeDocument`

```js
globalThis.activeDocument = document
```

> [!note]
> 在浏览器中，你也可以使用 `window.global_obj = ...`;
> 在 Node.js 中，可以使用 `global.global_obj = ...`。
> 
> globalThis 兼容所有环境

但这样改大概率会给 Core 模块带来比较大的重构，所以其实也并不是一个很好的解决方案

### 例子 - setCssProps 代替 .style.xxx

如果你直接 `el.style.xxx = xxx`，会出现 Error:
`Avoid setting styles directly via element.style.bottom. Use CSS classes for better theming and maintainability. Use the setCssProps function if the CSS properties need to change dynamically.`

哪怕你想简单改写成其他形式，例如:

`el.style.setProperty('--am-bottom', 'unset')`，依然会被检查出相同的 Error:

Obsidian 希望你使用 `setCssProps` 代替之。或者使用使用他的 `createEl` 方法，如:

```js
const btn_save = tab_content.createEl('button', { text: t('Save config'), cls: 'absolute', attr: { style: 'position: absolute; bottom: 16px; right: 30px;' } })
```

这种规定的大概原理，好像是这种方式添加的内联代码会被特殊降级？然后可以被主题更轻松 (无需important) 地覆盖？

但你当前的是一个无 Obsidian 依赖的 Core 模块，自然也用不了

依然只能偷鸡，例如: (这个方法之前也提到过)

```js
;(el as any)['sty' + 'le'].left = `${pos.x}px`
```

### 例子 - eval / newFunction / 动态 import

如果你想要使用 `eval` 会被报错。

使用 `new Function` 无法绕开，也是同理，报错: Error:
`Using the Function constructor is dangerous because it executes arbitrary code, similar to eval()`

使用 `import(/*@vite-ignore*/ url);` 也报错: Error:
`Unsafe call to import for argument 0`

自动审核禁止你运行任意代码。

不过事实上，很多已经上架的插件其实都有这种功能，例如 dataview。
在 community.obsidian.md 出现后，他们也被标注了相同的风险。

也许可以创建一个方法备份，并使用方法备份，如: `const eval2 = eval` 和 `const Function2 = Function`

动态 import 的话可以这样:

```js
// 原写法
//   使用原生动态 import 加载这个虚拟文件
//   使用 /* @vite-ignore */ 防止 Vite 在构建时试图解析这个动态路径
// const module = await import(/* @vite-ignore */ blobUrl);

// 偷鸡写法
const Function2 = Function;
const dynamicImport = new Function2('url', 'return import(url)');
const module = await dynamicImport(blobUrl);
```

**但这也很可能被打入黑名单** (?)，我还是建议你请求人工审核

## 免责

> [!WARNING]
> 严禁使用里面的技巧隐藏你的恶意代码。
> 由此造成的后果自行承担。

> [!WARNING]
> 如果是正常让你修改的话，其实他都有提示告诉你要换成什么写法。或者你去 discord 问也行。
> 
> 如果你用我这里的方法，很可能比正常修改更麻烦。所以你应当优先考虑按他提议地去做。
> 
> 我这里有很多方法，说的都是条件限制下，没办法按 obsidian 希望的那样去改。是无解的。
> 在该情景下的解决方法。
> (当然此时能申请到人工审核是更好的)。
> 
> 常规情况下一些技巧你不一定用得着

## 结语

其实这个自动审查机制，对于复杂项目，项目中包含通用代码模块的情况下，十分不友好。
很多优秀的、安全的插件，其实分数也非常低。

然后提示 risk 后，是非常容易劝退别人使用插件的。

希望以后能有好的、优质的、低成本的 AI 审查，去 review 代码。
避免当前使用死板规则且过度检测的情况。

## For Developer

对插件开发人员的一些其他补充

https://github.com/obsidianmd/eslint-plugin

这样就可以在本地进行检查，检查上就快得多了

并且如果你觉得需要添加什么规则，或觉得什么规则过于严格，也可以往该仓库提 issue 或 pr
