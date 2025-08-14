/**
 * 如果是 obsidian 的版本，会多出编辑按钮、刷新按钮等。
 * 这个版本没有
 */

// import { sanitizeHTMLToDom, type Editor, type EditorPosition } from 'obsidian';
import {
  EditorView,
  WidgetType  // 装饰器部件
} from "@codemirror/view"

import  { ABConvertManager } from "../../ABConverter/ABConvertManager"
import type { MdSelectorRangeSpec } from "../../Obsidian/ab_manager/abm_cm/ABSelector_Md"
import { RangeSpec_AnyBlock } from "../../CodeMirror/src/selector" // [!code hl]

export class ABReplacer_Widget extends WidgetType {
  div: HTMLDivElement
  content_withPrefix_length: number = 0

  // 构造函数
  constructor(
    public rangeSpec: RangeSpec_AnyBlock,
    public customData: { cancelFlag: number[], updateMode: string|number }
  ){
    super()
    this.content_withPrefix_length = rangeSpec.toPos - rangeSpec.fromPos
  }

  /**
   *  div.ab-replace.cm-embed-block.markdown-rendered.show-indentation-guide[type_header=`${}`]
   *      div.drop-shadow.ab-note
   *      div.ab-button.edit-block-button[aria-label="Edit this block"]
   */
  toDOM(view: EditorView): HTMLElement {
    // 根元素
    this.div = document.createElement("div");
    this.div.setAttribute("type_header", this.rangeSpec.header)
    this.div.classList.add("ab-replace", "cm-embed-block") // , "show-indentation-guide"

    // #region 可视化编辑部分

    const getPos = (): {fromPos: number; toPos: number} => {
      let fromPos: number
      try {
        fromPos = view.posAtDOM(this.div, 0)
      } catch (e) {
        console.error('get cursor pos failed:', this.div)
        throw new Error(`get cursor pos failed: ${e}`)
      }
      const pos = {
        fromPos: fromPos,
        toPos: fromPos + this.content_withPrefix_length
      }
      return pos
    }

    const save = (str_with_prefix: string, force_refresh: boolean = false) => {
      const pos = getPos(); this.content_withPrefix_length = str_with_prefix.length

      if (force_refresh) {
        this.customData.updateMode = pos.fromPos // 原 'force'
      }

      const new_state = view.state
      const transaction = new_state.update({
        changes: {
          from: pos.fromPos,
          to: pos.toPos,
          insert: str_with_prefix,
        },
        userEvent: "input",
      })
      view.dispatch(transaction)

      return Promise.resolve()
    }

    // #endregion

    // AnyBlock主体部分，内容替换元素
    let dom_note = document.createElement("div"); this.div.appendChild(dom_note); dom_note.classList.add("ab-note", "drop-shadow");
    ABConvertManager.autoABConvert(dom_note, this.rangeSpec.header, this.rangeSpec.text_content, this.rangeSpec.selector, {
      save,
      rangeSpec: this.rangeSpec,
    })

    // // 编辑按钮部分
    // if (this.global_editor){
    //   let dom_edit = this.div.createEl("div", {
    //     cls: ["ab-button", "ab-button-1", "edit-block-button"], // cm-embed-block和edit-block-button是自带的js样式，用来悬浮显示的，不是我写的
    //     attr: {"aria-label": "Edit the block - "+this.rangeSpec.header},
    //   });
    //   dom_edit.empty(); dom_edit.appendChild(sanitizeHTMLToDom(ABReplacer_Widget.STR_ICON_CODE2));
    //   dom_edit.onclick = ()=>{this.moveCursor()}
    // }

    // // 刷新按钮部分
    // if (this.global_editor){
    //   let dom_edit = this.div.createEl("div", {
    //     cls: ["ab-button", "ab-button-2", "edit-block-button"],
    //     attr: {"aria-label": "Refresh the block"}
    //   });
    //   dom_edit.empty(); dom_edit.appendChild(sanitizeHTMLToDom(ABReplacer_Widget.STR_ICON_REFRESH));
    //   dom_edit.onclick = ()=>{abConvertEvent(this.div); this.moveCursor(-1)}
    // }

    // 控件部分的隐藏
    // 不需要，.edit-block-button 自带非悬浮隐藏的特性

    return this.div;
  }

