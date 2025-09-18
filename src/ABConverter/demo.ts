/**
 * 由于有别名模块，以及支持处理器串行。别名和demo部分均不绑定到处理器上，而是作为独立模块
 */

export type ContextMenuItem = {
  label: string
  // 如果是字符串则表示黏贴该字符串，方便声明demo模板 (TODO demo模板可能需要配图和help url?)
  callback?: string | ((str?: string) => void)
  icon?: string // 目前仅obsidian环境有效，使用lucide图标
  children?: ContextMenuItems
}
export type ContextMenuItems = ContextMenuItem[]

const root_menu_convert: ContextMenuItems = [
  { label: '未检测到选中文本 (未开发)' },
]

export const root_menu_demo: ContextMenuItems = [
  // 分类注意项: 与程序中的分类不同，这里的分类是为了方便用户查找。
  // 所以初始结构和转换后的结构都算（如表格），且更倾向于结果结构
  // 尾部最好加一个 `\n\n`

  // list
  {
    label: 'list', children: [
      { label: '列表转表格', callback: 
`[table]

- 1
  - 2
  - 3
- 2
  - 4 | <
  - 5
    - 6
    - 7\n\n` },
      { label: '列表转目录', callback: `[dir]

- vue-demo/
  - build/， 项目构建(webpack)相关代码
  - config/， 配置目录，包括端口号等。我们初学可以使用默认的
  - node_modules/， npm 加载的项目依赖模块
  - src/， 这里是我们要开发的目录
    - assets/， 放置一些图片，如logo等
    - components， 目录里面放了一个组件文件，可以不用
    - App.vue， 项目入口文件，我们也可以直接将组件写这里，而不使用 components 目录
    - main.js， 项目的核心文件。
  - static/， 静态资源目录，如图片、字体等
  - test/， 初始测试目录，可删除
  - .eslintignore
  - .gitignore， git配置
  - .index.html， 首页入口文件，你可以添加一些 meta 信息或统计代码啥的
  - package.json， 项目配置文件
  - READED.md， 项目的说明文档，markdown 格式<br>手动换行测试<br>自动换行测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试k
  - ...\n\n` },
    ]      
  },
  // mindmap
  {
    label: 'mindmap', children: [
      { label: 'node', callback: `[nodes]

- a
  - b
  - c
  - d
    - e
    - f\n\n` },
      { label: 'plantuml mindmap', callback: `[mindmap]

- a
  - b
  - c
  - d
    - e
    - f\n\n` },
      { label: 'pumlWBS', callback: `[list2pumlWBS]

- vue-demo/
  - build/
  - config/
  - node_modules/
  - src/
    - < assets/
      - < a
        - b
        - < c
      - d
      - e
    - components
    - App.vue
    - main.js
  - static/
  - test/\n\n` },
      { label: 'mermaid', callback: `[mermaid]

- 树结构
  - 基本术语
    - A
    - B(BB)
    - C(CC)
      - A
  - 性质
  - 基本运算
  - 二叉树
    - 分支1
    - 分支2\n\n` },
      { label: 'mermaid mindmap', callback: `[listroot(root((mindmap)))|list2mindmap]

- Origins
  - Long history
  - ::icon(fa fa-book)
  - Popularisation
    - British popular psychology author Tony Buzan
- Research
  - On effectiveness<br/>and features
  - On Automatic creation
    - Uses
      - Creative techniques
      - Strategic planning
      - Argument mapping
- Tools
  - Pen and paper
  - Mermaid\n\n` },
      { label: 'markmap', callback: `[list2markmap]

- Links
  - [Website](https://markmap.js.org/)
  - [GitHub](https://github.com/gera2ld/markmap)
- Related Projects
  - [coc-markmap](https://github.com/gera2ld/coc-markmap) for Neovim
  - [markmap-vscode](https://marketplace.visualstudio.com/items?itemName=gera2ld.markmap-vscode) for VSCode
  - [eaf-markmap](https://github.com/emacs-eaf/eaf-markmap) for Emacs
- Features
  - Lists
    - **strong** ~~del~~ *italic* ==highlight==
    - \`inline code\`
    - [x] checkbox
    - Katex: $x = {-b \pm \sqrt{b^2-4ac} \over 2a}$ <\!-- markmap: fold -->
    - [More Katex Examples](#?d=gist:af76a4c245b302206b16aec503dbe07b:katex.md)
    - Now we can wrap very very very very long text based on \`maxWidth\` option\n\n` }
    ]
  },
  // table
  {
    label: 'table', children: [
      { label: '列表转表格', callback: 
`[table]

- 1
  - 2
  - 3
- 2
  - 4 | <
  - 5
    - 6
    - 7\n\n` },
      { label: '合并表格', callback: 
`[exTable]

|*A*| a | < |
|---|---|---|
| ^ | 2 | 3 |\n\n` },
    ]
  },
  // heading
  {
    label: 'heading', children: [
      { label: '标题转表格', callback: () => console.warn('执行了操作2.2.1') },
    ]
  },
  // callout
  {
    label: 'callout', children: [
      { label: 'note', callback: `> [!note]\n> \n> Note demo.\n\n` },
      { label: 'warning', callback: `> [!warning]\n> \n> Warning demo.\n\n` },
      { label: 'tip', callback: `> [!tip]\n> \n> Tip demo.\n\n` },
      { label: 'note_complex', callback: `> [!note]+ title\n> Note demo.\n\n` },
    ]
  },
  // mdit container
  {
    label: 'mdit container', children: [
      { label: 'note', callback: `:::note\nNote demo.\n:::\n\n` },
      { label: 'warning', callback: `:::warning\nWarning demo.\n:::\n\n` },
      { label: 'tip', callback: `:::tip\nTip demo.\n:::\n\n` },
      { label: 'note_complex', callback: `:::note+ title\nNote demo.\n:::\n\n` },
    ]
  },
  // two layout
  {
    label: 'two layout', children: [
      { label: 'col', callback: `:::col

@col

text1

@col

text2

@col

text3

:::\n\n` },
      { label: 'tabs', callback: `:::tabs

@tab title1

text1

@tab title2

text2

@tab title3

text3

:::\n\n` },
    ]
  },
]

export const root_menu: ContextMenuItems = [
  // TODO 转换菜单需要选中文本且文本满足一定规则才会显示，并根据内容进行推荐
  { label: 'AnyBlock', icon: 'list-plus', children: root_menu_demo },
  // { label: '转化为AnyBlock', icon: 'list-plus', children: root_menu_convert }
]
