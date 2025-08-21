/**
 * 处理器_两列列表版
 * 
 * - md_str <-> 列表数据
 * - 列表数据 <-> html
 * - 表格数据 -> 列表数据
 */

import { ABCSetting, ABReg } from '../ABReg'
import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import type {ListItem, List_ListItem} from "./abc_list"


/**
 * 二列列表，特征是level只有0和1
 * 
 * @detail
 * 通常用于：
 * - 二层一叉树
 *     - dirTree的初处理
 *     - Tabs
 *     - TimeLine
 *     - 仿列表
 *     - ...
 * - 二层多叉树
 *     - fc-table (首列重要树)
 *     - ...
 * 
 * 特别是对于mdit-container的 `:::+@` 来说，这种方式是更为方便的
 */
export interface C2ListItem extends ListItem {
  level: 0|1;
}[]
export type List_C2ListItem = C2ListItem[]

/// 一些列表相关的工具集
export class C2ListProcess{

  // ----------------------- str -> listData ------------------------

  /**
   * 多层树转二层一叉树
   * 
   * @detail
   * 特点是level只有0和1两种
   * 
   * example:
   * - 1
   *  - 2
   *   - 3
   *  - 2
   * to:
   * - 1
   *  - 2\n   - 3\n  - 2
   */
  static data_mL_2_2L1B(
    list_itemInfo: List_ListItem
  ): List_C2ListItem{
    const list_itemInfo2: List_C2ListItem = []
    const level1:0 = 0
    const level2:1 = 1
    let flag_leve2 = false  // 表示触发过level2，当遇到level1会重置
    for (const itemInfo of list_itemInfo) {
      if (level1>=itemInfo.level){                                // 是level1
        list_itemInfo2.push({
          content: itemInfo.content.trim(),
          level: level1
        })
        flag_leve2 = false
        continue
      }
      if (true){                                                  // 是level2/level2+/level2-
        if (!flag_leve2){                                           // 新建
          list_itemInfo2.push({
            content: itemInfo.content.trim(),
            level: level2
          })
          flag_leve2 = true
          continue
        }
        else {                                                      // 内换行
          const old_itemInfo = list_itemInfo2.pop()
          if(old_itemInfo){
            let new_content = itemInfo.content.trim()
            if (itemInfo.level>level2) new_content = "- "+new_content
            for (let i=0; i<(itemInfo.level-level2); i++) new_content = " "+new_content;
            new_content = old_itemInfo.content+"\n"+new_content
            list_itemInfo2.push({
              content: new_content,
              level: level2
            })
          }
        }
      }
    }
    return list_itemInfo2
  }

  /**
   * 多层树转二层树
   * 
   * @detail
   * 特点是level只有0和1两种
   * 
   * example:
   * - 1
   *  - 2
   *   - 3
   *  - 2
   * to:
   * - 1
   *  - 2\n   - 3
   *  - 2
   */
  static data_mL_2_2L(
    list_itemInfo: List_ListItem
  ): List_C2ListItem{
    const list_itemInfo2: List_C2ListItem = []
    const level1:0 = 0
    const level2:1 = 1
    for (const itemInfo of list_itemInfo) {
      if (level1>=itemInfo.level){                                // 是level1
        list_itemInfo2.push({
          content: itemInfo.content.trim(),
          level: level1
        })
        continue
      }
      if (level2>=itemInfo.level){                                // 是level2/level2-
        list_itemInfo2.push({
          content: itemInfo.content.trim(),
          level: level2
        })
        continue
      }
      else{                                                       // level2+，内换行                                                     // 
        const old_itemInfo = list_itemInfo2.pop()
        if(old_itemInfo){
          let new_content = itemInfo.content.trim()
          if (itemInfo.level>level2) new_content = "- "+new_content
          for (let i=0; i<(itemInfo.level-level2); i++) new_content = " "+new_content;
          new_content = old_itemInfo.content+"\n"+new_content
          list_itemInfo2.push({
            content: new_content,
            level: level2
          })
        }
      }
    }
    return list_itemInfo2

    /*
    let list_itemInfo2: {content: string;level: number;}[] = []
    let level1 = -1
    let level2 = -1
    for (let itemInfo of list_itemInfo) {
      let this_level: number                                      // 一共三种可能：0、1、(1+)表
      if (level1<0) {level1=itemInfo.level; this_level = level1}  // 未配置level1
      else if (level1>=itemInfo.level) this_level = level1        // 是level1
      else if (level2<0) {level2=itemInfo.level; this_level = level2}  // 未配置level2
      else if (level2>=itemInfo.level) this_level = level2             // 是level2
      else { // (level2<itemInfo.level)                           // 依然是level2，但进行内换行，并把列表符和缩进给加回去
        let old_itemInfo = list_itemInfo2.pop()
        if(old_itemInfo){
          let new_content = "- "+itemInfo.content.trim()
          for (let i=0; i<(itemInfo.level-level2); i++) new_content = " "+new_content;
          new_content = old_itemInfo.content+"\n"+new_content
          list_itemInfo2.push({
            content: new_content,
            level: level2
          })
        }
        continue
      }
      list_itemInfo2.push({
        content: itemInfo.content.trim(),
        level: level2
      })
    }
    console.log("前后数据", list_itemInfo, list_itemInfo2)
    return list_itemInfo2*/
  }

