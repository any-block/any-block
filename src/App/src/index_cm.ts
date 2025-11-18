/**
 * TODO fix 多个代码块时，编辑非首个代码块后，光标会跳到首个代码块
 */

import {
  EditorView,
  Decoration,         // 装饰
  type DecorationSet, // 装饰集
  WidgetType,         // 装饰器部件

  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import {
  EditorState,
  Range,
  RangeSet,
  StateEffect,
  StateField,
  Transaction,
} from '@codemirror/state';

import { create_widget } from './selector'

// #region anyblock
// import { ABConvertManager } from "../../ABConverter/ABConvertManager"
// import { ABCSetting, ABReg } from "../../ABConverter/ABReg"
// 加载所有选择器
import { init } from "../../Obsidian/ab_manager/abm_cm/ABSelector_MdBase" // 为什么这里的 `console.warn('sdgs mdbase loaded')` 没有不触发
init() // 避免优化掉
import {} from "../../Obsidian/ab_manager/abm_cm/ABSelector_Md"
import { ABCSetting } from "../../ABConverter/ABReg"
// 加载所有转换器 (都是可选的)
// (当然，如果A转换器依赖B转换器，那么你导入A必然导入B)
import "../../ABConverter/converter/abc_text"
import "../../ABConverter/converter/abc_code"
import "../../ABConverter/converter/abc_list"
import "../../ABConverter/converter/abc_c2list"
import "../../ABConverter/converter/abc_table"
import "../../ABConverter/converter/abc_dir_tree"
import "../../ABConverter/converter/abc_deco"
import "../../ABConverter/converter/abc_ex"
import "../../ABConverter/converter/abc_mdit_container"
import "../../ABConverter/converter/abc_echarts"
import "../../ABConverter/converter/abc_plantuml" // 可选建议：
import "../../ABConverter/converter/abc_mermaid"  // 可选建议：非 min 环境下 7.1MB
import "../../ABConverter/converter/abc_markmap"  // 可选建议：1.3MB

import { autoMdSelector, type MdSelectorRangeSpec} from "../../Obsidian/ab_manager/abm_cm/ABSelector_Md"
import { ABReplacer_Widget } from './ABReplacer_Widget'

import { ABConvertManager } from "../../ABConverter/ABConvertManager"
ABConvertManager.getInstance().redefine_renderMarkdown((markdown: string, el: HTMLElement): void => {
  el.classList.add("markdown-rendered")
  
  const el_child = document.createElement("div"); el.appendChild(el_child); el_child.innerText = markdown

  // const result: string = md.render(markdown)
  // const el_child = document.createElement("div"); el.appendChild(el_child); el_child.innerHTML = result
})
ABCSetting.env = "app"
// #endregion

import "../../Pro/src/" // [!code hl] 加载所有默认插件，也可按需加载
import "../../Pro/src/styles/style.css" // [!code hl]

import { create_decorations } from "./selector" // [!code hl]
// import { create_decorations } from "./selector_old" // [!code hl]

/**
 * EditableCodeblock 的通用 CodeMirror 插件
 * 
 * 使用：一个页面对应一个
 */
export class AnyBlock_CmPlugin {
  view: EditorView;
  state: EditorState;
  mdStr: string;
  customData: {
    cancelFlag: number[],
    updateMode: string
  } = {
    cancelFlag: [],
    updateMode: '',
  }

  constructor(view: EditorView, mdStr: string) {
    this.view = view
    this.state = view.state
    this.mdStr = mdStr

    this.init_stateField()
  }
  
  init_stateField() {
    /** StateField
     * @details
     * 装饰器插件有两个主要实现方式
     * - 一个是ViewPlugin或其他
     * - 一个是StateField
     * 这两都可以传作为 cm 的 extensions 参数，或在外部通过钩子进行使用
     * 
     * 一开始我使用前者。DecorationSet.mark 和 DecorationSet.widget 都可以正常工作。
     * 但在使用 DecorationSet.replace 时，会存在非报错bug。
     * 因为原文本 (docView) 未完成。想替换时无法确认要被替换的文本范围。
     * 
     * 而后者可以。因为其 create 阶段不进行渲染，在update阶段时，docView 已经完成了。
     * 此时可以正常 replace
     */
    const codeBlockField = StateField.define<DecorationSet>({
      create: (editorState:EditorState) => Decoration.none,
      update: (decorationSet:DecorationSet, tr:Transaction) => {
        // 不要直接用 this.view.state，会延后，要用 tr.state
        return create_decorations(this.customData, this.view, tr, decorationSet) // [!code hl]
        // return create_decorations(tr.state, tr) // [!code hl]
      },
      provide: (f: StateField<DecorationSet>) => EditorView.decorations.from(f)
    });

    // 用 StateEffect 来添加 StateField
    let stateEffects: StateEffect<unknown>[] = []
    if (!this.state.field(codeBlockField, false)) {
      stateEffects.push(StateEffect.appendConfig.of(
        [codeBlockField] 
      ))
    }
    this.view.dispatch({effects: stateEffects}) // 派发StateField
  }
}
