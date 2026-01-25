import html2md from 'html-to-md'
import {
  MarkdownView,
  type MarkdownPostProcessorContext,
  type View,
} from "obsidian"

import { ConfDecoration } from "../../config/ABSettingTab"
import type AnyBlockPlugin from "../../main"
import { ABReplacer_Render } from "./ABReplacer_Render"
import { ABReg } from "@/ABConverter/ABSetting"
import { ABConvertManager } from "@/ABConverter/ABConvertManager"
import { abConvertEvent } from "@/ABConverter/ABConvertEvent";
import { ABCSetting } from '@/ABConverter/ABSetting'

/**
 * Html处理器
 * 
 * @detail
 * 被调用的可能：
 *   1. 全局html会分为多个块，会被每个块调用一次
 *      多换行会切分块、块类型不同也会切分（哪怕之间没有空行）
 *   2. 局部渲染时，也会被每个渲染项调用一次 (MarkdownRenderer.renderMarkdown方法，感觉tableextend插件也是这个原因)
 *      .markdown-rendered的内容也会调用一次（即本插件中的 .ab-note.drop-shadow 元素）
 *   3. 用根节点createEl时也会被调用一次（.replaceEl）
  *  4. 状态会缓存，如果切换回编辑模式没更改再切回来，不会再次被调用
 * 
 * 总逻辑
 * - 后处理器，附带还原成md的功能
 *   - ~~html选择器~~
 *   - 渲染器
 */