  /**
   * 列表转二列列表数据
   * 
   * @detail
   * 为什么要直接转，而不能list2data|data2c2data来复用
   * 因为会损失信息
   * 
   * @param text 列表的md文本
   * @param modeG 识别内换行符号。内换行符被替换为换行+前缀，比listdata的处理简单些，后面不需要再提高level // TODO 这部分逻辑应该抽离出来做成独立的处理器
   */
  static list2c2data(text: string, modeG=true){
    const list_itemInfo:List_C2ListItem = []
    const list_text = text.trimStart().split("\n")

    // 获取最大的标题级别
    const first_match = list_text[0].match(ABReg.reg_list_noprefix)
    if (!first_match || first_match[1]) {
      console.error("不是列表内容:", list_text[0])
      return list_itemInfo
    }
    const root_list_level:number = first_match[1].length // 第一个列表(也是缩进最小)的 `- ` 前空格数
    
    // 循环填充
    let current_content:string = "" // level1的子内容
    let current_content_prefix:string = "" // level1的子内容的前缀
    for (let line of list_text) {
      const match_list = line.match(ABReg.reg_list_noprefix)
      if (match_list && !match_list[1] && match_list[1].length<=root_list_level){ // b1. 遇到同等标题，level0新项出现
        add_current_content()
        let content = match_list[4]
        // 替换掉内换行符
        if (modeG) {
          const inlines = match_list[4].split(ABReg.inline_split)
          if (inlines.length > 1) {
            const second_part = content.indexOf(inlines[1])
            current_content += content.slice(second_part) + "\n"
            current_content_prefix = "  " // (TODO风险) 通过内换行符，则新的行前缀为双空格 (用户可能用tab的1和四空格的4，但不影响)
            content = inlines[0]
          }
        }
        // 新项
        list_itemInfo.push({
          content: content,
          level: 0
        })
      } else { // b2. 子内容
        if (current_content.trim()=="") { // 第一行的子内容前缀提取
          if (match_list && match_list[1]) current_content_prefix = match_list[1] // 有 `- `，则为 `- ` 前的字符数
          else current_content_prefix = "  " // (TODO风险) 无 `- `，则设前缀字符数为2 (用户可能用tab的1和四空格的4，但少消除2个一般不会影响，主要避免前缀4空格自动转化为缩进代码块)
        }
        if (line.startsWith("\t")) line = line.substring(1);
        else if (line.startsWith(current_content_prefix)) { // 子内容前缀去除
          line = line.substring(current_content_prefix.length);
        }
        current_content += line+"\n" // 子内容拼接
      }
    }
    add_current_content()
    return list_itemInfo

    function add_current_content(){ // 刷新写入缓存的尾调用
      if (current_content.trim()=="") return
      list_itemInfo.push({
        content: current_content,
        level: 1
      })
      current_content = ""
    }
  }

