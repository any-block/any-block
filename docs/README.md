---
# layout: OldLayout
home: true
title: AnyBlock
icon: home
heroText: AnyBlock
tagline: A module/plugin for parsing and rendering highly versatile Markdown extensions
heroStyle:
  min-height: 450px
# heroImage: /logo.png

actions:
  - text: Introduce
    icon: book
    link: "#what-s-anyblock"
  - text: Demo
    icon: list
    link: ./README.show.md  
  - text: Online
    icon: flask-vial
    link: https://any-block.github.io/any-block/

features:
  - title: Light grammar, universal format
    icon: bolt-lightning
    details: Syntax-free intrusion

  - title: Multi-platform, high versatility
    icon: bolt
    details: Supported Obsidian / Markdown-it (Vuepress/Vitepress) / CodeMirror / Remark (Quartz/Docusaurus) plugin, Online App. Supports computers, tablets and mobile devices
    link: https://lincdocs.github.io/AnyBlock/docs/en/04.%20Strong versatility.md.md

  - title: High scalability
    icon: code
    details: Facilitates further development

  - title: Flexible usage
    icon: shuffle
    details: The selection range is flexible, with six different options available

  - title: Powerful
    icon: plug
    details: Equipped with dozens of various processors, rich in variety and powerful in functionality

  - title: Simple and easy to use
    icon: box-open
    details: Easy to open and use, no configuration required. Simple grammar, quick start possible

  - title: Document is rich in content and easy to use
    icon: book
    details: Each example is accompanied by the corresponding effect and source code
    link: ./README.show.md

  - title: Available for online experience
    icon: flask-vial
    details: An online App version is provided, allowing for online experience and testing
    link: https://any-block.github.io/any-block/
---

# README

![Obsidian plugin](https://img.shields.io/endpoint?url=https%3A%2F%2Fscambier.xyz%2Fobsidian-endpoints%2Fany-block.json) ![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/LincZero/obsidian-any-block)

[中文](./README.zh.md) | [English](./README.md)

## What's AnyBlock?

- A module/plugin for parsing and rendering highly versatile Markdown extensions.  
  (**Obsidian, CodeMirror, Markdown-it (Vuepress/Vitepress), Remark (Quartz/Docusaurus) Plugin. Online App**)
- Feature: You can flexibility to create a 'Block' by many means. It also provides many useful features, like `list to table` and so on
- Feature (detail): You can select a section by list/heading/table/quote/codeBlock/markdown-it-container(`:::`), and trun into table/tabs/dir/card/column/mindmap/markmap/mermaid/PlantUML/timeLine/jsonChart/nodeTree and more

## Document / More Links

- Related links：**tutorial**、use skill、contribution、secondary development、online use
- [Effects warrior/**Tutorial**](./README.show.md), You can learn how to use it by switching between tabs.
- [Online Interaction/Demo](https://any-block.github.io/any-block/). You can write experiences here and learn usage through templates
- [Wiki](./)
- Install
  - [Install and use in Obsidian](https://lincdocs.github.io/AnyBlock/docs/en/04.%20InstallAndUse_Obsidian.html)
  - [Install and use in Vuepress/Markdown-it](https://lincdocs.github.io/AnyBlock/docs/en/04.%20InstallAndUse_VuePress.html)
- Alternate site links：When the website link to this article fails, try replacing `linczero.github.io` with `linczero-github-io.pages.dev` in the url
- [A Min-sized version of anyblock](https://github.com/any-block/obsidian-any-block-min), you can download it manually or use the BRAT plugin to download/update the obsidian plugin automatically

## Lightspot

- Syntax free
  - No new syntax、Syntax-free intrusion
  - This also leads to no excessive reliance on plugins. I think a good plugin should not cause - when you have used the plugin for a period of time, leaving it will cause the original content to deform, become unreadable or maintainable
- Extensible
  - Facilitate secondary development
- Flexible and powerful
  - Selector (Flexible)：The selection range is flexible, with six selection methods, making it simple and easy to use
  - Processor (Powerful)：Rich and diverse, powerful in function and highly scalable
- Multi-platform, strong universality
  - It can use: **Obsidian plugin, Markdown-it plugin, Online App, Vuepress plugin**
  - Blogs such as vuepress/vitepress that support markdown-it parsing

## Effects warrior / Grammar

`multiWay table`/`multiCross table`/`Cross table`

![](./assets/list2table3.png)

![](./assets/list2table32.png)

`ListTable`/`TreeTable`/`TreeGrid`

![](./assets/list2lt3.png)

Optimized list

The essence is "listtable" based on the addition of a mock list style

![](./assets/listtable_likelist.png)

Dir Tree

The essence is "listtable" based on the addition of imitation directory style

![](./assets/list2dt3.png)

ASCII Dir Tree

![](./assets/list2astreeH3.png)

WBS (Work Breakdown Structure)

![](./assets/list2pumlWBS3.png)

timeline

![](./assets/list2timeline3.png)

tabs & card 

![](./assets/tabs-and-card3.png)

mermaid flow

![](./assets/list2mermaid3.png)

plantuml mindmap

![](./assets/list2pumlMindmap3.png)

nodes (ab mindmap)

![](./assets/list2node.png)

markmap mindmap

![](./assets/list2markmap3.png)

mermaid mindmap

![](./assets/list2mindmap3.png)

The above only shows **a few of** the processors of the plugin. In fact, it **supports a wide variety of processors and functions**. The processors can be freely combined in series, and in addition to the list selector, it also supports many other selectors such as headings, code blocks, and quote blocks. For more functions, please refer to the more detailed [documentation](https://linczero.github.io/MdNote_Public/%E4%BA%A7%E5%93%81%E6%96%87%E6%A1%A3/AnyBlock/)

## Visual editing - AnyMenu

It is recommended to use together with another plugin [AnyMenu](https://github.com/any-menu/any-menu/) developed by the author of AnyBlock, which can reduce the learning cost and quickly generate templates.

![](./assets/anymenu.png)

## Effects warrior - old

Here are some of the more common processors:
- list2table  (2datatable)
- list2listtable
- list2mermaid  (graph LR)
- list2mindmap  (mermaid v9.3.0 mindmap)
- list2tab
- list2timeline
- title2list + list2somthing

![](./assets/list2table.png)

![](./assets/list2tableT.png)

![](./assets/list2lt.gif)
 
![](./assets/list2tab.gif)
 
![](./assets/list2mermaid.png)

![](./assets/list2mindmap.png)

![](./assets/titleSelector.png)

![](./assets/addTitle.png)

![](./assets/scroll.gif)
 
![](./assets/overfold.png)

![](./assets/flod.gif)

![](./assets/heimu.gif)

![](./assets/userProcessor.png)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=any-block/any-block&type=Date)](https://www.star-history.com/#any-block/any-block&Date)
