# Alias别名系统

有些处理器并不是独立的最小单位，而是由多个处理器串联组成。这样可以提高处理器代码的复用率。

**（由于代码初期没有别名系统，所以会有一些处理器，本可以使用处理器串联完成，却还是有单独的处理器。这部分处理器会在后期的优化中逐渐变为通过别名系统实现）**

这里的版本是代码版本，多了一些类型区分：

> [!warning]
> 
> 此处不一定最新
> 
> 可以使用 `[info_alias]` 处理器随时查表，而且那个可以显示用户自定义的别名。
> 
> 也可以到项目的 `ABAlias.ts` 文件查看最新版

```js
// 允许带参数的部分 (这部分的遍历会更耗时间。为了性能考虑，单独拿出来)
const ABAlias_json_withSub: ABAlias_json_item[] = [
  { regex: /\|(note|warning|caution|attention|error|info|danger|tip|hint|example|abstract|summary|tldr|quote|cite|todo|success|check|done|important|question|help|faq|failure|fail|missing|bug)([+-]?)(\s.*)?\|/, replacement: "|add([!$1]$2$3)|addQuote|" },
  { regex: /\|(callout|alert) ([^+-\s]+)([+-]?)\s?(.*)\|/, replacement: "|add([!$2]$3 $4)|addQuote|" }, // 注意避免和原上/上面的callout语法冲突，以及自身递归
]

// mdit块
const ABAlias_json_mdit: ABAlias_json_item[] = [
  {regex: /\|::: 140lne\|(2?tabs?|标签页?)\|/, replacement: "|mditTabs|"},
  {regex: "|::: 140lne|demo|", replacement: "|mditDemo|"},
  {regex: "|::: 140lne|abDemo|", replacement: "|mditABDemo|"},
  {regex: /\|::: 140lne\|(2?col|分栏)\|/, replacement: "|mditCol|"},
  {regex: /\|::: 140lne\|(2?card|卡片)\|/, replacement: "|mditCard|"},
  {regex: /\|:::_140lne\|(2?chat|聊天)\|/, replacement: "|mditChat|code(chat)|"},
]

// 标题块
const ABAlias_json_title: ABAlias_json_item[] = [
  {regex: "|title2list|", replacement: "|title2listdata|listdata2strict|listdata2list|"},

  // title - list&title
  {regex: /\|heading 140lne\|2?(timeline|时间线)\|/, replacement: "|title2timeline|"},
  {regex: /\|heading 140lne\|2?(tabs?|标签页?)\||\|title2tabs?\|/, replacement: "|title2c2listdata|c2listdata2tab|"},
  {regex: /\|heading 140lne\|2?(col|分栏)\||\|title2col\|/, replacement: "|title2c2listdata|c2listdata2items|addClass(ab-col)|"},
  {regex: /\|heading 140lne\|2?(card|卡片)\||\|title2card\|/, replacement: "|title2c2listdata|c2listdata2items|addClass(ab-card)|addClass(ab-lay-vfall)|"},
  {regex: /\|heading 140lne\|2?(nodes?|节点)\||\|(title2node|title2abMindmap)\|/, replacement: "|title2listdata|listdata2strict|listdata2nodes|"},

  // list  - 多叉多层树
  {regex: /\|heading 140lne\|2?(flow|流程图)\|/, replacement: "|title2list" + "|list2mermaid|"},
  {regex: /\|heading 140lne\|2?(puml)?(mindmap|脑图|思维导图)\|/, replacement: "|title2list" + "|list2pumlMindmap|"},
  {regex: /\|heading 140lne\|2?(markmap|mdMindmap|md脑图|md思维导图)\|/, replacement: "|title2list" + "|list2markmap|"},
  {regex: /\|heading 140lne\|2?(wbs|(工作)?分解(图|结构))\|/, replacement: "|title2list" + "|list2pumlWBS|"},
  {regex: /\|heading 140lne\|2?(table|multiWayTable|multiCrossTable|表格?|多叉表格?|跨行表格?)\|/, replacement: "|title2list" + "|list2table|"},

  // list - lt树 (属于多层一叉树)
  {regex: /\|heading 140lne\|2?(lt|listTable|treeTable|listGrid|treeGrid|列表格|树形表格?)\|/, replacement: "|title2list" + "|list2lt|"},
  {regex: /\|heading 140lne\|2?(list|列表)\|/, replacement: "|title2list" + "|list2lt|addClass(ab-listtable-likelist)|"},
  {regex: /\|heading 140lne\|2?(dir|dirTree|目录树?|目录结构)\|/, replacement: "|title2list" + "|list2dt|"},

  // list - 二层树
  {regex: /\|heading 140lne\|(fakeList|仿列表)\|/, replacement: "|title2list" + "|list2table|addClass(ab-table-fc)|addClass(ab-table-likelist)|"},
]

// 列表块
const ABAlias_json_list: ABAlias_json_item[] = [
  {regex: "|listXinline|", replacement: "|list2listdata|listdata2list|"},

  // list - list&title
  {regex: /\|list 140lne\|2?(timeline|时间线)\|/, replacement: "|list2timeline|"},
  {regex: /\|list 140lne\|2?(tabs?|标签页?)\||\|list2tabs?\|/, replacement: "|list2c2listdata|c2listdata2tab|"},
  {regex: /\|list 140lne\|2?(col|分栏)\||\|list2col\|/, replacement: "|list2c2listdata|c2listdata2items|addClass(ab-col)|"},
  {regex: /\|list 140lne\|2?(card|卡片)\||\|list2card\|/, replacement: "|list2c2listdata|c2listdata2items|addClass(ab-card)|addClass(ab-lay-vfall)|"},
  {regex: /\|list 140lne\|2?(nodes?|节点)\||\|(list2node|list2abMindmap)\|/, replacement: "|list2listdata|listdata2strict|listdata2nodes|"},

  // list  - 多叉多层树
  {regex: /\|list 140lne\|2?(flow|流程图)\|/, replacement: "|list2mermaid|"},
  {regex: /\|list 140lne\|2?(puml)?(mindmap|脑图|思维导图)\|/, replacement: "|list2pumlMindmap|"},
  {regex: /\|list 140lne\|2?(markmap|mdMindmap|md脑图|md思维导图)\|/, replacement: "|list2markmap|"},
  {regex: /\|list 140lne\|2?(wbs|(工作)?分解(图|结构))\|/, replacement: "|list2pumlWBS|"},
  {regex: /\|list 140lne\|2?(table|multiWayTable|multiCrossTable|表格?|多叉表格?|跨行表格?)\|/, replacement: "|list2table|"},

  // list - lt树 (属于多层一叉树)
  {regex: /\|list 140lne\|2?(lt|listTable|treeTable|listGrid|treeGrid|列表格|树形表格?)\|/, replacement: "|list2lt|"},
  {regex: /\|list 140lne\|2?(list|列表)\|/, replacement: "|list2lt|addClass(ab-listtable-likelist)|"},
  {regex: /\|list 140lne\|2?(dir|dirTree|目录树?|目录结构)\|/, replacement: "|list2dt|"},

  // list - 二层树
  {regex: /\|list 140lne\|(fakeList|仿列表)\|/, replacement: "|list2table|addClass(ab-table-fc)|addClass(ab-table-likelist)|"},
]

// 代码块
const ABAlias_json_code: ABAlias_json_item[] = [
  {regex: "|code 140lne|X|", replacement: "|Xcode|"},
]

// 引用块
const ABAlias_json_quote: ABAlias_json_item[] = [
  {regex: "|quote 140lne|X|", replacement: "|Xquote|"},
]

// 表格块
const ABAlias_json_table: ABAlias_json_item[] = [
]

// 通用，一般是装饰处理器
const ABAlias_json_general: ABAlias_json_item[] = [
  {regex: "|黑幕|", replacement: "|add_class(ab-deco-heimu)|"},
  {regex: "|折叠|", replacement: "|fold|"},
  {regex: "|滚动|", replacement: "|scroll|"},
  {regex: "|超出折叠|", replacement: "|overfold|"},
  {regex: "|转置|", replacement: "|transpose|"},
  // 便捷样式
  {regex: "|红字|", replacement: "|addClass(ab-custom-text-red)|"},
  {regex: "|橙字|", replacement: "|addClass(ab-custom-text-orange)|"},
  {regex: "|黄字|", replacement: "|addClass(ab-custom-text-yellow)|"},
  {regex: "|绿字|", replacement: "|addClass(ab-custom-text-green)|"},
  {regex: "|青字|", replacement: "|addClass(ab-custom-text-cyan)|"},
  {regex: "|蓝字|", replacement: "|addClass(ab-custom-text-blue)|"},
  {regex: "|紫字|", replacement: "|addClass(ab-custom-text-purple)|"},
  {regex: "|白字|", replacement: "|addClass(ab-custom-text-white)|"},
  {regex: "|黑字|", replacement: "|addClass(ab-custom-text-black)|"},
  {regex: "|红底|", replacement: "|addClass(ab-custom-bg-red)|"},
  {regex: "|橙底|", replacement: "|addClass(ab-custom-bg-orange)|"},
  {regex: "|黄底|", replacement: "|addClass(ab-custom-bg-yellow)|"},
  {regex: "|绿底|", replacement: "|addClass(ab-custom-bg-green)|"},
  {regex: "|青底|", replacement: "|addClass(ab-custom-bg-cyan)|"},
  {regex: "|蓝底|", replacement: "|addClass(ab-custom-bg-blue)|"},
  {regex: "|紫底|", replacement: "|addClass(ab-custom-bg-purple)|"},
  {regex: "|白底|", replacement: "|addClass(ab-custom-bg-white)|"},
  {regex: "|黑底|", replacement: "|addClass(ab-custom-bg-black)|"},
  {regex: "|靠上|", replacement: "|addClass(ab-custom-dire-top)|"},
  {regex: "|靠下|", replacement: "|addClass(ab-custom-dire-down)|"},
  {regex: "|靠左|", replacement: "|addClass(ab-custom-dire-left)|"},
  {regex: "|靠右|", replacement: "|addClass(ab-custom-dire-right)|"},
  {regex: "|居中|", replacement: "|addClass(ab-custom-dire-center)|"},
  {regex: "|水平居中|", replacement: "|addClass(ab-custom-dire-hcenter)|"},
  {regex: "|垂直居中|", replacement: "|addClass(ab-custom-dire-vcenter)|"},
  {regex: "|两端对齐|", replacement: "|addClass(ab-custom-dire-justify)|"},
  {regex: "|大字|", replacement: "|addClass(ab-custom-font-large)|"},
  {regex: "|超大字|", replacement: "|addClass(ab-custom-font-largex)|"},
  {regex: "|超超大字|", replacement: "|addClass(ab-custom-font-largexx)|"},
  {regex: "|小字|", replacement: "|addClass(ab-custom-font-small)|"},
  {regex: "|超小字|", replacement: "|addClass(ab-custom-font-smallx)|"},
  {regex: "|超超小字|", replacement: "|addClass(ab-custom-font-smallxx)|"},
  {regex: "|加粗|", replacement: "|addClass(ab-custom-font-bold)|"},
]
```
