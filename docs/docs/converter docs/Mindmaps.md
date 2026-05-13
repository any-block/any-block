# AnyBlock Mindmaps

当前AnyBlock支持多种类mindmap

## list2table

[list2table]

- a
  - a111111
  - a2
    - a21
    - a22
- b

评价：

- 优点：简单、同一level的项可以垂直对齐

## mermaid

[list2mermaid]

- a
  - a111111
  - a2
    - a21
    - a22
      - a
- b

评价：

- 优点：简单、AnyBlock中唯一一个允许回环的图
- 缺点：禁用符号过多 (部分可以通过节点别名解决)

## mermaid mindmap

[list2mindmap]

- root
  - a
    - a111111
    - a2
      - a21
      - a22
        - a
  - b


评价：

- 优点：方向四散，不拘泥于某个方向。多叉情况下的紧凑性和空间利用性是最好的
- 缺点：禁用符号过多 (部分可以通过节点别名解决)


## plantUml

[list2pumlMindmap]

- a
  - a11111111111111
    - a12
    - a13
    - a14
    - a15
    - a16
  - a2
      - a
- b

评价：

- 优点：简单简洁、同一level的项无需垂直对齐、很强的垂直空间利用率
## markmap

[list2markmap]

- a
  - a111111
  - a2
    - a21
    - a22
      - a
- b

评价：

- 优点：可渲染md内容、同一level的项无需垂直对齐
- 缺点：渲染md的部分由markmap库操作

## pumlJson

[list2json|json2pumlJson]

- root
  - a
    - a111111: 23333
    - a2
      - a21
      - a22
        - a
  - b
评价：

- 在时嵌套简单对象时嵌套复杂结构时，可能会有用。总体来说渲染json比较适合
- 垂直利用率高，水平利用率差

## nodes

[nodes]

- root
  - a
    - a111111
    - a2
      - a21
      - a22
        - a
  - b

评价：

- 优点：
  - 简洁
  - 可渲染md内容，且md渲染行为由ob提供 (意味着支持ob链接、图片、标签、插件行为等)
  - 同一level的项无需垂直对齐
- 缺点：暂不支持像markmap那种缩放拖拽，不支持节点隐藏和展开 (这个理论可做，等issue多不多人提)

## Mehrmaid

这个不是 AnyBlock 插件的内容。但AnyBlock V3.2.0 对该插件进行了配合优化，可以使用 `mehrmaid` 处理器快速生成符合Mehrmaid语法的代码并渲染

- 优点：在mermaid的基础上增加了md渲染内容的支持，且md渲染行为由ob提供
- 缺点：主要是mermaid语法层次上的缺点 (anyblock进行补强)，以及容易受主题影响产生不稳定情况

## 总结

如果有一些特殊需求，那么就选能满足特殊需求的：

- 同level的项垂直对齐：仅list2table可以做到
- 有回环连接：仅mermaid可以做到（如果需要追加md渲染可以使用Mehrmaid插件）
- md渲染需求
  - 仅markmap和nodes可以做到
  - 如果要求有ob渲染行为：仅nodes可以做到
  - （或使用Mehrmaid插件也能做到）
- 节点折叠展开：仅markmap可以做到

没有这些需求的话，我个人的使用习惯是：很简单的用 pumlMindmap，复杂的用 nodes
