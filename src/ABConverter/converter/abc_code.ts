/**
 * 转换器_代码块版
 * 
 * md_str <-> md_str
 * 
 * 和 abc_text 类别类似，区别在于，源/目标数据为代码/代码块
 * 
 * 注意该类别内容经常伴随两个关键重要别名一起使用:
 * ```ts
 * {regex: "|list2code|", replacement: "|xList|code(js)|"},
 * {regex: "|code2list|", replacement: "|Xcode|region2indent|addList|"},
 * ```
 */

import { ABReg } from "../ABSetting"
import { ABConvert, ABConvert_IOEnum } from "./ABConvert"

const abc_region2indent = ABConvert.factory({
  id: "region2indent",
  name: "代码注释转缩进",
  detail: "代码块注释转缩进 (识别 `//` 和 `#` 的region注释对)，通常配合code2list使用。默认补充两缩进",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    const lists = content.trimEnd().split("\n")
    let newContent = ''
    // let indent_map: {endFlag: string, indent: string}[] = [] // 缩进表。记录停止标识、区块内需要补充的缩进 (弃用，region自身无关缩进，缩进内容固定加层数*两空格)
    // let indent_map: string[] = [] // 缩进表。下标表示在第几层嵌套，内容表示缩进内容
    let startFlagNumber = 0    
    const regionReg: RegExp = /^([ \t]*)(#|\/\/)\s*#?(region|endregion)(.*)/
    for (let i=0; i < lists.length; i++) {
      const item = lists[i]
      const match = item.match(regionReg)

      // b1. 非region项
      if (!match) {
        newContent += '\n' + '  '.repeat(startFlagNumber) + item
        continue
      }
      // b2. region项
      else {
        if (match[3] == 'region') {
          newContent += '\n' + '  '.repeat(startFlagNumber) + match[4].trimStart()
          startFlagNumber++
        }
        else {
          startFlagNumber--
        }
      }
    }

    return newContent.slice(1) // 去除头部 `\n`
  }
})

const abc_mdit2code = ABConvert.factory({
  id: "mdit2code",
  name: "mdit转代码块",
  detail: "mdit转代码块 (允许嵌套)。注意 `:*n` 会转化为 `~*(n+3)`, `@aaa bbb` 会转换为 `# bbb` (h1标题)",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    const lists = content.trimEnd().split("\n")
    let newContent = ''
    // 不使用缩进表和缩进计数，不进行语法检查
    
    for (let i=0; i < lists.length; i++) {
      const item = lists[i]
      const match = item.match(ABReg.reg_mdit_head)
      const match2 = item.trim().match(/^@(\S*?)\s(.*?)$/)

      // b1. `^@` 项
      if (match2) {
        newContent += '\n' + '# ' + match2[2]
      }
      // b1. `:::` 项
      else if (match) {
        const flag = '~'.repeat(match[3].length + 3)
        if (match[4].trim() !== "") newContent += '\n' + flag + 'anyblock\n[' + match[4].trimStart() + ']' // 头
        else newContent += '\n' + flag // 尾
        continue
        
      }
      // b3. 普通
      else {
        newContent += '\n' + item
        continue
      }
    }

    return newContent.slice(1) // 去除头部 `\n`
  }
})
