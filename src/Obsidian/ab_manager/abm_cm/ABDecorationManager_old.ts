/**
 * 该文件已废弃
 */

import {EditorView, Decoration} from "@codemirror/view"
import type {Extension} from "@codemirror/state"

import type { ABStateManager } from './ABStateManager';
import type { MdSelectorRangeSpec } from "./ABSelector_Md"
import { ABReplacer_Widget } from "./ABReplacer_Widget"

interface CursorSpec{
  from:number, 
  to:number
}

/**
 * 装饰管理器
 * 
 * @detail
 * TODO: 现在这个文件和类没什么用了，基本可以优化掉了
 * @param r_this 其中传入r_this的作用主要是为了装饰块可能可以返过来设置光标位置
 * @return 返回一个Decoration
 */
export class ABDecorationManager{
  rangeSpec: MdSelectorRangeSpec
  cursorSpec: CursorSpec
  decoration: Decoration
  isBlock: boolean
  r_this: ABStateManager

  customData: {
    cancelFlag: number[],
    updateMode: string
  } = {
    cancelFlag: [],
    updateMode: '',
  }

  // 构造函数
  constructor(r_this: ABStateManager, rangeSpec: MdSelectorRangeSpec, cursorSpec:CursorSpec){
    this.rangeSpec = rangeSpec
    this.cursorSpec = cursorSpec
    this.r_this = r_this

    let from = rangeSpec.from_ch
    let to = rangeSpec.to_ch
    let cfrom = cursorSpec.from
    let cto = cursorSpec.to
    // 如果光标位置在块内，则不启用块，仅使用高亮
    if (cfrom>=from && cfrom<=to || cto>=from && cto<=to) {
      this.isBlock = false
    }
    else {
      this.isBlock = true
    }

    this.decoration = this.initDecorationSet()
  }

  initDecorationSet(): Decoration{
    if (!this.isBlock) {
      return Decoration.mark({class: "ab-line-brace"})
    }
    else{ // text:string, item:SpecKeyword, editor:Editor
      return Decoration.replace({widget: new ABReplacer_Widget(
        this.rangeSpec, this.r_this.editor, this.customData
      )})
    }
  }

  /* 直接写到css里代替之
  static decoration_theme():Extension{
    return [
      EditorView.baseTheme({
        ".ab-line-brace": { textDecoration: "underline 1px red" }
      }),
      EditorView.baseTheme({
        ".ab-line-list": { textDecoration: "underline 1px cyan" }
      }),
      EditorView.baseTheme({
        ".ab-line-yellow": { textDecoration: "solid underline 1px rgba(0, 255, 0, 0.2)" }
        // ".ab-line-yellow": { borderLeft: "solid 1px rgba(0, 255, 0, 0.4)" } // 这种方式对于 `:::` 是对的，但对其他来说，段落不一定是行开头。可能导致一行有多个左边框
      }),
      EditorView.baseTheme({
        ".ab-line-blue": { textDecoration: "underline 1px blue" }
      })
    ]
  }*/
}
