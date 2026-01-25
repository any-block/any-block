# 早期版本的选择器

纯文本解析识别

还有另一个版本的选择器，更好用和扩展一点

这个版本 (CodeMirror2/) 的逻辑:

- ABSelector_Md
  - autoMdSelector() 应用已经注册的选择器并选择范围
  - generateSelectorInfoTable() 生成一览表
- ABSelector_Base: 注册不同的选择器
  选择器有 metadata，且借助 metadata 实现不同功能

新版本 (CodeMirror/) 的逻辑:

- selector
  - selector() 方法应用已经注册的选择器并选择范围
  - create_decorations() 生成 CodeMirror 范围集
- selector_codeblock: 注册代码块选择器
- selector_quote: 注册纯引用块选择器
  选择器使用职责链模式处理 tokens，类 markdown-it 方案
