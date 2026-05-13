/**
 * ## 新旧版本范围识别函数的问题
 * 
 * 注意有两个版本的anyblock范围识别函数，一个是旧版的，一个是新版的
 * 
 * 新的是:
 * 
 * (pro版本中使用的版本)
 * 
 * 旧的是:
 * 
 * - /src/CodeMirro2/ABSelector_Md.ts::autoMdSelector
 * 
 * 和
 * 
 * - /src/CodeMirror/src/selector.ts::selector
 *   - use by /src/CodeMirror/src/selector.ts::create_decorations
 *     - use by /src/App/src/selector.ts
 * 
 * 区别:
 * 
 * - 旧版的逻辑比较繁琐
 * - 新版的参考了 mdit 的解析列表，使用了职责链设计模式，代码更优雅
 * 
 * 这里使用后者
 */

import { autoMdSelector, type MdSelectorRangeSpec } from "../CodeMirror2/ABSelector_Md";

export function selector_from_text(mdText?: string) {
  return autoMdSelector(mdText)
}

function selector_from_file() {}

function selector_from_path() {}

/**
 * 将原文所有 AnyBlock 区域替换为代码块形式
 * 
 * 例如:
 * `~~~~~~anyblock
 * [${rangeSpec.header}]
 * ${rangeSpec.content}
 * ~~~~~~`
 *
 * TODO 没有利用 rangeSpec.prefix，对于被列表/引用块等嵌套的 anyblock 可能存在问题
 * TODO 可能需要进行别名处理
 */
export function convert_to_codeblock(file_content: string): string {
  const mdSelectorRangeSpec: MdSelectorRangeSpec[] = autoMdSelector(file_content)

  // 按起始位置排序，确保替换顺序正确
  const sortedSpecs = [...mdSelectorRangeSpec].sort((a, b) => a.from_ch - b.from_ch)

  let cursor = 0 // 末尾的游标位置
  const parts: string[] = [] // [非anyblock区域, anyblock区域, 循环...]
  for (const rangeSpec of sortedSpecs) {
    // step1. 处理该片段之前的原文片段
    if (rangeSpec.from_ch > cursor) {
      parts.push(file_content.slice(cursor, rangeSpec.from_ch))
    }

    // step2. 处理该片段，替换为代码块
    parts.push(
      `~~~~~~anyblock\n[${rangeSpec.header}]\n\n${rangeSpec.content}\n~~~~~~`
    )

    // step3. 更新游标到末尾
    cursor = Math.max(cursor, rangeSpec.to_ch)
  }
  // 追加剩余未处理的内容
  if (cursor < file_content.length) {
    parts.push(file_content.slice(cursor))
  }

  return parts.join("")
}

/**
 * 将原文所有 AnyBlock 区域中的 AnyBlock 语法头进行删除
 * 
 * 即删除: `[...]` 标志
 */
export function convert_delete_ab_header(file_content: string): string {
  const mdSelectorRangeSpec: MdSelectorRangeSpec[] = autoMdSelector(file_content)

  // 按起始位置排序，确保替换顺序正确
  const sortedSpecs = [...mdSelectorRangeSpec].sort((a, b) => a.from_ch - b.from_ch)

  let cursor = 0 // 末尾的游标位置
  const parts: string[] = [] // [非anyblock区域, anyblock区域, 循环...]
  for (const rangeSpec of sortedSpecs) {
    // step1. 处理该片段之前的原文片段
    if (rangeSpec.from_ch > cursor) {
      parts.push(file_content.slice(cursor, rangeSpec.from_ch))
    }

    // step2. 处理该片段，替换为代码块
    parts.push(
      rangeSpec.content
    )

    // step3. 更新游标到末尾
    cursor = Math.max(cursor, rangeSpec.to_ch)
  }
  // 追加剩余未处理的内容
  if (cursor < file_content.length) {
    parts.push(file_content.slice(cursor))
  }

  return parts.join("")
}