  /**
   * 标题大纲转列表数据
   * 
   * @detail
   * 为什么要直接转，而不能title2list来复用
   * 因为title2list会损失标题信息
   */
  static title2c2data(text: string){
    const list_itemInfo:List_C2ListItem = []
    const list_text = text.trimStart().split("\n")

    // 获取最大的标题级别
    const first_match = list_text[0].match(ABReg.reg_heading_noprefix)
    if (!first_match || first_match[1]) {
      console.error("不是标题内容:", list_text[0])
      return list_itemInfo
    }
    const root_title_level:number = first_match[3].length-1 // 第一个标题(也是最大级别的标题的)的`#`的个数
    
    // 循环填充
    let current_content:string = ""
    let codeBlockFlag = ''
    for (const line of list_text) {
      // heading和mdit类型 需要跳过代码块内的结束标志
      if (codeBlockFlag == '') {
        const match = line.match(ABReg.reg_code)
        if (match && match[3]) {
          codeBlockFlag = match[1]+match[3]
          current_content += line+"\n"; continue
        }
      }
      else {
        if (line.indexOf(codeBlockFlag) == 0) codeBlockFlag = ''
        current_content += line+"\n"; continue
      
      }
      // 
      const match_heading = line.match(ABReg.reg_heading_noprefix)
      if (match_heading && !match_heading[1] && (match_heading[3].length-1)<=root_title_level){ // 遇到同等标题
        add_current_content()
        list_itemInfo.push({
          content: match_heading[4],
          level: 0
        })
      } else {
        current_content += line+"\n"
      }
    }
    add_current_content()
    return list_itemInfo

    function add_current_content(){ // 刷新写入缓存的尾调用
      if (current_content.trim()=="") return
      list_itemInfo.push({
        content: current_content,
        level: 1
      })
      current_content = ""
    }
  }

  /**
   * 两列列表数据转标签栏
   */
  static c2data2tab(
    list_itemInfo: List_C2ListItem, 
    div: HTMLDivElement,
    modeT: boolean
  ){
    const tab = document.createElement("div"); div.appendChild(tab); tab.classList.add("ab-tab-root");
    if (modeT) tab.setAttribute("modeT", "true")
    const nav = document.createElement("div"); tab.appendChild(nav); nav.classList.add("ab-tab-nav");
    const content = document.createElement("div"); tab.appendChild(content); content.classList.add("ab-tab-content")
    let current_dom:HTMLElement|null = null
    for (let i=0; i<list_itemInfo.length; i++){
      const item = list_itemInfo[i]
      // b1. item标题，顺便创建空内容
      if (item.level==0) {
        const nav_item = document.createElement("button"); nav.appendChild(nav_item); nav_item.classList.add("ab-tab-nav-item");
          nav_item.setAttribute("is_activate", i==0?"true":"false");
          nav_item.setAttribute("data_index", i.toString()); // data_index 用于方便从数组中删除
          nav_item.textContent = item.content.slice(0,20);

        current_dom = document.createElement("div"); content.appendChild(current_dom); current_dom.classList.add("ab-tab-content-item");
          current_dom.setAttribute("style", i==0?"display:block":"display:none"); current_dom.setAttribute("is_activate", i==0?"true":"false");
      }
      // b2. item内容，在空内容的基础上填充
      else if (current_dom) {
        current_dom.setAttribute("data_index", i.toString()); // data_index 用于方便从数组中删除
        ABConvertManager.getInstance().m_renderMarkdownFn(item.content, current_dom)
        current_dom = null
      }
      // b3. item内容之前没有item标题，不合法，跳过
      else {
        continue
      }
    }

    // 动态部分
    // 元素全部创建完再来绑按钮事件，不然会有问题
    const lis:NodeListOf<HTMLButtonElement> = tab.querySelectorAll(":scope>.ab-tab-nav>.ab-tab-nav-item")
    const contents = tab.querySelectorAll(":scope>.ab-tab-content>.ab-tab-content-item")
    if (lis.length!=contents.length) console.warn("ab-tab-nav-item和ab-tab-content-item的数量不一致")
    for (let i=0; i<lis.length; i++){
      // 1. 二选一，常规绑定
      // ob选用
      if (ABCSetting.env == "obsidian" || ABCSetting.env == "obsidian-min") {
        lis[i].onclick = ()=>{
          for (let j=0; j<contents.length; j++){
            lis[j].setAttribute("is_activate", "false")
            contents[j].setAttribute("is_activate", "false")
            contents[j].setAttribute("style", "display:none")
          }
          lis[i].setAttribute("is_activate", "true")
          contents[i].setAttribute("is_activate", "true")
          contents[i].setAttribute("style", "display:block")
        }
      }
      // 2. 二选一，嵌入内联onclick
      // mdit (vuepress、app) 选用
      else {
        lis[i].setAttribute("onclick",`
          const i = ${i}
          const tab_current = this
          const tab_nav = this.parentNode
          const tab_root = tab_nav.parentNode
          const tab_content = tab_root.querySelector(":scope>.ab-tab-content")
          const tab_nav_items = tab_nav.querySelectorAll(":scope>.ab-tab-nav-item")
          const tab_content_items = tab_content.querySelectorAll(":scope>.ab-tab-content-item")
          for (let j=0; j<tab_content_items.length; j++){
            tab_nav_items[j].setAttribute("is_activate", "false")
            tab_content_items[j].setAttribute("is_activate", "false")
            tab_content_items[j].setAttribute("style", "display:none")
          }
          tab_current.setAttribute("is_activate", "true")
          tab_content_items[i].setAttribute("is_activate", "true")
          tab_content_items[i].setAttribute("style", "display:block")
        `)
      }
    }

    return div
  }

