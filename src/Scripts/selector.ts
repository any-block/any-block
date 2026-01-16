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

import { autoMdSelector } from "../Obsidian/ab_manager/abm_cm/ABSelector_Md";

export function selector_from_text(mdText?: string) {
  return autoMdSelector(mdText)
}

function selector_from_file() {}

function selector_from_path() {}
