# README

![Obsidian plugin](https://img.shields.io/endpoint?url=https%3A%2F%2Fscambier.xyz%2Fobsidian-endpoints%2Fany-block.json) ![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/LincZero/obsidian-any-block)

[中文](./README.zh.md) | [English](./README.md)

## AnyBlock是什么?

- 一个高通用markdown扩展的解析和渲染的模块/插件。  
  (**Obsidian、CodeMirror、Markdown-it (Vuepress/Vitepress)、Remark (Quartz/Docusaurus) 插件, 在线App**)
- 功能: 你可以通过许多方式灵活地创建一个“块”。它还提供了许多有用的功能，如“列表转表格”等
- 功能 (详细): 你可以通过列表/标题/表格/引用块/代码块/Markdown-it的首尾`:::`等方式来快速选择一个片段，并将该片段转换为表格/标签页/目录/卡片/分栏/时间线/思维导图/plantuml图表/节点图等结果

## 文档、相关链接

- 相关链接：**教程**、使用技能、贡献、二次开发、在线使用
- [效果展示/**教程**](https://lincdocs.github.io/AnyBlock/README.show.html), 你可以通过切换里面的标签页来学习用法
- [在线交互/Demo](https://any-block.github.io/any-block/)，你可以在这里编写体验、通过模板学习用法
- [文档](https://lincdocs.github.io/AnyBlock/)
- 安装和使用
  - [在Obsidian中安装和使用](https://lincdocs.github.io/AnyBlock/docs/en/04.%20InstallAndUse_Obsidian.html)
  - [在Vuepress/Markdown-it中安装和使用](https://lincdocs.github.io/AnyBlock/docs/en/04.%20InstallAndUse_VuePress.html)
- 备用网站链接：如果网站失效，则将网站链接部分的 `linczero.github.io` 替换成 `linczero-github-io.pages.dev` 就可以了
	  （**本文的默认网站链接指向 github.io，如果国内有不能访问的朋友，那么大概率需要做这一步**）
- [体积超小的min版anyblock](https://github.com/any-block/obsidian-any-block-min)，你可以手动下载，或使用BRAT插件自动下载/更新该obsidian插件

## 亮点

- 无语法
  - 没有新语法、没有语法入侵
  - 这也导致没有过度的插件依赖。我认为好的插件不应该导致 —— 当你用了一段时间插件后，离开该插件会导致原来的内容变形，不可读或维护
- 可扩展性
  - 插件方便二次开发
- 灵活且强大
  - 选择器 (灵活)：选择范围灵活，六种选择方式，简单易用
  - 处理器 (强大)：丰富多样、功能强大、扩展性强
- 多平台, 高通用
  - 可用于: **Obsidian插件, Markdown-it插件, 在线App, Vuepress插件**
  - 支持markdown-it解析的博客，如vuepress/vitepress等

## 效果展示、语法

`多叉表格`/`跨行表格`

![](./docs/assets/list2table3.png)

![](./docs/assets/list2table32.png)

`列表格`/`树型表格`

![](./docs/assets/list2lt3.png)

优化列表

本质是 "列表格" 的基础上增加仿列表样式

![](./docs/assets/listtable_likelist.png)

目录树

本质是"列表格"的基础上增加仿目录样式

![](./docs/assets/list2dt3.png)

ascii 目录树

![](./docs/assets/list2astreeH3.png)

WBS (Work Breakdown Structure, 工作分解结构)

![](./docs/assets/list2pumlWBS3.png)

时间线

![](./docs/assets/list2timeline3.png)

标签页和卡片

![](./docs/assets/tabs-and-card3.png)

mermaid流程图

![](./docs/assets/list2mermaid3.png)

plantuml 思维导图

![](./docs/assets/list2pumlMindmap3.png)

转节点树图，AnyBlock版思维导图

![](./docs/assets/list2node.png)

markmap 思维导图

![](./docs/assets/list2markmap3.png)

mermaid 思维导图

![](./docs/assets/list2mindmap3.png)

上面只是插件的**其中的几种**处理器。实际上**还支持非常多的处理器和功能**，处理器间还能随意串行组合，并且除了列表选择器外还支持标题、代码块、引用块等诸多选择器。更多的功能参见[更多文档](https://linczero.github.io/MdNote_Public/%E4%BA%A7%E5%93%81%E6%96%87%E6%A1%A3/AnyBlock/)

## 可视化编辑 - AnyMenu

推荐与 AnyBlock 作者正在开发的另一插件 [AnyMenu](https://github.com/any-menu/any-menu/) 一同使用，可以降低学习成本与快速生成模板:

![](./docs/assets/anymenu.png)

## 旧效果展示

Here are some of the more common processors:
- list2table  (2datatable)
- list2listtable
- list2mermaid  (graph LR)
- list2mindmap  (mermaid v9.3.0 mindmap)
- list2tab
- list2timeline
- title2list + list2somthing

![](./docs/assets/list2table.png)

![](./docs/assets/list2tableT.png)

![](./docs/assets/list2lt.gif)
 
![](./docs/assets/list2tab.gif)
 
![](./docs/assets/list2mermaid.png)

![](./docs/assets/list2mindmap.png)

![](./docs/assets/titleSelector.png)

![](./docs/assets/addTitle.png)

![](./docs/assets/scroll.gif)
 
![](./docs/assets/overfold.png)

![](./docs/assets/flod.gif)

![](./docs/assets/heimu.gif)

![](./docs/assets/userProcessor.png)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=any-block/any-block&type=Date)](https://www.star-history.com/#any-block/any-block&Date)
