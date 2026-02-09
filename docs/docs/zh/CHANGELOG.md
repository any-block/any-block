# AnyBlock 更新日志

按时间倒序展示

## 3.4.1-beta3 (2025-12-24)

- feat
  - 新的可展开工具栏、工具栏添加 "复制功能"
  - *Vuepress* 版本支持客户端渲染 (默认服务端渲染)
  - 新增 *remark* 版本 (目前仅测试应用于 Quartz 框架)
- fix
  - 状态栏 refresh 按钮弹出文本提示的位置优化 @Moy

## 3.4.1-beta2 (~~2025-11-27~~ 2025-12-01)

- 功能
  - 添加上下文菜单 (这部分功能已转移给同作者的 [AnyMenu](https://github.com/any-menu/any-menu/) 插件)
  - 状态栏添加: 强制刷新按钮
  - `listdata2task` 处理器、`task2` 别名系统
  - echarts 类别的多个处理器，需要配合同作者的 [Charts](https://github.com/any-block/obsidian-charts) 插件使用
    - echarts树图 `list2echarts_tree` 及其多个分支 (方向、径向、折线)
    - echarts旭日图 `list2echarts_sunburst`
    - echarts甘特图 `list2echarts_gantt`
  - anyblock块tooltip添加更多按钮、复制按钮
- 增强
  - min版本尺寸异常，进一步压缩 min 版和 pro 版体积
  - 使用标签页美化设置面板
  - pro版: 显示有效期、使用双许可证策略
  - markdown-it 选择器在阅读模式下得到更好的支持
  - 完善了阅读模式的重渲染模式时机
- 修复
  - dir处理器的折叠存在问题: 祖先折叠应该着影响直系儿子而非所有后代
  - anyblock 的 markdown-it 版本，在最新版本的 vuepress 中存在异常
  - 联动: 提升了在 thino 中使用的体验
- 文档
  - 新增: 表格宽度、timeline、样式说明2、anymenu联动说明，时序图、echarts、echarts插件联动说明 等内容 (未完全完成)

## 3.4.0-beta (2025-09-05)

- 功能
  - app版本的codemirror版本完成！
  - 允许在app版本的codemirror版本中体验pro版功能！
  - 可视化编辑相关 (Pro版) #80
    - 部分效果演示： https://github.com/any-block/any-block/discussions/189
    - 重构：为处理器提供可视化编辑所需要的可选的更多的上下文
    - 可视化编辑计划第一期：callout、exTable (半成品)、col、tabs
    - (doing) 右键菜单
- 增强
  - FAQ 处理器语法泛化
  - debug模式下显示块id，便于调试和检查更新频率
  - 文档
    - 部分文档易误解部分的修正
    - 重构在线演示中的demo构建逻辑，添加更多的demo，并使后续demo易于扩展
    - 首页文档图片全部更新为效果和源码并存
- 修复
  - 修复 data2list 的缩进数异常，以修复 title2list 的缩进数异常
  - 部分资源 (定时任务) 没有随着关闭插件而卸载
  - list2listdata 时缩进缺失 #191
  - 当修改anyblock相关内容后，阅读模式没有强制渲染 (上上版本的一个修复引起的bug)
- 重构
  - 重写重构处理器上下文，为Pro版准备接口（详见可视化编辑部分）
  - 重写新版选择器，新版的适用于CodeMirror通用环境的选择器模块
  - 完善了多视窗时（如左实时模式，右阅读模式）时的显示逻辑
  - 依赖
    - 整体更新了一遍依赖
    - 完成 “可编辑块” 模块项目
    - 完成 “Cm” 模块项目：重写和扩展选择器，支持callout选择器 (in non-obsidian)
    - 完成 “Pro” 模块项目：重写部分处理器为可视化编辑的版本

> [!warning]
> Pro版使用了不同的依赖，体积稍微上升，且目前处于beta阶段，稳定性需要一定时间的测试
> 像 [min版本](https://github.com/any-block/obsidian-any-block-min) 一样，也是一个独立的版本
> Pro版仅新增可视化编辑相关的东西，其余功能和语法将会与非Pro版保持一致，以获取最大的通用性

## 3.3.2 patch4 (2025-08-02)

- Feat
  - 新增 `strictTable` 处理器，用于配合表格转置使用
  - 在线演示页面添加 codemirror 在线 (半成品，等下版本完成)
- Enhance
  - 重构了一些代码写法和换用ob api (接受了一次obsidian的二次代码审查)
  - 重构了表格相关的处理器，封装复用部分代码 `TableMap`
- Fix
  - 最小自动刷新频率 `1000 -> 500ms`
  - markmap 带公式则渲染存在问题 #177
  - 笔记自己引用自己的部分段落时，可能存在无限刷新 #171
  - activityDiagram 处理器使用 `match` 关键字代替 `switch` 关键字则存在问题 #168
  - 代码块选择器被嵌套使用时，未能正确处理空格前缀
  - 移动端编辑按钮优化 #183 (显示尺寸似乎被移动端限制了，但实际可点击区域设置回正常了)
- Docs
  - 更好地支持多语言
  - 合并表格、一些链接的修复、文档主页美化

## 3.3.1 (2025-07-05)

- 破坏性修改
  - 处理器列表命令 `info` 与 `callout info` 冲突，更名为 `info_converter`
  - 横向滚动正则优化：`/^scroll(\((\d+)\))?(T)?$/` -> `/^scroll(X)?(\((\d+)\))?$/`
- 功能
  - 使用新处理器 mdit2code 解决 markdown-it-container 嵌套问题的案例
- 增强
  - mdit2code 会处理 @ 符为 h1
  - 不再使用markdown方式渲染 dir/dt 处理器的文件名 (因为 `01. 文件名` 这样的文件名会变成块元素: 列表)
- 修复
  - `listtable|fold` 的特殊组合失效 (上版本修改引起)
  - dir/dt 处理器的文件夹名后面有空格时，尾 `/` 无法被正常识别
  - `2table|width` 的组合，后者失效 (无法识别到ab转换过来的表格) #161
  - `callout __` 处理器的 `+-` 符识别存在问题
  - fix activityDiagram @J0HN50N133 
  - 上版本新增的刷新增强功能失效
- 样式
  - tabs 处理器的悬浮光标
- 重构
  - 重构了cm装饰集部分代码，**光标进出anyblock块时，减少了重渲染部分，提升了性能**
  - 优化了mermaid的依赖，减少了非min版的插件体积
  - 新的处理器组别: 代码文本类
  - 重构 app/markdown-it 版的 markdown-it-container 选择器
    - 使用黑白名单机制
    - 允许嵌套

---

上版本热修补丁 2025-05-11

- 修复: xQuote 处理器失效 #167
- 功能: 添加 callout xxx 处理器
- 功能: 添加 mdit2code 处理器

## 更多

更往前的更新日志详见: https://github.com/any-block/any-block/releases
