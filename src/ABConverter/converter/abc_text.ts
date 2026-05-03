/**
 * 转换器_文字版
 * 
 * md_str <-> md_str
 */

import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import {ABReg} from "../ABSetting"

/**
 * 将registerABProcessor的调用分成两步是因为：
 * 1. 能方便在大纲里快速找到想要的处理器
 * 2. 让处理器能互相调用
 */

const abc_addQuote = ABConvert.factory({
  id: "addQuote",
  name: "Add quote block",
  match: "addQuote",
  detail: "Add `> ` to the beginning of each line in text",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    return content.split("\n").map((line)=>{return "> "+line}).join("\n")
  }
})

const abc_addCode = ABConvert.factory({
  id: "addCode",
  name: "Add code block",
  match: /^(addCode|code)(\((.*)\))?$/,
  default: "code()",
  detail: "Add code block fences before and after text. Without `()` means use first line of text as code type, empty parentheses means empty code type",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    let matchs = header.match(/^(addCode|code)(\((.*)\))?$/)
    if (!matchs) return content
    if (matchs[2]) content = matchs[3]+"\n"+content
    return "``````"+content+"\n``````"
  }
})

const abc_xQuote = ABConvert.factory({
  id: "xQuote",
  name: "Remove quote block",
  match: /^(xQuote|Xquote)$/,
  detail: "Remove `> ` from the beginning of each line in text",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    return content.split("\n").map(line=>{
      return line.replace(/^>\s/, "")
    }).join("\n")
  }
})

const abc_xCode = ABConvert.factory({
  id: "xCode",
  name: "Remove code block",
  match: /^(xCode|Xcode)(\((true|false|)\))?$/,
  default: "xCode(true)",
  detail: "Parameter is whether to remove code type. Xcode defaults to false, xCode defaults to true. Notation: code|Xcode or code()|Xcode() content unchanged",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    let matchs = header.match(/^(xCode|Xcode)(\((true|false|)\))?$/)
    if (!matchs) return content
    let remove_flag:boolean
    if (matchs[2]=="") remove_flag=false
    else remove_flag= (matchs[3]!="false")
    let list_content = content.split("\n")
    // 开始去除
    let code_flag = ""
    let line_start = -1
    let line_end = -1
    for (let i=0; i<list_content.length; i++){
      if (code_flag==""){     // 寻找开始标志
        const match_tmp = list_content[i].match(ABReg.reg_code)
        if(match_tmp){
          code_flag = match_tmp[3]
          line_start = i
        }
      }
      else {                  // 寻找结束标志
        if(list_content[i].indexOf(code_flag)>=0){
          line_end = i
          break
        }
      }
    }
    if(line_start>=0 && line_end>0) { // 避免有头无尾的情况
      if(remove_flag) list_content[line_start] = list_content[line_start].replace(/^```(.*)$|^~~~(.*)$/, "")
      else list_content[line_start] = list_content[line_start].replace(/^```|^~~~/, "")
      list_content[line_end] = list_content[line_end].replace(/^```|^~~~/, "")
      content = list_content.join("\n")//.trim()
    }
    return content
  }
})

const abc_x = ABConvert.factory({
  id: "x",
  name: "Remove code or quote block",
  match: /^(x|X)$/,
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    let flag = ""
    for (let line of content.split("\n")){
      if (ABReg.reg_code.test(line)) {flag="code";break}
      else if (ABReg.reg_quote.test(line)) {flag="quote";break}
    }
    if (flag=="code") return abc_xCode.process(el, header, content) as string
    else if (flag=="quote") return abc_xQuote.process(el, header, content) as string
    return content
  }
})

const abc_slice = ABConvert.factory({
  id: "slice",
  name: "Slice",
  match: /^slice\((\s*\d+\s*)(,\s*-?\d+\s*)?\)$/,
  detail: "Same as JavaScript's slice method. For example `[slice(1, -1)]`",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    // slice好像不怕溢出或交错，会自动变空数组。就很省心，不用判断太多的东西
    const list_match = header.match(/^slice\((\s*\d+\s*)(,\s*-?\d+\s*)?\)$/)
    if (!list_match) return content
    const arg1 = Number(list_match[1].trim())
    if (isNaN(arg1)) return content
    // 单参数
    if (!list_match[2]) return content.split("\n").slice(arg1).join("\n")
    const arg2 = Number(list_match[2].replace(",","").trim())
    // 单参数
    if (isNaN(arg2)) return content.split("\n").slice(arg1).join("\n")
    // 双参数
    else return content.split("\n").slice(arg1, arg2).join("\n")
  }
})

const abc_add = ABConvert.factory({
  id: "add",
  name: "Add content",
  match: /^add\((.*?)(,\s*-?\d+\s*)?\)$/,
  detail: "Add content. Parameter 2 is line number, default 0, end is -1. Will insert line to add",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    const list_match = header.match(/^add\((.*?)(,\s*-?\d+\s*)?\)$/)
    if (!list_match) return content
    if (!list_match[1]) return content
    const arg1 = (list_match[1].trim())
    if (!arg1) return content
    let arg2:number
    if (!list_match[2]) arg2 = 0
    else{
      arg2 = Number(list_match[2].replace(",","").trim())
      if (isNaN(arg2)) {
        arg2 = 0
      }
    }
    const list_content = content.split("\n")
    if (arg2>=0 && arg2<list_content.length) list_content[arg2] = arg1+"\n"+list_content[arg2]
    else if(arg2<0 && (arg2*-1)<=list_content.length) {
      arg2 = list_content.length+arg2
      list_content[arg2] = arg1+"\n"+list_content[arg2]
    }
    return list_content.join("\n")
  }
})

const abc_listroot = ABConvert.factory({
  id: "listroot",
  name: "Add list root",
  match: /^listroot\((.*)\)$/,
  default: "listroot(root)",
  detail: "Add two spaces before each line, and insert root list item starting with `- ` at the beginning",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    const list_match = header.match(/^listroot\((.*)\)$/)
    if (!list_match) return content
    const arg1 = list_match[1].trim()
    content = content.split("\n").map(line=>{return "  "+line}).join("\n")
    content = "- "+arg1+"\n"+content
    return content
  }
})

const abc_addList = ABConvert.factory({
  id: "addList",
  name: "Indent to list",
  detail: "Indent to list. Two strategies for handling empty lines: 1) Empty line means next list, single line break means same list item. 2) Ignore empty lines. Currently only strategy 2",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    const lists = content.trimEnd().split("\n")
    let newContent = ''
    for (const item of lists) {
      if (item.trim() == '') continue // 策略二。忽略空行
      const match = item.match(/^(\s*)(.*)/)
      if (match) {
        newContent += '\n' + match[1] + '- ' + match[2]
      }
      else {}  // 不应该存在这种情况，忽略
    }
    return newContent
  }
})

const abc_xList = ABConvert.factory({
  id: "xList",
  name: "List to indent",
  match: /^(xList|Xlist)$/,
  detail: "List to indent. For list items with multiple lines, default line break items remove leading spaces and join with `; `, joiner not customizable yet",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    const lists = content.trimEnd().split("\n")
    let newContent = ''
    for (const item of lists) {
      const match = item.match(ABReg.reg_list_noprefix)
      if (match) {
        newContent += '\n' + match[1] + match[4]
      }
      else if (newContent != '') {
        newContent += '; ' + item.trimStart()
      }
      else {} // 通常是前面的空行或非列表，忽略
    }
    return newContent.slice(1) // 去除头部 `\n`
  }
})