  /// 将二列列表转 `容器-元素` 结构
  static c2data2items(c2listdata:List_C2ListItem, el:HTMLElement): HTMLElement {
    const el_items = document.createElement("div"); el.appendChild(el_items); el_items.classList.add("ab-items")
    let el_item:HTMLElement|null = null;
    for (const item of c2listdata) {
      // b1. item标题
      if (item.level == 0) {
        el_item = document.createElement("div"); el_items.appendChild(el_item); el_item.classList.add("ab-items-item")
        const el_title = document.createElement("div"); el_item.appendChild(el_title); el_title.classList.add("ab-items-title")
        ABConvertManager.getInstance().m_renderMarkdownFn(item.content, el_title)
      }
      // b2. item内容
      else if (el_item) {
        const el_content = document.createElement("div"); el_item.appendChild(el_content); el_content.classList.add("ab-items-content")
        ABConvertManager.getInstance().m_renderMarkdownFn(item.content, el_content)
      }
      // b3. item内容之前没有item标题，不合法，跳过
      else {
        continue
      }
    }
    return el
  }
}

const abc_list2c2listdata = ABConvert.factory({
  id: "list2c2listdata",
  name: "列表转c2listdata",
  match: "list2c2listdata",
  default: "list2c2listdata",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.c2list_stream,
  process: (el, header, content: string): List_C2ListItem=>{
    return C2ListProcess.list2c2data(content)
  }
})

const abc_title2c2listdata = ABConvert.factory({
  id: "title2c2listdata",
  name: "标题转c2listdata",
  match: "title2c2listdata",
  default: "title2c2listdata",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.c2list_stream,
  process: (el, header, content: string): List_C2ListItem=>{
    return C2ListProcess.title2c2data(content)
  }
})

const abc_c2listdata2tab = ABConvert.factory({
  id: "c2listdata2tab",
  name: "c2listdata转标签",
  match: "c2listdata2tab",
  default: "c2listdata2tab",
  process_param: ABConvert_IOEnum.c2list_stream,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: List_C2ListItem): HTMLElement=>{
    return C2ListProcess.c2data2tab(content, el, false)
  }
})

const abc_c2listdata2items = ABConvert.factory({
  id: "c2listdata2items",
  name: "c2listdata转容器结构",
  match: "c2listdata2items",
  default: "c2listdata2items",
  process_param: ABConvert_IOEnum.c2list_stream,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: List_C2ListItem): HTMLElement=>{
    return C2ListProcess.c2data2items(content, el)
  }
})

const abc_c2listdata2easytimeline = ABConvert.factory({
  id: "c2listdata2easytimeline",
  name: "适配到easy_timeline",
  match: "c2listdata2easytimeline",
  detail: "适配到easy_timeline格式，需要安装easy timeline插件",
  process_param: ABConvert_IOEnum.c2list_stream,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: List_C2ListItem): string=>{
    let all_line = ""
    let line = ""
    for (const item of content) {
      if (item.level == 0) {
        if (line != "") all_line += line + '\n\n'
        line = item.content + '. '
      }
      else {
        if (line == "") line = " . "
        line += item.content
      }
    }
    // 尾调用
    if (line != "") all_line += line

    return "````timeline\n"+all_line+"\n````"
  }
})
