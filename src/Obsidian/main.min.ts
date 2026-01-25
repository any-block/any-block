/**
 * 入口文件
 * 
 * 接管三个处理点：
 * - 代码块"ab" (代码块)
 * - cm (实时模式)
 * - 接管渲染后 (渲染/阅读模式)
 */

import {
  MarkdownRenderChild, MarkdownRenderer, loadMermaid, Plugin, MarkdownView,
  type MarkdownPostProcessorContext
} from 'obsidian'

// 转换器模块
import { ABConvertManager, ABCSetting } from "@/ABConverter/index.min" // [!code hl] min

import { ABReplacer_CodeBlock } from "./ab_manager/abm_code/ABReplacer_CodeBlock"
import { ABStateManager, global_timer } from "./ab_manager/abm_cm/ABStateManager"
import { ABSelector_PostHtml } from "./ab_manager/abm_html/ABSelector_PostHtml"
import { registerCommands, registerStatus } from './utils'
import { ABSettingTab, AB_SETTINGS, type ABSettingInterface } from "./config/ABSettingTab"
import { ABAlias_json } from '@/ABConverter/ABAlias'

export default class AnyBlockPlugin extends Plugin {
  settings: ABSettingInterface

  async onload() {
    ABCSetting.obsidian.global_app = this.app
    await this.loadSettings()
    this.addSettingTab(new ABSettingTab(this.app, this))

    // 添加 obsidian 命令和UI元素
    registerStatus(this)
    registerCommands(this)

    // 适配 - 将ob的渲染行为传入回调函数 (目的是将转换器和Obsidian相解耦合)
    ABConvertManager.getInstance().redefine_renderMarkdown((markdown: string, el: HTMLElement, ctx?: MarkdownPostProcessorContext): void => {
      el.classList.add("markdown-rendered")

      /*
       * Renders markdown string to an HTML element.
       * @deprecated - use {@link MarkdownRenderer.render}
       * 
       * 原定义： 
       * @param markdown - The markdown source code
       * @param el - The element to append to
       * @param sourcePath - The normalized path of this markdown file, used to resolve relative internal links
       *     此标记文件的规范化路径，用于解析相对内部链接
       *     TODO 我可能知道为什么重渲染图片会出现bug了，原因应该在这里
       * @param component - A parent component to manage the lifecycle of the rendered child components, if any
       *     一个父组件，用于管理呈现的子组件(如果有的话)的生命周期
       * @public
       * 
       */
      //MarkdownRenderer.renderMarkdown(markdown, el, this.app.workspace.activeLeaf?.view?.file?.path??"", new MarkdownRenderChild(el))

      const mdrc: MarkdownRenderChild = new MarkdownRenderChild(el);
      if (ctx) ctx.addChild(mdrc);
      else if (ABCSetting.obsidian.global_ctx) ABCSetting.obsidian.global_ctx.addChild(mdrc);
      /**
       * Renders markdown string to an HTML element.
       * @param app - A reference to the app object
       * @param markdown - The markdown source code
       * @param el - The element to append to
       * @param sourcePath - The normalized path of this markdown file, used to resolve relative internal links
       * @param component - A parent component to manage the lifecycle of the rendered child components.
       * @public
       */
      MarkdownRenderer.render(this.app, markdown, el, this.app.workspace.getActiveViewOfType(MarkdownView)?.file?.path??"", mdrc)
    })

    // 适配 - mermaid
    ABCSetting.obsidian.mermaid = loadMermaid()
    // ABCSetting.obsidian.mermaid.then(mermaid => {
    //   const isDarkTheme = document.body.classList.contains('theme-dark')
    //   const theme = isDarkTheme ? 'dark' : 'light' // theme: theme
    //   mermaid.initialize({ theme: theme }) // 只初始化一次，减少频繁调用。但ob提供的版本，mermaid多了也会卡，不知道为什么
    // })

    // 钩子组1 - 代码块
    this.registerMarkdownCodeBlockProcessor("ab", ABReplacer_CodeBlock.processor);
    this.registerMarkdownCodeBlockProcessor("anyblock", ABReplacer_CodeBlock.processor);
    
    // 钩子组2 - 非渲染模式 cm扩展 - StateField
    {
      let abm: ABStateManager|null
      // 刚启动插件时触发
      this.app.workspace.onLayoutReady(()=>{
        abm?.destructor();
        abm = new ABStateManager(this)
      })
      // 新打开文件，和两个不同的已经打开文件标签页之前切换会触发
      this.registerEvent(
        this.app.workspace.on('file-open', (fileObj) => {
          abm?.destructor();
          abm = new ABStateManager(this)
        })
      )
      // 新打开文件，以及切换聚焦布局触发。修复 Obsidian V1.5.8 导致的bug，之前版本不需要这个
      this.registerEvent(
        this.app.workspace.on('layout-change', () => {
          abm?.destructor();
          abm = new ABStateManager(this)
        })
      )
    }

    // 钩子组3 - 渲染模式 后处理器
    const htmlProcessor = ABSelector_PostHtml.processor.bind(this)
    this.registerMarkdownPostProcessor(htmlProcessor)

    console.log('>>> Loading plugin AnyBlock Min')
  }

  async loadSettings() {
    const data = await this.loadData() // 如果没有配置文件则为null
    this.settings = Object.assign({}, AB_SETTINGS, data) // 合并默认值和配置文件的值

    // 应用自定义别名
    for(const result of this.settings.alias_user) {
      let newReg: string|RegExp;
      if (/^\/.*\/$/.test(result.regex)) {
        newReg = new RegExp(result.regex.slice(1,-1)) // 去除两侧的`/`并变回regExp
      } else {
        newReg = result.regex
      }
      ABAlias_json.push({
        regex: newReg,
        replacement: result.replacement
      })
    }

    // 同步到通用设置 (一致性，from obsidian专属设置)
    ABCSetting.is_debug = this.settings.is_debug
    ABCSetting.pro.disable = this.settings.pro.disable
    ABCSetting.pro.enable_callout_selector = this.settings.pro.enable_callout_selector

    // 同步到文件 (读取也执行一次，避免没配置文件/配置文件错误/新版本增加了新的配置选项)
    this.saveData(this.settings)
  }
  async saveSettings() {
    // 同步到通用设置 (一致性，from obsidian专属设置)
    ABCSetting.is_debug = this.settings.is_debug
    ABCSetting.pro.disable = this.settings.pro.disable
    ABCSetting.pro.enable_callout_selector = this.settings.pro.enable_callout_selector

    // 同步到文件
    await this.saveData(this.settings)
  }

  onunload() {
    console.log('<<< Unloading plugin AnyBlock Min')
    if (global_timer !== null) { window.clearInterval(global_timer) }
  }
}