export class ABSelector_PostHtml{
  public static processor(
    this: AnyBlockPlugin,
    el: HTMLElement, 
    ctx: MarkdownPostProcessorContext
  ) {
    ABCSetting.global_ctx = ctx;

    if (this.settings.decoration_render==ConfDecoration.none) return // 若设置里不启用，直接退出
    const mdSrc: HTMLSelectorRangeSpec | null = getSourceMarkdown(el, ctx) // 获取el对应的源md
    
    // b1. RenderMarkdown引起的调用（需要嵌套寻找）
    if (!mdSrc) {
      if (false && this.settings.is_debug) console.log(" -- ABPosthtmlManager.processor, called by 'ReRender'");
      if (!el.classList.contains("markdown-rendered") // anyblock / 一些插件 / callout 都会触发 (但callout的阅读模式不触发)
        && !el.parentElement?.parentElement?.classList?.contains("block-language-dataviewjs") // 这个是dvjs的情况，再父亲才有rendered标识
        && !el.parentElement?.parentElement?.classList?.contains("block-language-dataview")
      ) return

      // callout的情况下要简化el
      const calloutEl = el.querySelector(":scope>div>div.callout-content")
      if (calloutEl) {
        el = calloutEl as HTMLElement
        el.classList.add("ab-note")
      }

      findABBlock_recurve(el)
      return
    }

    // b2. html渲染模式的逐个切割块调用（需要跨切割块寻找）
    //     Obsidian后处理机制：一个文档会被切割成成div stream，这是一个div数组，每个数组元素会在这里走一遍。即分步渲染，有益于性能优化
    else {
      // 一些基本信息
      const is_start = (mdSrc.from_line == 0 || mdSrc.content_all.split("\n").slice(0, mdSrc.from_line).join("\n").trim() == "") // 片段为md的开头 (且非cache的情况)
      const is_end = (mdSrc.to_line == mdSrc.to_line_all)   // 片段是否为md的结尾

      // #region 一些基本信息 - 是否存在内容更新、是否是 ![[wiki]] 的子页面
      // 判断核心：使用cache_map
      let is_newContent:boolean = false // 是否内容变更，若是则需要强制刷新。注意，经过后面多次判断后值才是对的
      let is_subContent:boolean = false // 是否是 `![[]]`/`![[#]]` 引起的子页面内容，后者极难检测
      let cache_item = null             // 上次缓存的该文件的内容
      // 引用判断
      ;(() => {
        /**
         * 判断是否引用显示，若是则禁用强制渲染
         * 
         * 子链接和父链接的MarkdownView是没有区别的，他们的ctx/el有区别
         * 
         * 注意: MarkdownView.file.path 获取的文件路径名和 ctx 的文件名有可能不一致，这种情况是：
         * 当文件A通过悬浮链接显示文件B时，此时叶子节点方式获取到的是文件A的的文件名，而ctx方式获取到的是文件B的文件名
         * 而这里的mdSrc对应的是对应内容的那个文件名，如果用叶子节点方式，可能产生不一致的。这里推荐只使用ctx方式
         * 
         * 理论上这里 "判断方式一" 就足以胜任工作，但这里稍有不慎很容易触发无限刷新，又冗余用其他方法多判断了几次
         */
        // 判断方式一：直接判断el的祖先节点。主要判断自引用判断 (`![](#^)`)
        const ppEl = el.parentElement?.parentElement?.parentElement
        if (!ppEl) { // 弃用。几乎没用，首次渲染时 el.parentElement 为 null，即 el 是游离状态，不在目标位置
          // is_newContent = false; is_subContent = true; return
        } else if (ppEl.classList.contains("markdown-embed-content")) { // 阅读模式: ppEl.classList.contains("markdown-reading-view")) 实时: 未知
          is_subContent = true; return
        }
        // 判断方式2.1：判断局部内容是否等于全内容。主要判断自引用判断 (`![](#^)`)
        // 哪怕误判，这种整个文章只有一个片段的情况也不会是包含anyblock的片段
        if (mdSrc.from_line == 0 && mdSrc.to_line == mdSrc.to_line_all) {
          is_subContent = true; return
        }
        // 判断方式二：内容与窗口的文件名是否一致 (切换页面时 (aIncludeB -> b)，有可能检测有问题，要用另一判断方式)
        const view: MarkdownView|null = this.app.workspace.getActiveViewOfType(MarkdownView); // 未聚焦(active)会返回null，非聚焦于md区返回null (也包括canvas、excalidraw)
        const path = view?.file?.path
        const basename = view?.file?.basename
        // 非自引用的引用子页面
        if (path && path !== ctx.sourcePath) {
          if (this.settings.is_debug) console.log(` !! Check SubPage: [${basename}] quote ![[${ctx.sourcePath}]] and no self-quote`)
          is_subContent = true; return // 注意，极难检测是否 `[[#]]`，不存cache_map，也不触发强制刷新
        }
        // 判断方式三：是否是实时模式下显示阅读模式内容
        const containerEl = view?.containerEl // .workspace-leaf-content
        // - containerEl 为空时，不强制刷新。可能是其他面板或者是 canvas (`getActiveViewOfType(MarkdownView)` 获取到的canvas等页面为空)
        // - data-type 为 excalidraw、thino_view 等时，不强制刷新。仅为 markdown 时强制刷新
        // - data-mode 为 source 等时，不强制刷新。仅为 preview 时强制刷新
        // 注意，极难检测是否 `[[file#title]]`，不存cache_map，也不触发强制刷新
        if (!containerEl) {
          if (this.settings.is_debug) console.log(` !! Check subPage, [${basename}] quote ![[${ctx.sourcePath}]] in canvas or other`)
          is_subContent = true; return
        } else if (containerEl.getAttribute('data-type') != 'markdown') {
          if (this.settings.is_debug) console.log(` !! Check subPage, [${basename}] quote ![[${ctx.sourcePath}]] in excalidraw or other`)
          is_subContent = true; return
        } else if (containerEl.getAttribute('data-mode') != 'preview') {
          if (this.settings.is_debug) console.log(` !! Check subPage, [${basename}] quote ![[${ctx.sourcePath}]] in no readmode`)
          is_subContent = true; return
        }
        // 判断方式四：极难去判断阅读模式下的自引用标题/块的情况。TODO fix bug: 这种情况会导致阅读模式的无限刷新
      })();
      // 缓存判断
      if (!is_subContent) { // 如果是子内容，则不要去更新缓存的内容
        // 先查缓存
        for (let item of cache_map) {
          if (item.name == ctx.sourcePath) {
            // b1. 有缓存过
            cache_item = item
            break;
          }
        }
        // b1. 无缓存 -> 有修改
        if (!cache_item) {
          if (this.settings.is_debug) console.log(` !! Check cache, noCache -> hasCache, null -> ${mdSrc.content_all.length}`)
          cache_item = { name: ctx.sourcePath, content: mdSrc.content_all }
          cache_map.push(cache_item)
          is_newContent = true
        }
        // b2. 有缓存
        else {
          // b2.1. 内容变 -> 有修改
          if (cache_item.content != mdSrc.content_all) {
            if (this.settings.is_debug) console.log(` !! Check cache, hasCache -> ChangeCache, ${cache_item.content.length} -> ${mdSrc.content_all.length}`)
            cache_item.content = mdSrc.content_all
            is_newContent = true
          }
          // b2.2. 内容不变 -> 无修改
          else {
            is_newContent = false
          }
        }
      }
      // #endregion

      // 若内容修改了或处于开头位置，清空页缓存 (光标缓存)
      if (is_newContent || is_start) {
        selected_els = []
        selected_mdSrc = null
      }
      if (this.settings.is_debug) {
        console.log(` -- ABPosthtmlManager.processor, called by 'ReadMode'. `+
          "[current] " + `[${mdSrc.from_line},${mdSrc.to_line})/${mdSrc.to_line_all}. `+
            `${is_start?"is_start ":""}${is_end?"is_end ":""}`+
          "[last] " + `${(selected_mdSrc && selected_mdSrc.header)?"in ABBlock: "+selected_mdSrc.header+". ":""}`
        )
      }

      // 若缓存变更，强制重新刷新
      // 如果没有这个，如果从阅读模式切换回实时模式，并只修改一部分内容再切换回阅读模式，那么 `ABPosthtmlManager.processor, called by 'ReadMode'` 只会识别到那些有改动的块，其他不再走这里
      // 本来想用旧版的 `is_onlyPart`，但不准的。因为开头片段被修改过，则判断不了，然后想象还是用回 `is_newContent` 作为判断依据
      // TODO 这里存在改进的空间，如果这里触发了实际上会渲染 n+m 次，n是受影响的div，m是全文的div。前者这里可以弄个flag来消除掉，没必要进行
      if (!is_subContent && is_newContent) {
        // 性能优化：如果不包含ab块，那就不强制刷新，以免影响正常页面
        if (cache_item && (
          /((\s|>\s|-\s|\*\s|\+\s)*)(%%)?(\[((?!toc)(?!TOC)[0-9a-zA-Z\u4e00-\u9fa5].*)\]):?(%%)?\s*\n/.test(cache_item.content) ||
          /((\s|>\s|-\s|\*\s|\+\s)*)(:::)\s?(\S*)\n/.test(cache_item.content)
        )) {
          const leaf = this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf; if (!leaf) { return }
          // const el = leaf.containerEl.querySelector(".markdown-source-view") as HTMLElement;
          // if (!el) {
          //   if (this.settings.is_debug) console.log("找不到实时模式div，不强制刷新")
          //   return
          // }
          // if (el.style.display!="none") { // 在Ctrl+鼠标悬浮方式显示的内容中，这里会被触发。但不应该强制刷新，否则页面定位会被重置          
          //   if (this.settings.is_debug) console.log("处于实时模式，不强制刷新")
          //   return
          // }
          // @ts-expect-error WorkspaceLeaf have not rebuildView
          leaf.rebuildView()
          if (this.settings.is_debug) console.log(" !! RebuildView: executed")
          return
        } else {
          // if (this.settings.is_debug) console.log(" but no anyblock content, no rebuildView", cache_item, 
          //   /((\s|>\s|-\s|\*\s|\+\s)*)(%%)?(\[((?!toc)(?!TOC)[0-9a-zA-Z\u4e00-\u9fa5].*)\]):?(%%)?\s*\n/.test((cache_item as any).content),
          //   /((\s|>\s|-\s|\*\s|\+\s)*)(:::)\s?(\S*)\n/.test((cache_item as any).content)
          // )
        }
      }

      // c21. 片段处理 (一个html界面被分成多个片段触发)
      //     其中，每一个根el项都是无属性的div项，内部才是有效信息。
      //     根el内部：
      //         一般el.children里都是只有一个项 (table/pre等)，只会循环一次
      //         特殊情况：
      //         - 是同段多行的情况 (手动br不算，是多个单换行导致的，可以是纯文字，也可以是文字和图片混搭等情况)
      //         - 图片会重复调用三次，三次的结果似乎是一样的。图片是 <div>空p, 图片, 空p</div>，前后多了个 `空p`
      //         - 不知道还有没有其他情况
      //     遍历还是只处理一个：
      //         需要注意的事项：
      //         - 不要重复识别：如 #77 的问题："阅读模式下，标题选择器和头尾选择器中，图片位于文档根部时会被重复识别"
      //         - 不要漏删除元素，元素都应该被添加起来，然后一起被删除
      //         - 同一个根el项的每个子元素的 getSourceMarkdown 数据是完全一样的
      //         即在缓存中添加content只处理一个，添加待删元素是遍历
      //         并且我们期望起始和结束标志中，根el内应当只有一个元素
      for (let i=0; i<el.children.length; i++) {
        const subEl = el.children[i];
        findABBlock_cross(subEl as HTMLElement, ctx, is_end, i)
      }
      
      // c22. 末处理钩子 (页面完全被加载后触发)
      //      ~~可-1再比较来上个保险，用可能的重复触发性能损耗换取一点触发的稳定性~~
      if (is_end) {
        findABBlock_end();
      }
    }
  }
}

