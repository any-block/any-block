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
  name: "增加引用块",
  match: "addQuote",
  detail: "在文本的每行前面加上 `> `",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    return content.split("\n").map((line)=>{return "> "+line}).join("\n")
  }
})

const abc_addCode = ABConvert.factory({
  id: "addCode",
  name: "增加代码块",
  match: /^(addCode|code)(\((.*)\))?$/,
  default: "code()",
  detail: "在文本的前后均加上一行代码块围栏。不加`()`表示用原文本的第一行作为代码类型，括号类型为空表示代码类型为空",
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
  name: "去除引用块",
  match: /^(xQuote|Xquote)$/,
  detail: "在文本的每行前面删除 `> `",
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
  name: "去除代码块",
  match: /^(xCode|Xcode)(\((true|false|)\))?$/,
  default: "xCode(true)",
  detail: "参数为是否移除代码类型, Xcode默认为false, Xcode默认为true。记法: code|Xcode 或 code()|Xcode()内容不变",
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
  name: "去除代码或引用块",
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
  name: "切片",
  match: /^slice\((\s*\d+\s*)(,\s*-?\d+\s*)?\)$/,
  detail: "和js的slice方法是一样的。例如 `[slice(1, -1)]`",
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
  name: "增添内容",
  match: /^add\((.*?)(,\s*-?\d+\s*)?\)$/,
  detail: "增添. 参数2为行序, 默认0, 行尾-1。会插行增添",
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
  name: "增加列表根",
  match: /^listroot\((.*)\)$/,
  default: "listroot(root)",
  detail: "每行前面加两空格，并在首行插入 `- ` 开头的根列表项",
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
  name: "缩进转列表",
  detail: "缩进转列表",
  default: "缩进转列表。对于空行的处理有两种策略：一是空行表示下一个列表，单换行表示同一列表项。二是忽略空行。暂时仅为策略二",
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
  name: "列表转缩进",
  match: /^(xList|Xlist)$/,
  detail: "列表转缩进。对于多行内容的列表项，默认换行项删除前置空格并使用 `; ` 拼接，拼接符暂不支持自定义",
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
