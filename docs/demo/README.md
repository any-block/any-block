# AnyBlock Online Demo

> [!warning]
> 此页及所属文件夹内文件，仅用于anyblock的在线demo。
> 如果你是从文档中误进入这里，请跳转到 https://any-block.github.io/any-block/ 更好地查看! (可查看对应源码及在线交互)
> 
> The files in this page and the associated folder are only for the online demo of AnyBlock.
> If you have mistakenly entered here from a document, please jump to https://any-block.github.io/any-block/ for a better view! (You can view the corresponding source code and interact online.)

> [!note]
> App版使用说明
> 
> - `^` 点击编辑区域 (MdEditor标签页) 上面的预设下拉框，可以切换其他demo
> - 这里有多个标签页，你可以在 MdEditor 或 MdCodeMirror 中编辑，
>   然后在 MdViewer (markdown-it版插件渲染) 或
>   MdCodeMirror (CodeMirror版插件渲染) 中查看效果

this is ~~a~~ **MarkDown** *test*

[list2table]

- 1
  - 2
  - 3
- 2
  - 4 | <
  - 5
    - 6
    - 7

[list2lt]

- < Company name<br>公司名| Superior section<br>上级部门| Principal<br>负责人| Phone<br>电话
- ==ABC head office==| | | 
  - **Shanghai branch**| ==ABC head office==  | ZhangSan| 13&xxxxxxxx
    - Marketing section| **Shanghai branch** | LiSi| 
      - Marketing Division 1| | | 
      - Marketing Division 2| | | 
    - Sales section| **Shanghai branch** | WangWu| 15&xxxxxxxx
  - *Beijing branch*| ==ABC head office==  | ChenLiu| 16&xxxxxxxx
    - Technical division| *Beijing branch* | OuYang| 17&xxxxxxxx
    - Finance| *Beijing branch* | HuangPu| 
      |self    |father  |mother  |
      |--------|--------|--------|
      |201xxxxx|202xxxxx|203xxxxx|

[nodes]

- a
  - b
  - c
  - d
    - e
    - f

[mindmap]

- a
  - b
  - c
  - d
    - e
    - f

[markmap]

- a
  - b
  - c
  - d
    - e
    - f

[list2dt]

- vue-demo/
  - build/， 项目构建(webpack)相关代码
  - config/， 配置目录，包括端口号等。我们初学可以使用默认的
  - node_modules/， npm 加载的项目依赖模块
  - src/， 这里是我们要开发的目录
    - assets/， 放置一些图片，如logo等
    - components， 目录里面放了一个组件文件，可以不用
    - App.vue， 项目入口文件，我们也可以直接将组件写这里，而不使用 components 目录
    - main.js， 项目的核心文件。
  - static/， 静态资源目录，如图片、字体等
  - test/， 初始测试目录，可删除
  - .eslintignore
  - .gitignore， git配置
  - .index.html， 首页入口文件，你可以添加一些 meta 信息或统计代码啥的
  - package.json， 项目配置文件
  - READED.md， 项目的说明文档，markdown 格式<br>手动换行测试<br>自动换行测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试k
  - ...

[list2astreeH|code()]

- vue-demo/
	- build/
	- config/
	- src/
		- assets/
			- a/
				- b
		- components
	- .babelrc
	- .editorconfig
	- ...

[list2pumlWBS]

- vue-demo/
  - build/
  - config/
  - node_modules/
  - src/
    - < assets/
      - < a
        - b
        - < c
      - d
      - e
    - components
    - App.vue
    - main.js
  - static/
  - test/

[list2tab]

- linux
  - 可以通过执行以下命令在终端中使用 apt 包安装程序：
    ```shell
    apt-get install python3.6
    ```
- windows
  - 转到官方 Python 站点，并导航到最新版本。在撰写本文时，即 `3.10.6`。
  - 下载适用于您平台的二进制文件。执行二进制。
  - 除了将 Python 添加到 `PATH` 之外，您不需要选择任何选项，因为默认安装程序具有您需要的一切。只需单击“安装”即可。
- macOS
  - 转到官方 Python 站点，并导航到最新版本。在撰写本文时，即 `3.10.6`。
  - 下载适用于您平台的二进制文件。执行二进制。
  - 在 Mac 上，这将默认在 dmg 安装程序中完成。

[list2card|addClass(ab-col3)]

- card1
  card1_item<br>$1+1=2$
- card2
  card2_item
  ```js
  var a = 1
  ```
- card3
  card3_item
  **Bold** *italics* ==highlight== ~~delete~~
  - list1
  - list2
  - list3
