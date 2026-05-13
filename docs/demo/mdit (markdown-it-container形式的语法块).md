# mdit (markdown-it-container形式的语法块)

## 八种选择器

我把 markdown 中 “选择一段范围” 的方式分为8种，其中 AnyBlock 支持七种选择器。

这些选择器各有优缺点

详见: 

- en: [Selector](https://lincdocs.github.io/AnyBlock/docs/en/03.%20Selector.html)
- zh: [选择器](https://lincdocs.github.io/AnyBlock/docs/zh/03.%20%E9%80%89%E6%8B%A9%E5%99%A8.html)

这里介绍传统的代码块选择器、以及 markdown-it-container 选择器

## 代码块选择器

```anyblock
[蓝字]

It is blue color text
```

```anyblock
[table|width(20)]

- It is a **multicross table**
  - fork1
  - fokr2
```

## markdown-it-container

注意：

- 该选择器在 vuepress 中由 markdown-it-container 以及基于该插件的其他插件提供功能。
- 仅在 obsidian、该App在线版本中，才由 anyblock 插件提供功能

:::col|width(25,50,25)

@col

text1

@col

text2

@col

text3

:::


:::tabs

@tab title1

text1

@tab title2

text2

@tab title3

text3

:::

:::card

@card card1

text1

@card card2
 
text2

:::

## markdown-it-container 嵌套

嵌套方式和代码块一样，通过 `:` 的数量不同进行嵌套 (一般是更多的 `:` 层去嵌套更少的)

:::::tabs

@tab title1

::::note

It's a note.

:::warning

It's warning!

:::

::::

::::card|addClass(ab-col2)

@card card1

text1

:::note

It's a note.

:::

@card card2
 
text2

::::

@tab title2

text2

@tab title3

text3

:::::


:::warning

注意：在 obsidian 中 markdown-it-container 的嵌套原理，与在 app 或 markdown-it 版本中的不同。

因为 obsidian 中对于重新渲染方法，并没有提供一个比较好的接口去处理重渲染的内容，只能从html中去反推解析。

所以obsidian中的实现本质上需要通过 `mdit2code` 处理器，将markdown-it-container块转换为代码块，将 `@` 转换为标题，以此支持mdit的嵌套

:::

tab的嵌套有点特殊，区分不开 `@tab` 符号，得改写为其他方式，如使用标题选择器：

````anyblock
[tab]

# 1

[tab]

## 1.1

1.1

[tab]

### 1.1.1

1.1.1

### 1.1.2

## 1.2

# 2
````
