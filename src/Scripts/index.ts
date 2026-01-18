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
 * - /src/Obsidian/ab_manager/abm_cm/ABSelector_Md.ts::autoMdSelector
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

import { autoMdSelector, type MdSelectorRangeSpec } from "../Obsidian/ab_manager/abm_cm/ABSelector_Md";

export function selector_from_text(mdText?: string) {
  return autoMdSelector(mdText)
}

function selector_from_file() {}

function selector_from_path() {}

/**
 * 将原文所有 anyblock 区域替换为:
 * `~~~~~~anyblock
 * [${rangeSpec.header}]
 * ${rangeSpec.content}
 * ~~~~~~`
 * 
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

// 其中
// interface MdSelectorRangeSpec {
//   from_ch: number,  // 替换范围
//   to_ch: number,    // .
//   header: string,   // 头部信息
//   selector: string, // 选择器（范围选择方式）
//   content: string,  // 内容信息
//   prefix: string,
// }