/**
 * 找ab块 - 递归版 (重渲染触发)
 * 
 * @detail
 * 
 * called by 'ReRender'，每次被重渲染时从外部进入一次
 * 特点
 *  1. 递归调用
 * 
 * TODO 这里有些乱，不好管理，也许可以用 tokens 流的方式来重构这里的代码
 * @param targetEl 这里的el要符合规则：
 *   子元素包含 (p|ul|ol|pre|table)[]
 *   如果是callout这种，则应该要提取到callout-content级别，以满足以上规则
 */
function findABBlock_recurve(targetEl: HTMLElement){
  /** @fail 原来的想法无法成立……这里本来打算用来递归寻找嵌套的ab块的，
   * 但好像不行，ctx.getSectionInfo 他获取不了嵌套中el的start和end位置
   * 判断是否有header并替换元素 */
  /*if(replaceABBlock(targetEl, ctx)) return
  else if(!(targetEl instanceof HTMLPreElement)) {
    for (let targetEl2 of targetEl.children){
      findABBlock(targetEl2 as HTMLElement, ctx)
    }
  }
  // replaceABBlock(targetEl, ctx)
  // console.log("hook 准备再渲染", targetEl)
  */

  // 遍历Elements
  for(let i=0; i<targetEl.children.length; i++) {  // start form 0，因为可以递归，该层不一定需要header
    const contentEl = targetEl.children[i] as HTMLDivElement

    // #region b1. mdit选择器 (p的判断较吃资源，mdit选择器不进行递归判断)
    if (contentEl instanceof HTMLParagraphElement) {
      // 1. 头部判断
      const m_headtail = contentEl.getText().match(ABReg.reg_mdit_head_noprefix)
      if (!m_headtail || !m_headtail[3] || !m_headtail[4]) continue

      // 2. 头部正确，开始寻找尾部
      let end_index = 0;
      for(let j=i+1; j<targetEl.children.length; j++) {
        const contentEl2 = targetEl.children[j] as HTMLDivElement
        if (!(contentEl2 instanceof HTMLParagraphElement)) continue
        if (contentEl2.getText() != m_headtail[3]) continue
        end_index = j; break
      }
      if (end_index == 0) continue

      // 3. 找到尾部了。收集中间元素 (包括头尾)
      let contentHtml = "" // 要渲染的内容 不包括头尾
      const elementsToReplace: HTMLElement[] = [] // 要隐藏的元素 包括头尾
      for(let k=i; k<=end_index; k++) {
        const el = targetEl.children[k] as HTMLElement
        elementsToReplace.push(el)
        if (k>i && k<end_index) {
          contentHtml += el.outerHTML
        }
      }
      i = end_index

      // 4. 用新渲染元素替换
      const newEl = document.createElement("div")
      newEl.addClass("ab-re-rendered")
      contentEl.parentNode?.insertBefore(newEl, contentEl)
      elementsToReplace.forEach(el => el.hide())
      ABConvertManager.autoABConvert(newEl, m_headtail[4], html2md(contentHtml), "mdit")
      continue
    }
    // #endregion

    // #region b2. header选择器
    if (contentEl instanceof HTMLHeadingElement) {
      // TODO
      const selector_name = "heading"
      continue
    }
    // #endregion

    // #region b3. p(header) + 正体元素的形式 (ul/quote/pre/table等选择器)
    // 1. 寻找正体 (列表/代码块/引用块/表格)
    if (!(contentEl instanceof HTMLUListElement
      || contentEl instanceof HTMLQuoteElement
      || contentEl instanceof HTMLPreElement
      || contentEl instanceof HTMLTableElement
    )) continue
    
    // 2. 寻找头部 (查看正体的上面是不是AB选择头)
    const headerEl = i==0?null:targetEl.children[i-1] as HTMLElement|null
    if(i==0 || !(headerEl instanceof HTMLParagraphElement)) {
      if(contentEl instanceof HTMLUListElement
        || contentEl instanceof HTMLQuoteElement
      ) findABBlock_recurve(contentEl);
      continue
    }
    const header_match = headerEl.getText().match(ABReg.reg_header)
    if (!header_match) {
      if(contentEl instanceof HTMLUListElement
        || contentEl instanceof HTMLQuoteElement
      ) findABBlock_recurve(contentEl);
      continue
    }
    const header_str = header_match[5]

    // 选择器名
    let selector_name = "postHtml"
    if (contentEl instanceof HTMLUListElement) selector_name = "list"
    else if (contentEl instanceof HTMLQuoteElement) selector_name = "quote"
    else if (contentEl instanceof HTMLPreElement) selector_name = "code"
    else if (contentEl instanceof HTMLTableElement) selector_name = "table"

    // 3. 渲染，元素替换
    //const newEl = targetEl.createDiv({cls: "ab-re-rendered"})
    const newEl = document.createElement("div")
    newEl.addClass("ab-re-rendered")
    headerEl.parentNode?.insertBefore(newEl, headerEl.nextSibling)
    ABConvertManager.autoABConvert(newEl, header_str, html2md(contentEl.innerHTML), "postHtml")
    contentEl.hide()
    headerEl.hide()
    // #endregion
  }
}

