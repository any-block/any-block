import type {MarkdownPostProcessorContext} from "obsidian"
import{
  MarkdownRenderChild,
  MarkdownRenderer,
  sanitizeHTMLToDom,
} from "obsidian";
import { ABConvertManager } from "@/ABConverter/ABConvertManager";
import { abConvertEvent } from "@/ABConverter/ABConvertEvent";
import { ABCSetting, ABReg } from "@/ABConverter/ABReg";
import { ABReplacer_Widget } from "../abm_cm/ABReplacer_Widget";

export class ABReplacer_CodeBlock{
  static processor(
    // plugin_this: AnyBlockPlugin,             // 使用bind方法被绑进来的
    src: string,                                // 代码块内容。注意：如果是被列表嵌套的代码块，则内容每行前面都会有对应的缩进 (ob的锅)
    blockEl: HTMLElement,                       // 代码块渲染的元素
    ctx: MarkdownPostProcessorContext,
  ) {
    ABCSetting.global_ctx = ctx;

    const root_div = document.createElement("div");  blockEl.appendChild(root_div); root_div.classList.add("ab-replace");
    const list_src = src.split("\n")

    // 判断当前是实时还是阅读模式、判断处于重渲染中的还是阅读模式渲染的
    // (可以通过ctx来判断)
    // ts-ignore 类型“MarkdownPostProcessorContext”上不存在属性“containerEl”
    // if (!ctx.containerEl?.classList.contains("cm-scroller")) {
    //   console.log("rerender-env")
    // }

    // 判断是否AnyBlock块
    let header: string = ""
    let header_indent_prefix: string = "" // 头部缩进前缀，后面的内容统一减掉这个前缀
    if (list_src.length) {
      const match = list_src[0].match(ABReg.reg_header_noprefix)
      if (match && match[5]) {
        header = match[5];
        header_indent_prefix = match[1];
      }
    }
    

    // AnyBlock主体部分
    const dom_note = root_div.createDiv({
      cls: ["ab-note", "drop-shadow"]
    })
    let dom_replaceEl = dom_note.createDiv({
      cls: ["ab-replaceEl"]
    })
    if (header != "") { // b1. 规范的AnyBlock
      ABConvertManager.autoABConvert(dom_replaceEl, header,
        list_src.slice(1).map((line) =>
          line.startsWith(header_indent_prefix) ? line.substring(header_indent_prefix.length) : line
        ).join("\n")
      )
    }
    else { // b2. 非法内容，普通渲染处理 (还是说代码渲染会更好？主要是普通渲染便于对render接口进行调试，比较方便)
      // const mdrc: MarkdownRenderChild = new MarkdownRenderChild(dom_replaceEl); ctx.addChild(mdrc);
      // MarkdownRenderer.render(app, src, dom_replaceEl, app.workspace.getActiveViewOfType(MarkdownView)?.file?.path??"", mdrc);
      ABConvertManager.getInstance().m_renderMarkdownFn(src, dom_replaceEl, ctx)
    }

    // 编辑按钮部分
    // codeblock自带编辑按钮，不需要额外追加

    // 刷新按钮部分
    let dom_edit = root_div.createEl("div", {
      cls: ["ab-button", "ab-button-2", "edit-block-button"],
      attr: {"aria-label": "Refresh the block"}
    });
    dom_edit.empty(); dom_edit.appendChild(sanitizeHTMLToDom(ABReplacer_Widget.STR_ICON_REFRESH));
    dom_edit.onclick = ()=>{abConvertEvent(root_div);}

    // 控件部分的隐藏
    const button_show = ()=>{dom_edit.show()}
    const button_hide  = ()=>{dom_edit.hide()}
    button_hide()
    dom_note.onmouseover = button_show
    dom_note.onmouseout = button_hide
    dom_edit.onmouseover = button_show
    dom_edit.onmouseout = button_hide
  }
}
