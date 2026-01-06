/**
 * 入口文件
 * 
 * 接管三个处理点：
 * - 代码块"ab" (代码块)
 * - cm (实时模式)
 * - 接管渲染后 (渲染/阅读模式)
 * 
 * 这里会依赖部分pro的资源，为避免编译器静态检测 @/Pro/xxx 是否存在导致非pro环境报错，
 * 注意要确保 tsconfig.json 将该文件排除
 */

import {
  MarkdownRenderChild, MarkdownRenderer, loadMermaid, Plugin, MarkdownView,
  setIcon,
  type MarkdownPostProcessorContext
} from 'obsidian'

// 转换器模块
import { ABConvertManager, ABCSetting } from "@/ABConverter/index"
ABCSetting.env = "obsidian-pro"
import "@/Pro/src/index.ob" // [!code hl] obsidian-pro

import { onUpdateLicense } from "@/Pro/src/index.ob" // [!code hl] obsidian-pro 许可证模块
// const onUpdateLicense: () => Promise<number> = () => Promise.resolve(-1) // [!code hl] obsidian-pro 许可证模块 降级版

import { ABReplacer_CodeBlock } from "./ab_manager/abm_code/ABReplacer_CodeBlock"
import { ABStateManager, global_timer } from "./ab_manager/abm_cm/ABStateManager"
import { ABSelector_PostHtml } from "./ab_manager/abm_html/ABSelector_PostHtml"
import { ABSettingTab, AB_SETTINGS, type ABSettingInterface, expiry } from "./config/ABSettingTab"

export default class AnyBlockPlugin extends Plugin {
  settings: ABSettingInterface

  async onload() {
    ABCSetting.global_app = this.app
    await this.loadSettings();
    this.addSettingTab(new ABSettingTab(this.app, this))

    // 右下角状态栏 - 刷新按钮
    {
      const statusBtnContainer = this.addStatusBarItem();
      statusBtnContainer.addClass('mod-clickable');

      const statusBtn = statusBtnContainer.createEl('div', {
        cls: 'ab-rebuildview-btn'
      })

      setIcon(statusBtn, 'refresh-cw');
      statusBtn.setAttribute('aria-label', 'Rebuild View');
		  statusBtn.setAttribute('data-tooltip-position', 'top');
      statusBtn.onclick = () => {
        const leaf = this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf; if (!leaf) { return }
        // @ts-expect-error
        leaf.rebuildView()
      }
    }

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
      else if (ABCSetting.global_ctx) ABCSetting.global_ctx.addChild(mdrc);
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
    ABCSetting.mermaid = loadMermaid()
    ABCSetting.mermaid.then(mermaid => {
      const isDarkTheme = document.body.classList.contains('theme-dark')
      const theme = isDarkTheme ? 'dark' : 'light'
      mermaid.initialize({ theme: theme }) // 只初始化一次，减少频繁调用。但ob提供的版本，mermaid多了也会卡，不知道为什么
    })

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

    console.log('>>> Loading plugin AnyBlock Pro')
  }

  async loadSettings() {
    const data = await this.loadData() // 如果没有配置文件则为null
    this.settings = Object.assign({}, AB_SETTINGS, data) // 合并默认值和配置文件的值

    // 如果没有配置文件则生成一个默认值的配置文件
    if (!data) {
      this.saveData(this.settings)
    }
    expiry.expiry = await onUpdateLicense(this.settings.license_key) // [!code hl] obsidian-pro
  }

  async saveSettings() {
    // 部分配置项需要保持一致性
    ABCSetting.is_debug = this.settings.is_debug

    await this.saveData(this.settings)
    expiry.expiry = await onUpdateLicense(this.settings.license_key) // [!code hl] obsidian-pro
  }

  onunload() {
    console.log('<<< Unloading plugin AnyBlock Pro')
    if (global_timer !== null) { window.clearInterval(global_timer) }
  }
}