/**
 * 找ab块 - 末处理 (整个阅读模式html渲染完了后才被触发)
 */
function findABBlock_end() {
  abConvertEvent(document)
}

// 缓存组，用来比较看内容是否发生了变化
// let cache_mdContent: string = ""                     // 缓存当前的内容。看是否启用强制刷新
// let cache_mdName: string = ""
// let cache_mdLine: number = 0
// let cache_mdLength: number = 0
let cache_map: {name: string, content:string}[] = [];   // 新的缓存系统。之前的有bug (多个阅读视图在同一Leaf时)，弃用
let selected_els: HTMLElement[] = [];                   // 正在选择中的元素 (如果未在AB块内，还未开始选择，则为空)
let selected_mdSrc: HTMLSelectorRangeSpec|null = null;  // 已经选中的范围   (如果未在AB块内，还未开始选择，则为空)
/**
 * 找ab块 - 跨切割块版 (阅读模式下按片触发)
 * 
 * @detail
 * 
 * called by 'ReadMode1'，在同一个文档里处理多次
 * 
 * 特点：
 *  1. 跨越AB优化的切割块来寻找
 *  2. 只为在根部的AB块，使用 MarkdownRenderChild 进行渲染
 *  3. 只寻找在根部的AB块？？？（对，目前对这个功能失效）
 * 
 * 因为是逐个片段来判断，所以判断当前片段时，可能是AB块的未激活、开头、中间、结尾。应进行操作：
 * (注意：如果是一个ab块紧接着一个ab块，开头和结尾状态是能同时存在的。先完成结尾操作再完成开头操作)
 * - 未活：不作为/将selected缓存清空
 * - 开头：将selected置为新值
 * - 中间：追加到selected缓存中
 * - 结尾：将selected缓存渲染、清空
 * - 取消：将selected缓存清空
 * 
 * TODO 阅读模式没有嵌套判断，在 quote/callout/list 内的 AnyBlock 不被识别
 * TODO 这里有些乱，不好管理，也许可以用 tokens 流的方式来重构这里的代码
 * 
 * @param sub_index 位于空div内的第几个元素，仅当为0时才应该被添加到selected_mdSrc.content中，无论为几都添加到selected_els中
 */
