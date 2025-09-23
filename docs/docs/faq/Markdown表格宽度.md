---
create_date: 2025-09-24
last_date: 2025-09-24
author: LincZero
---

# Markdown 表格宽度

## 方案一: div片段占宽

```md
| 1 | 2<div style="width:200px"></div> |
|---| -------------------------------- |
| 3 | 4                                |
```

- 优点
  - 结构简单、通用性好
- 缺点
  - 只适合当某列宽度过窄时，避免不必要的换行而撑开
  - 宽度不是绝对的，只允许撑开不允许缩小 (缩小要修改所有其他列，很麻烦)
  - 只支持px
  - 与文字混合，当修改div所在位置的文字内容时，需重新修改大小

## 方案二: AnyBlock 的 width 处理器

```md
[width(30,70)]

| 1 | 2 |
|---|---|
| 3 | 4 |
```

- 优点
  - 声明简单、清晰
  - AnyBlock 多种不同平台的插件，通用性较好
    (包括obsidian/codemirror/markdown-it/支持markdown-it的vuepress/vitepress等平台)
  - 支持百分比和px (默认百分比)

## 方案三: Markdown-it-attrs

与方案一非常类似，相较于方案一，由于其属性作用于td而非td内的div，所以弥补了一些缺点，改进点: 

- 宽度是绝对的，允许撑开和缩小
- 不与文字混合，其属性作用于td元素。当修改属性所在位置的文字内容时，无需重新修改大小

## 方案四: Obsidian一些带宽度信息的表格插件

- [obsidian-table-x](http://github.com/letlll/obsidian-table-x): 这个是表格插件、允许拖拽
  - 优点: 半代码块形式，非代码块部分能跨平台正常显示
  - 缺点: 半代码块形式，代码块部分有些冗余
- Simple Columns: 这个另外说一下，不是表格插件，但其宽度可以被拖拽。可以借鉴成表格
  - 缺点: 完全是代码块形式的