  // /**
  //  * 通过控制光标移动间接取消显示块
  //  * 
  //  * @detail
  //  * 当line_offset为0时，相当于将光标移到AB块的第一行
  //  * 否则则相当于向上/向下偏移
  //  */
  // private moveCursor(line_offset:number = 0): void{
  //   /** @warning 注意这里千万不能用 toDOM 方法给的 view 参数
  //    * const editor: Editor = view.editor
  //    * 否则editor是undefined
  //    */
  //   if (this.global_editor){
  //     const editor: Editor = this.global_editor
  //     let pos = getCursorPos(editor, this.rangeSpec.from_ch)
  //     if (pos) {
  //       pos.line+=line_offset
  //       if (line_offset<0) {
  //         pos.ch = 0
  //         editor.setCursor(pos)
  //       }
  //       // 如果是>=0，则表示将光标移动到AB块所在范围，那么需要重新渲染State
  //       else {
  //         editor.setCursor(pos)
  //         editor.replaceRange("OF", pos) // 这里相当于将光标移出再内移，间接使之重新渲染
  //         editor.replaceRange("", pos, {line:pos.line, ch:pos.ch+2})
  //       }
  //     }
  //   }
  //   return

  //   function getCursorPos(editor:Editor, total_ch:number): EditorPosition|null{
  //     let count_ch = 0
  //     let list_text: string[] = editor.getValue().split("\n")
  //     for (let i=0; i<list_text.length; i++){
  //       if (count_ch+list_text[i].length >= total_ch) return {line:i, ch:total_ch-count_ch}
  //       count_ch = count_ch + list_text[i].length + 1
  //     }
  //     return null
  //   }
  // }

  static STR_ICON_CODE2 = `<svg xmlns="http://www.w3.org/2000/svg" stroke-linecap="round"
      stroke-linejoin="round" data-darkreader-inline-stroke="" stroke-width="2"
      viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" style="--darkreader-inline-stroke:currentColor;">
    <path d="m18 16 4-4-4-4"></path>
    <path d="m6 8-4 4 4 4"></path>
    <path d="m14.5 4-5 16"></path>
  </svg>`
  // https://www.svgrepo.com/svg/18461/refresh, 原viewBox: 0 0 489.698 489.698, 原size 800
  static STR_ICON_REFRESH = `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
      xml:space="preserve"
      viewBox="-80 -80 650 650" height="24" width="24" fill="currentColor" stroke="currentColor" style="--darkreader-inline-stroke:currentColor;">
    <g>
      <g>
        <path d="M468.999,227.774c-11.4,0-20.8,8.3-20.8,19.8c-1,74.9-44.2,142.6-110.3,178.9c-99.6,54.7-216,5.6-260.6-61l62.9,13.1
          c10.4,2.1,21.8-4.2,23.9-15.6c2.1-10.4-4.2-21.8-15.6-23.9l-123.7-26c-7.2-1.7-26.1,3.5-23.9,22.9l15.6,124.8
          c1,10.4,9.4,17.7,19.8,17.7c15.5,0,21.8-11.4,20.8-22.9l-7.3-60.9c101.1,121.3,229.4,104.4,306.8,69.3
          c80.1-42.7,131.1-124.8,132.1-215.4C488.799,237.174,480.399,227.774,468.999,227.774z"/>
        <path d="M20.599,261.874c11.4,0,20.8-8.3,20.8-19.8c1-74.9,44.2-142.6,110.3-178.9c99.6-54.7,216-5.6,260.6,61l-62.9-13.1
          c-10.4-2.1-21.8,4.2-23.9,15.6c-2.1,10.4,4.2,21.8,15.6,23.9l123.8,26c7.2,1.7,26.1-3.5,23.9-22.9l-15.6-124.8
          c-1-10.4-9.4-17.7-19.8-17.7c-15.5,0-21.8,11.4-20.8,22.9l7.2,60.9c-101.1-121.2-229.4-104.4-306.8-69.2
          c-80.1,42.6-131.1,124.8-132.2,215.3C0.799,252.574,9.199,261.874,20.599,261.874z"/>
      </g>
    </g>
  </svg>`
}