function findABBlock_cross(targetEl: HTMLElement, ctx: MarkdownPostProcessorContext, is_last:boolean = false, sub_index:number){
  // 寻找AB块
  const current_mdSrc = getSourceMarkdown(targetEl, ctx)
  if (!current_mdSrc) { return false }

  // c1. 在AB块内。则判断本次是否结束ab块
  if (selected_mdSrc && selected_mdSrc.header) {
    // b1. 没有startFlag
    if (!selected_mdSrc.seFlag) {
      // b11. 无需endFlag，清空并渲染
      if (current_mdSrc.type == "list" || current_mdSrc.type == "code" || current_mdSrc.type == "quote" || current_mdSrc.type == "table") {
        if (current_mdSrc.type=="list"){ // 语法糖 TODO 将弃用
          if (current_mdSrc.header.indexOf("2")==0) current_mdSrc.header="list"+current_mdSrc.header
        }
        selected_els.push(targetEl); selected_mdSrc.to_line = current_mdSrc.to_line; if(sub_index==0){selected_mdSrc.content += "\n\n" + current_mdSrc.content;}; // 追加到selected缓存
        const replaceEl = selected_els.pop()!; if (replaceEl) {ctx.addChild(new ABReplacer_Render(replaceEl, selected_mdSrc.header, selected_mdSrc.content.split("\n").slice(2,).join("\n"), selected_mdSrc.type)); for (const el of selected_els) {el.hide()}; selected_mdSrc = null; selected_els = []; } // 将selected缓存输出渲染
      }
      // b12. 找到startFlag，后面找endFlag
      else if (current_mdSrc.type == "heading" || current_mdSrc.type == "mdit") {
        selected_els.push(targetEl); selected_mdSrc.to_line = current_mdSrc.to_line; if(sub_index==0){selected_mdSrc.content += "\n\n" + current_mdSrc.content;}; // 追加到selected缓存
        selected_mdSrc.seFlag = current_mdSrc.seFlag
      }
      // b13. 找不到startFlag，放弃本次AnyBlock
      else {
        selected_mdSrc = null; selected_els = [];
      }
    }
    // b2. 有startFlag，寻找endFlag
    else {
      if ((current_mdSrc.type == "mdit_tail" || current_mdSrc.type == "mdit") && selected_mdSrc!.seFlag.length == current_mdSrc.seFlag.length) {
        selected_els.push(targetEl); selected_mdSrc.to_line = current_mdSrc.to_line; if(sub_index==0){selected_mdSrc.content += "\n\n" + current_mdSrc.content;}; // 追加到selected缓存
        const replaceEl = selected_els.pop()!; if (replaceEl) {ctx.addChild(new ABReplacer_Render(replaceEl, selected_mdSrc.header, selected_mdSrc.content.split("\n").slice(2, -1).join("\n"), selected_mdSrc.type)); for (const el of selected_els) {el.hide()}; selected_mdSrc = null; selected_els = []; } // 将selected缓存输出渲染 (注意减了末尾的:::)
      }
      else if (current_mdSrc.type == "heading" && selected_mdSrc!.seFlag.length > current_mdSrc.seFlag.length) {
        const replaceEl = selected_els.pop()!; if (replaceEl) {ctx.addChild(new ABReplacer_Render(replaceEl, selected_mdSrc.header, selected_mdSrc.content.split("\n").slice(2,).join("\n"), selected_mdSrc.type)); for (const el of selected_els) {el.hide()}; selected_mdSrc = null; selected_els = []; } // 将selected缓存输出渲染
      }
      else if (is_last) {
        selected_els.push(targetEl); selected_mdSrc.to_line = current_mdSrc.to_line; if(sub_index==0){selected_mdSrc.content += "\n\n" + current_mdSrc.content;}; // 追加到selected缓存
        const replaceEl = selected_els.pop()!; if (replaceEl) {ctx.addChild(new ABReplacer_Render(replaceEl, selected_mdSrc.header, selected_mdSrc.content.split("\n").slice(2,).join("\n"), selected_mdSrc.type)); for (const el of selected_els) {el.hide()}; selected_mdSrc = null; selected_els = []; } // 将selected缓存输出渲染
      }
      else {
        selected_els.push(targetEl); selected_mdSrc.to_line = current_mdSrc.to_line; if(sub_index==0){selected_mdSrc.content += "\n\n" + current_mdSrc.content;}; // 追加到selected缓存
      }
    }
  }

  // c2. 不在AB块内。则判断本次是否开始AB块 (注意结束和开始可以同时进行)
  if (!selected_mdSrc || !selected_mdSrc.header) {
    // b1. 现在开始
    if (current_mdSrc.type == "header" || current_mdSrc.type == "mdit") {
      selected_mdSrc = current_mdSrc; selected_els = [targetEl];
    }
    // b2. 还没开始
    else {
      selected_mdSrc = null; selected_els = [];
    }
  }

  if (is_last) {
    // 若处于AB块中直接终止
    selected_els = []
    selected_mdSrc = null
  }
}

