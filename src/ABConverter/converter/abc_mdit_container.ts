/**
 * AB转换器 - 仿 markdown-it-container 功能
 */

import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import {C2ListProcess, type List_C2ListItem} from "./abc_c2list"
import {ABCSetting, ABReg} from "../ABReg"

/// 按mdit-tabs的标准转化为二列列表数据
export function mditTabs2listdata(content:string, reg: RegExp): List_C2ListItem {
  const list_line = content.split("\n")
  let content_item: string = ""
  const list_c2listItem: List_C2ListItem = []
  for (let line_index=0; line_index<list_line.length; line_index++) {
    const line_content = list_line[line_index]
    const line_match = line_content.match(reg)
    if (line_match) {
      add_current_content()
      list_c2listItem.push({
        content: line_match[1].trim(),
        level: 0
      })
      continue
    }
    else {
      content_item += line_content + "\n"
    }
  }
  add_current_content()

  return list_c2listItem

  function add_current_content() { // 刷新写入缓存的尾调用
    if (content_item.trim() == "") return
    list_c2listItem.push({
      content: content_item,
      level: 1
    })
    content_item = ""
  }
}

const abc_mditTabs = ABConvert.factory({
  id: "mditTabs",
  name: "mdit标签页",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    const c2listdata: List_C2ListItem = mditTabs2listdata(content, /^@tab(.*)$/)
    C2ListProcess.c2data2tab(c2listdata, el, false)
    return el
  }
})

const abc_mditDemo = ABConvert.factory({
  id: "mditDemo",
  name: "mdit展示对比",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    const newContent = `@tab show\n${content}\n@tab mdSource\n~~~~~md\n${content}\n~~~~~`
    abc_mditTabs.process(el, header, newContent)
    return el
  }
})

const abc_mditABDemo = ABConvert.factory({
  id: "mditABDemo",
  name: "AnyBlock专用展示对比",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    // 无论哪个版本都有一个bug：
    // 如果内部包含 mermaid/mermaid markmap/markmap 这三个图，会渲染失败或位置错误

    // 二选一，markdown-it-tab 版本
    if (ABCSetting.env == "vuepress") {
      ABConvertManager.getInstance().m_renderMarkdownFn(`::::: tabs

@tab show

${content}

@tab withoutPlugin

(noPlugin)${content.trimStart()}

@tab mdSource

~~~~~md
${content}
~~~~~

:::::`, el)
      return el
    }
    // 二选一，anyblock 版本
    else {
      const newContent = `@tab show\n${content}\n@tab withoutPlugin\n(noPlugin)${content.trimStart()}\n@tab mdSource\n~~~~~md\n${content}\n~~~~~`
      abc_mditTabs.process(el, header, newContent)
      return el
    }
  }
})

/**
 * 总结分栏方式：
 * 1. 根据标签分栏 (手动分栏)
 * 2. 指定分栏个数 (自动分栏)
 */
const abc_midt_col = ABConvert.factory({
  id: "mditCol",
  name: "mdit分栏",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    const c2listdata: List_C2ListItem = mditTabs2listdata(content, /^@col(.*)$/) // /^@[a-zA-Z]* (.*)$/
    C2ListProcess.c2data2items(c2listdata, el)
    el.querySelector("div")?.classList.add("ab-col")
    return el
  }
})

const abc_midt_card = ABConvert.factory({
  id: "mditCard",
  name: "mdit卡片",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    const c2listdata: List_C2ListItem = mditTabs2listdata(content, /^@card(.*)$/) // /^@[a-zA-Z]* (.*)$/
    C2ListProcess.c2data2items(c2listdata, el)
    el.querySelector("div")?.classList.add("ab-card")
    el.querySelector("div")?.classList.add("ab-lay-vfall")
    return el
  }
})

const abc_midt_chat = ABConvert.factory({
  id: "mditChat",
  name: "mdit对话",
  detail: "显示渲染对话，需要配合 obsidian-view-chat-qq 插件使用",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    const content_list = content.split('\n')
    let newContent = ''
    for(let i=0; i<content_list.length; i++) {
      const line = content_list[i]
      if (/^@chat(.*)$/.test(line)) {
        const match = line.match(/^@chat(.*)$/)
        if (match && match[1]) {
          newContent += '\n' + match[1] + ':\n'
          continue
        }
      }
      newContent += line + '\n'
    }
    return newContent
  }
})
