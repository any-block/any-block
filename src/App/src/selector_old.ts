// 在非pro版环境下使用

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

import { autoMdSelector, MdSelectorRangeSpec } from '../../Obsidian/ab_manager/abm_cm/ABSelector_Md';
import { ABReplacer_Widget } from './ABReplacer_Widget';

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
export function create_decorations(
  state: EditorState,
  tr?: Transaction
): DecorationSet {
  // ab范围集
  const list_rangeSpec:MdSelectorRangeSpec[] = autoMdSelector(state.doc.toString())

  // 转装饰集
  const decorationRange: Range<Decoration>[] = []; // 装饰组，区分 type DecorationSet = RangeSet<Decoration>;
  for (let rangeSpec of list_rangeSpec) {
    const decoration = Decoration.replace({
      widget: new ABReplacer_Widget(rangeSpec, { cancelFlag: [], updateMode: '' }),
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