interface HTMLSelectorRangeSpec {
  // 通用部分
  to_line_all: number // 全文片段的尾部，不包含 (已去除尾部空格) 当 to_line_all == to_line，说明片段在文章的结尾了
  from_line: number,  // div片段的头部
  to_line: number,    // div片段的尾部，不包含 - 可变
  content: string,    // 内容信息 - 可变 (已去除尾部空格)
  content_all: string,// 全文信息

  // 选择器部分
  type: string,       // 类型。6个el基本类型的基础上，paragraph多派生出 "header"/"mdit"/"mdit_tail" 3个新类型，共9种类型。而其中只有6种类型属于选择器种类
  header: string,     // 头部信息
  seFlag: string,     // 开始/结束标志 - 可变
                      //     对于nowMdSrc来说，这是当前标志，对于selectedMdSrc来说，这是结束标志
                      //     选择器flag为内联行 (如标题选择器和mdit `:::`) 才会用到，块选择器不需要使用
  prefix: string,     // 选择器的前缀 (为了去除前缀后再进行渲染)
}
/**
 * 将html还原回md格式。
 * 
 * 不负责对ab块的判断，只负责分析当前这一段html (旧版是负责对ab块判断的，新版职责分离了)
 * 
 * @detail
 * 被processTextSection调用
 * 
 * @returns
 * (旧) 三种结果
 *  1. 获取info失败：返回null
 *  2. 获取info成功，满足ab块条件：返回HTMLSelectorRangeSpec
 *  3. 获取info成功，不满足ab块：  返回HTMLSelectorRangeSpec，但header为""
 */
