// 新增 AB Widget 和 AB Selector

import { RangeSpec_Codeblock, RangeSpec_Quote } from "../../CodeMirror/src/selector"
import { EditorState, Transaction } from "@codemirror/state"
import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view"
import { ABReplacer_Widget } from "./ABReplacer_Widget"
import { MdSelectorRangeSpec } from "../../Obsidian/ab_manager/abm_cm/ABSelector_Md"
import { create_decorations as create_decorations2 } from '../../CodeMirror/src/selector'

export function create_widget (
  customData: { cancelFlag: number[], updateMode: string },
  state: EditorState, oldView: EditorView,
  rangeSpec: MdSelectorRangeSpec,
  // rangeSpec: RangeSpec_Codeblock | RangeSpec_Quote | RangeSpec_AnyBlock,
  focusLine: number|null = null, focusOffset: number = 0
): WidgetType {
  return new ABReplacer_Widget(rangeSpec)

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
