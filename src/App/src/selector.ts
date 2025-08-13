// 新增 AB Widget 和 AB Selector

import { EditorState, Transaction } from "@codemirror/state"
import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view"
import { ABReplacer_Widget } from "./ABReplacer_Widget"
import { MdSelectorRangeSpec } from "../../Obsidian/ab_manager/abm_cm/ABSelector_Md"
import { create_decorations as create_decorations2, RangeSpec_AnyBlock } from '../../CodeMirror/src/selector'

export function create_widget (
  customData: { cancelFlag: number[], updateMode: string },
  state: EditorState, oldView: EditorView,
  rangeSpec: RangeSpec_AnyBlock,
  // rangeSpec: RangeSpec_Codeblock | RangeSpec_Quote | RangeSpec_AnyBlock,
  focusLine: number|null = null, focusOffset: number = 0
): WidgetType {
  // 这里再转回旧版的，复用旧版的逻辑
  const rangeSpec_: MdSelectorRangeSpec = {
    content: rangeSpec.text_content,

    from_ch: rangeSpec.fromPos,
    to_ch: rangeSpec.toPos,
    header: rangeSpec.header,
    selector: rangeSpec.selector,
    prefix: rangeSpec.parent_prefix,
  }
  return new ABReplacer_Widget(rangeSpec_)

  // if (rangeSpec.type != 'anyblock') return
  // const outerEditor_Cm = new OuterEditor_Cm(customData, state, oldView, rangeSpec.toPos - rangeSpec.fromPos)
  // return new CodeblockWidget(outerEditor_Cm, rangeSpec, focusLine, focusOffset)
}

export function create_decorations(
  customData: { cancelFlag: number[], updateMode: string }, oldView: EditorView,
  tr: Transaction, // TODO tr和decorationSet 可以改为可选，如果忽略，则完全重建
  decorationSet: DecorationSet = Decoration.none,
): DecorationSet {
  return create_decorations2(customData, oldView, tr, decorationSet, create_widget)
}
