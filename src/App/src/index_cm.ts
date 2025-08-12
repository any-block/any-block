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
import { syntaxTree } from '@codemirror/language';

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
import "../../ABConverter/converter/abc_plantuml" // 可选建议：
import "../../ABConverter/converter/abc_mermaid"  // 可选建议：非 min 环境下 7.1MB
import "../../ABConverter/converter/abc_markmap"  // 可选建议：1.3MB

// pro
import "../../CodeMirror/src/converter2/editableBlock"

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

/** 范围选择器 + 装饰集生成器
 * 
 * @details
 * 注意三种装饰器形式:
 * - mark
 * - widget
 * - replace
 * 中， replace+块 可能出现bug:
 * > 原始文本被移除后，CodeMirror 内部依赖的 docView 结构会被破坏。
 * > 当编辑器尝试执行布局测量（如 measureVisibleLineHeights）时，无法找到被替换区域对应的文档视图
 * > 解决方法: 确保进入该函数时，docView 已经完成了。即外部可以用 StateField 而非 ViewPlugin 来实现
 * 
 * TODO 优化。这里没有用到旧装饰集和映射，像anyblock obsidian程序那边是用到的，可以减少渲染、加速程序。
 */
function create_decorations(
  state: EditorState,
  tr?: Transaction
): DecorationSet {
  // ab范围集
  const list_rangeSpec:MdSelectorRangeSpec[] = autoMdSelector(state.doc.toString())

  // 转装饰集
  const decorationRange: Range<Decoration>[] = []; // 装饰组，区分 type DecorationSet = RangeSet<Decoration>;
  for (let rangeSpec of list_rangeSpec) {
    const decoration = Decoration.replace({
      widget: new ABReplacer_Widget(rangeSpec),
      inclusive: true,
      // block: true,
    })
    decorationRange.push(decoration.range(rangeSpec.from_ch, rangeSpec.to_ch))
  }
  
  if (!tr) return Decoration.set(decorationRange)
  // if(tr.changes.empty) return decorationRange // 如果没有修改就不管了（点击编辑块的按钮除外）

  // 处理 cm move in curstom widget 事件
  const range = tr.state.selection.main // TODO 目前只支持单光标
  for (const decoration of decorationRange) {
    // 如果光标在装饰集内
    if ((range.from >= decoration.from && range.from < decoration.to)
      || (range.to > decoration.from && range.to <= decoration.to)
    ) {
      // 策略一：该段使用源码编辑
      decorationRange.splice(decorationRange.indexOf(decoration), 1);

      // 策略二：光标进入控件，可进行可视化编辑
      // 略

      break
    }
  }
  return Decoration.set(decorationRange)
}

/**
 * EditableCodeblock 的通用 CodeMirror 插件
 * 
 * 使用：一个页面对应一个
 */
export class AnyBlock_CmPlugin {
  view: EditorView;
  state: EditorState;
  mdStr: string;

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
        return create_decorations(tr.state, tr)
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
