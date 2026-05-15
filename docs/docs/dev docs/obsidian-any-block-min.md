# obsidian-any-block-min

## Min version

- en
  - obsidian-any-block mini version. Remove some features and dependencies to reduce size and improve performance.
  - See [AnyBlock](https://github.com/any-block/any-block)'s introduction for details
  - Please ⭐ star the aforementioned warehouse instead of this one.
  - Mainly deleted mermaid, plantuml, markmap related dependencies and try to ensure the function, in order to obtain memory and load speed improvement.
    For reference (v3.2.1), the size is 8.82MB -> 262KB, and the startup time is 424ms -> 30ms
  - Removed the parts in the AnyBlock monorepo that were not part of the Obsidian plugin composition, to prevent other parts from being automatically reviewed by Obsidian.
  - The repository is only used for distribution to the plugin community, source code and compilation is still done by [AnyBlock](https://github.com/any-block/any-block).
    The contents of this warehouse are automatically synchronized by the main warehouse workflow.
- zh
  - AnyBlock 的迷你版。删除一些特性和依赖项以减小尺寸并提高性能
  - 详请见 [AnyBlock](https://github.com/any-block/any-block) 的介绍
  - 请给上述仓库而非该仓库 ⭐ Star
  - 主要删除了mermaid、plantuml、markmap相关依赖并尽量保证功能，以获得内存和加载速度的提升。
    提升幅度参考 (v3.2.1): 尺寸 8.82MB -> 262KB, 启动时间 424ms -> 30ms / 159ms -> 5ms (视设备性能而定)
  - 删除了 AnyBlock monorepo 中的其他不参与 Obsidian 插件构成的部分，避免其他部分被 Obsidian 自动 review
  - 该仓库仅用于插件社区的发布，源码及编译依然由 [AnyBlock](https://github.com/any-block/any-block) 进行。
    该仓库的内容由主仓库工作流进行自动同步。

## How to use mermaid/plantuml/markmap in min version

虽然min版不再内置mermaid/plantuml/markmap包，但这仅意味着编辑体验有所下降，对应功能并不一定就完全用不了。

- 例如你可以安装 mindmap-nextgen 插件并配合使用：https://lincdocs.github.io/AnyBlock/docs/zh/05.%20%E7%B2%BE%E5%BD%A9%E7%94%A8%E4%BE%8B.html#mindmap-nexgen
- 例如你依然可以使用mermaid，只是对应的库由插件内置改为ob内置的版本。但这会有一些编辑上的不流程的影响 (误刷新问题)，但整体其实也不算太影响
- 例如你可以配合 mehrmaid 插件，来代替 mermaid，也行。参考: https://lincdocs.github.io/AnyBlock/docs/zh/05.%20%E7%B2%BE%E5%BD%A9%E7%94%A8%E4%BE%8B.html#mehrmaid

(这部分的文档后续会补充更多)