function getSourceMarkdown(
  sectionEl: HTMLElement,
  ctx: MarkdownPostProcessorContext,
): HTMLSelectorRangeSpec|null {
  let info = ctx.getSectionInfo(sectionEl);     // info: MarkdownSectionInformation | null
  if (!info) { return null }                    // 重渲染没有这个，为null，要阅读模式直接渲染才会有

  // 基本信息
  const {
    text,       // 全文文档
    lineStart,  // div部分的开始行
    lineEnd     // div部分的结束行（结束行是包含的，+1才是不包含）
  } = info; 
  const list_text = text.split("\n")                            // div部分的内容
  const list_content = list_text.slice(lineStart, lineEnd + 1)  // div部分的内容

  let range:HTMLSelectorRangeSpec = {
    to_line_all: list_text.length,
    from_line: lineStart, // (lineStart<3 && list_text.slice(0, lineStart).join("\n").trim() == "")?0:lineStart, // 如果前面是两个以内空行，则强行设置为0。TODO：后面还得判断metadata的情况，然后增加一个单独的 is_start
    to_line: (list_text.length-lineEnd<3 && list_text.slice(lineEnd+1, list_text.length).join("\n").trim() == "")?list_text.length:lineEnd+1, // 如果后面是两个以内空行，则强行设置为0。TODO：后面可能增加一个单独的 is_end 属性
    content: list_content.join("\n").replace(/(\n)+$/, ""), // 应当去除尾部空行而不要去除非空行的尾部空格，会影响 list2lt 的尾部空的单元格
    content_all: text,

    type: "",
    header: "",
    seFlag: "",
    prefix: "",
  }

  // 找类型、找前缀 (见range.type的定义，一共6个基本类型上，多了3个新类型，共9种类型。而其中只有6种类型属于选择器种类)
  if (sectionEl instanceof HTMLUListElement) {
    range.type = "list"
    const match = list_content[0].match(ABReg.reg_list)
    if (!match) return range
    range.prefix = match[1]
  }
  else if (sectionEl instanceof HTMLQuoteElement) {
    range.type = "quote"
    const match = list_content[0].match(ABReg.reg_quote)
    if (!match) return range
    range.prefix = match[1]
  }
  else if (sectionEl instanceof HTMLPreElement) {
    range.type = "code"
    const match = list_content[0].match(ABReg.reg_code)
    if (!match) return range
    range.prefix = match[1]
  }
  else if (sectionEl instanceof HTMLTableElement) {
    range.type = "table"
    const match = list_content[0].match(ABReg.reg_table)
    if (!match) return range
    range.prefix = match[1]
  }
  else if (sectionEl instanceof HTMLHeadingElement) {
    range.type = "heading"
    const match = list_content[0].match(ABReg.reg_heading)
    if (!match) return range
    range.seFlag = match[3]
  }
  else if (sectionEl instanceof HTMLParagraphElement) { // mdit/ab_header
    range.type = "paragraph"
    const match_header = list_content[0].match(ABReg.reg_header)
    const match_mdit_head = list_content[0].match(ABReg.reg_mdit_head)
    const match_mdit_tail = list_content[0].match(ABReg.reg_mdit_tail)
    if (match_header) {
      range.type = "header"
      range.prefix = match_header[1]
      range.header = match_header[5]
    } else if (match_mdit_head) {
      range.type = "mdit"
      range.prefix = match_mdit_head[1]
      range.seFlag = match_mdit_head[3]
      range.header = match_mdit_head[4]
    } else if (match_mdit_tail) {
      range.type = "mdit_tail"
      range.prefix = match_mdit_tail[1]
      range.seFlag = match_mdit_tail[3]
    }
  } else {
    range.type = "other"
  }

  // 旧版本方法。从文本中向上查找。如果找到了，last_el 属性缓存了 header 所对应的 el，便可以将其删掉。缺点是无法使用部分选择器 (标题和mdit)
  // 找头部header
  // let match_header
  // if (lineStart==0) { // 1. 没有上行
  //   return range
  // } else if (lineStart>2 && list_text[lineStart-1].trim()=="") { // 2. 找上上行
  //   if (list_text[lineStart-2].indexOf(range.prefix)!=0) return range
  //   match_header = list_text[lineStart-2].replace(range.prefix, "").match(ABReg.reg_header)
  // } else { // 3. 找上一行
  //   if (lineStart>1 && list_text[lineStart-1].indexOf(range.prefix)!=0 && list_text[lineStart-1].trim()=="") return range
  //   match_header = list_text[lineStart-1].replace(range.prefix, "").match(ABReg.reg_header)
  // }
  // if (!match_header) return range
  // range.header = match_header[5] // （外部通过有无header属性来判断是否是ab块）

  return range
}
