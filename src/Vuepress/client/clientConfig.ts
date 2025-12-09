/**
 * 用于自动触发 abConvertEvent
 * 
 * 主要影响：nodes、card瀑布流 等处理器
 */

import { defineClientConfig, usePageData } from 'vuepress/client'
import { nextTick, watch } from 'vue'
import MarkdownIt from 'markdown-it'

// import { abConvertEvent } from '../ABConvertManager/ABConverter/ABConvertEvent.js' // anyblock - 源码版
// import '../ABConvertManager/ABConverter/style/styles.css';                         // anyblock - 源码版
import { abConvertEvent, ABConvertManager } from 'markdown-it-any-block'              // anyblock - npm版
import '../../../../../node_modules/markdown-it-any-block/styles.css';                // anyblock - npm版
const CLIENT_MODE = false

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default defineClientConfig({
  setup() {
    if (typeof document == 'undefined') return
    newPageHook_init()
  },
})

/**
 * 调用：客户端加载时被调用
 */
function newPageHook_init (
  delay = 1000,
  showInMobile = false,
): void {
  // 一些参数准备
  // console.log("newPageHook_init")
  const page = usePageData()
  const enabled = true

  /**
   * 全局 - 事件
   * 
   * 调用频率：每个页面加载出来后被调用一次
   */
  const newPageHookFn = async (): Promise<void> => {
    // console.log("newPageHook_fn", page.value.path)
    await nextTick()
    await wait(delay/4) // 分两次更新，能确保响应够快，同时慢修改加载慢的东西
    if (CLIENT_MODE) render_anyblock_fence()
    abConvertEvent(document)
    await wait(delay/4*3)
    abConvertEvent(document)
  }

  /**
   * 事件触发的开始位置
   * 
   * 注意这里的watch需要有vue组件的支持
   * 
   * 每个页面加载出来后会自动调用一次。原理：监听 page.value.path 和 enabled.value，两个值中任意一个发生变化时触发回调
   */
  watch(() => [page.value.path, enabled], newPageHookFn, {
    immediate: true,
  })
}

// ---------------- ABConvertManager 相关 ----------------

const md = new MarkdownIt()
ABConvertManager.getInstance().redefine_renderMarkdown((markdown: string, el: HTMLElement): void => {
  el.classList.add("markdown-rendered")
  
  const result: string = md.render(markdown)
  const el_child = document.createElement("div"); el.appendChild(el_child); el_child.innerHTML = result;
})

/**
 * client 端渲染，较于 node 端渲染缺点:
 * 
 * - 缺少url修正，vuepress中可能图片等资源的路径会被改变，在client端无法指向
 * - 缺少选择器类型，一些别名可能会失效
 * - 无法使用 node 端生效的 markdown-it 插件，只能用原生的 markdown-it 进行再渲染
 */
function render_anyblock_fence() {
  const blocks = document.querySelectorAll('div.language-anyblock')

  blocks.forEach((el: HTMLElement) => {
    const codeEl = el.querySelector('pre code') || el.querySelector('pre')
    if (!codeEl) return
    const content: string = codeEl.textContent

    // take from anyblock index_mdit.ts
    // 抽离指令头和内容
    let lines = content.split('\n')
    let ab_header: string|undefined = lines.shift()
    if (typeof ab_header === 'undefined') { return }
    const match = ab_header.match(/\[(.*)\]/)
    if (!match || match?.length < 1) { return }
    ab_header = match[1]
    let ab_content: string = lines.join('\n')
    ab_content = ab_content.trimStart() // TODO 这里去除了空行以外的前面空格，是否存在问题

    // anyBlock专属渲染
    // public static autoABConvert(el:HTMLDivElement, header:string, content:string, selectorName:string = "", ctx?: any): void
    el.style.display = 'none'
    const newEl = document.createElement('div'); el.after(newEl); newEl.classList.add("ab-note", "drop-shadow");
    ABConvertManager.autoABConvert(newEl, ab_header, ab_content, '', undefined)
  })
}
