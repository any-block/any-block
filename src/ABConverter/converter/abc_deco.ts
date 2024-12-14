/**
 * 处理器_装饰版
 * 
 * html <-> html
 * md_str <-> html
 */

import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"

export const DECOProcessor = 0  // 用于模块化，防报错，其实没啥用

const abc_md = ABConvert.factory({
  id: "md",
  name: "md",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    const subEl = document.createElement("div"); el.appendChild(subEl);
    ABConvertManager.getInstance().m_renderMarkdownFn(content, subEl)
    return el
  }
})

const abc_text = ABConvert.factory({
  id: "text",
  name: "纯文本",
  detail: "其实一般会更推荐用code()代替，那个更精确",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    // 文本元素。pre不好用，这里还是得用<br>换行最好
    // `<p>${content.split("\n").map(line=>{return "<span>"+line+"</span>"}).join("<br/>")}</p>`
    el.innerHTML = `<p>${content.replace(/ /g, "&nbsp;").split("\n").join("<br/>")}</p>`
    return el
  }
})

const abc_fold = ABConvert.factory({
  id: "fold",
  name: "折叠",
  process_param: ABConvert_IOEnum.el,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: HTMLElement): HTMLElement=>{
    if(content.children.length!=1) return content
    const sub_el = content.children[0] as HTMLElement
    sub_el.remove()
    sub_el.setAttribute("is_hide", "true")
    sub_el.classList.add("ab-deco-fold-content")
    sub_el.style.display = "none"
    const mid_el = document.createElement("div"); content.appendChild(mid_el); mid_el.classList.add("ab-deco-fold");
    const sub_button = document.createElement("div"); mid_el.appendChild(sub_button); sub_button.classList.add("ab-deco-fold-button"); sub_button.textContent = "展开";
    sub_button.onclick = ()=>{
      const is_hide = sub_el.getAttribute("is_hide")
      if (is_hide && is_hide=="false") {
        sub_el.setAttribute("is_hide", "true"); 
        sub_el.style.display = "none"
        sub_button.textContent = "展开"
      }
      else if(is_hide && is_hide=="true") {
        sub_el.setAttribute("is_hide", "false");
        sub_el.style.display = ""
        sub_button.textContent = "折叠"
      }
    }
    mid_el.appendChild(sub_button)
    mid_el.appendChild(sub_el)
    return content
  }
})


const abc_scroll = ABConvert.factory({
  id: "scroll",
  name: "滚动",
  match: /^scroll(\((\d+)\))?(T)?$/,
  default: "scroll(460)",
  process_param: ABConvert_IOEnum.el,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: HTMLElement): HTMLElement=>{
    // 找参数
    const matchs = header.match(/^scroll(\((\d+)\))?(T)?$/)
    if (!matchs) return content
    let arg1
    if (!matchs[1]) arg1=460  // 默认值
    else{
      if (!matchs[2]) return content
      arg1 = Number(matchs[2])
      if (isNaN(arg1)) return content
    }
    // 修改元素
    if(content.children.length!=1) return content
    const sub_el = content.children[0]
    sub_el.remove()
    const mid_el = document.createElement("div"); content.appendChild(mid_el); mid_el.classList.add("ab-deco-scroll");
    if (!matchs[3]){
      mid_el.classList.add("ab-deco-scroll-y")
      mid_el.setAttribute("style", `max-height: ${arg1}px`)
    } else {
      mid_el.classList.add("ab-deco-scroll-x")
    }
    mid_el.appendChild(sub_el)
    return content
  }
})

const abc_overfold = ABConvert.factory({
  id: "overfold",
  name: "超出折叠",
  match: /^overfold(\((\d+)\))?$/,
  default: "overfold(380)",
  process_param: ABConvert_IOEnum.el,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: HTMLElement): HTMLElement=>{
    // 找参数
    const matchs = header.match(/^overfold(\((\d+)\))?$/)
    if (!matchs) return content
    let arg1:number
    if (!matchs[1]) arg1=460  // 默认值
    else{
      if (!matchs[2]) return content
      arg1 = Number(matchs[2])
      if (isNaN(arg1)) return content
    }
    // 修改元素
    if(content.children.length!=1) return content
    const sub_el = content.children[0]
    sub_el.remove()
    const mid_el = document.createElement("div"); content.appendChild(mid_el); mid_el.classList.add("ab-deco-overfold");
    const sub_button = document.createElement("div"); mid_el.appendChild(sub_button); sub_button.classList.add("ab-deco-overfold-button"); sub_button.textContent = "展开";
    sub_el.classList.add("ab-deco-overfold-content")
    mid_el.appendChild(sub_el)
    mid_el.appendChild(sub_button)

    mid_el.setAttribute("style", `max-height: ${arg1}px`)
    mid_el.setAttribute("is-fold", "true")
    sub_button.onclick = ()=>{
      const is_fold = mid_el.getAttribute("is-fold")
      if (!is_fold) return
      if (is_fold=="true") {
        mid_el.setAttribute("style", "")
        mid_el.setAttribute("is-fold", "false")
        sub_button.textContent = "折叠"
      }
      else{
        mid_el.setAttribute("style", `max-height: ${arg1}px`)
        mid_el.setAttribute("is-fold", "true")
        sub_button.textContent = "展开"
      }
    }

    return content
  }
})

  // 可以匹配如:
  // width(25%,25%,50%)
  // width(100px,10rem,10.5) 
  // width(100)
  const abc_width = ABConvert.factory({
    id: "width",
    name: "宽度控制",
    match: /^width\(((?:\d*\.?\d+(?:%|px|rem)?,\s*)*\d*\.?\d+(?:%|px|rem)?)\)$/,
    process_param: ABConvert_IOEnum.el,
    process_return: ABConvert_IOEnum.el,
    process: (el, header, content: HTMLElement): HTMLElement=>{
      const matchs = header.match(/^width\(((?:\d*\.?\d+(?:%|px|rem)?,\s*)*\d*\.?\d+(?:%|px|rem)?)\)$/)
      if (!matchs || content.children.length!=1) return content
  
      // 支持 % 和 px 两种单位，默认单位是 px
      const args = matchs[1].split(",").map(arg => 
        /^\d*\.?\d+$/.test(arg.trim()) ? `${arg.trim()}%` : arg.trim()
      )
      // 检查容器是否包含需要处理的类名, 根据不同的容器, 处理方式不同
      switch(true){
        // ab-col支持渲染混合单位参数
        case content.children[0].classList.contains('ab-col'): {
          const sub_els = content.children[0].children
          if(sub_els.length==0) return content
          // 允许参数数量与分栏数量不一致，多的部分会被忽略 
          for(let i=0;i<Math.min(sub_els.length, args.length);i++){
            const sub_el = sub_els[i] as HTMLElement
            if(args[i].endsWith("%")) sub_el.style.flex = `0 1 ${args[i]}`
            else {
              sub_el.style.width = args[i]
              sub_el.style.flex = `0 0 auto`
            }
          }
          return content
        }
        /**
         * table目前无法很好渲染混合单位的参数（px和rem可以混合)
         * 用settimeout延迟获取table宽度可解决，但是会延长渲染时间
         * 可以尝试改用grid布局
         */
        // 使用非百分比单位尽量保证参数数量与列数一致，使用百分比单位表格会被按比例拉伸到行宽
        case content.children[0].querySelector('table') !== null: {
          const table = content.children[0].querySelector('table')
          if (!table) return content
          table.style.tableLayout = 'fixed'
          // 检查是否存在 % 单位的参数，使用100%，否则使用fit-content
          table.style.width = args.some(arg => arg.endsWith('%')) ? '100%' : 'fit-content'
          // setTimeout(() => {
          //   console.log('Table width:', table.offsetWidth);
          //   console.log('Computed width:', window.getComputedStyle(table).width);
          // }, 10);
          table.querySelectorAll('tr').forEach(row => {
            for (let i = 0; i < Math.min(row.children.length, args.length); i++) {
              const cell = row.children[i] as HTMLElement
              cell.style.width = cell.style.minWidth = cell.style.maxWidth = args[i]
            }
          })
          return content
        }
        default:
          return content
      }
    }
  })

const abc_addClass = ABConvert.factory({
  id: "addClass",
  name: "增加class",
  detail: "给当前块增加一个类名",
  match: /^addClass\((.*)\)$/,
  process_param: ABConvert_IOEnum.el,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: HTMLElement): HTMLElement=>{
    const matchs = header.match(/^addClass\((.*)\)$/)
    if (!matchs || !matchs[1]) return content
    if(content.children.length!=1) return content
    const sub_el = content.children[0]
    sub_el.classList.add(String(matchs[1]))
    return content
  }
})

const abc_addDiv = ABConvert.factory({
  id: "addDiv",
  name: "增加div和class",
  detail: "给当前块增加一个父类，需要给这个父类一个类名",
  match: /^addDiv\((.*)\)$/,
  process_param: ABConvert_IOEnum.el,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: HTMLElement): HTMLElement=>{
    const matchs = header.match(/^addDiv\((.*)\)$/)
    if (!matchs || !matchs[1]) return content
    const arg1 = matchs[1]
    // 修改元素
    if(content.children.length!=1) return content
    const sub_el = content.children[0]
    sub_el.remove()
    const mid_el = document.createElement("div"); content.appendChild(mid_el); mid_el.classList.add(arg1)
    mid_el.appendChild(sub_el)
    return content
  }
})

const abc_title = ABConvert.factory({
  id: "title",
  name: "标题",
  match: /^#(.*)/,
  detail: "若直接处理代码或表格块，则会有特殊风格",
  process_param: ABConvert_IOEnum.el,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: HTMLElement): HTMLElement=>{ // content有特殊class，不能更换。要在他下面套壳
    const matchs = header.match(/^#(.*)/)
    if (!matchs || !matchs[1]) return content
    const arg1 = matchs[1]

    // 修改元素 - 把旧元素取出文档树
    const el_content = document.createElement("div");
    while (content.firstChild) {
      const item = content.firstChild;
      content.removeChild(item)
      el_content.appendChild(item)
    }
    // 修改元素 - 重新构建结构
    const el_root = document.createElement("div"); content.appendChild(el_root); el_root.classList.add("ab-deco-title");
    const el_title = document.createElement("div"); el_root.appendChild(el_title); el_title.classList.add("ab-deco-title-title");
    const el_title_p = document.createElement("p"); el_title.appendChild(el_title_p); el_title_p.textContent = arg1;
    el_root.appendChild(el_content); el_content.classList.add("ab-deco-title-content");

    // 判断元素类型修改，以修改title风格 // TODO 话说混合应该用第一个还是直接none？先用第一个吧，因为说不定后面的是工具栏之类的
    let el_content_sub = el_content.childNodes[0]; if (!el_content_sub) return content;
    if (el_content_sub instanceof HTMLDivElement && el_content.childNodes.length == 1 && el_content.childNodes[0].childNodes[0]) { el_content_sub = el_content.childNodes[0].childNodes[0] } // 如果是重渲染，则再往下一层
    let title_type = "none"
    if (el_content_sub instanceof HTMLQuoteElement){title_type = "quote"
      // 这里借用callout的样式
      el_root.classList.add("callout")
      el_title.classList.add("callout-title");
      el_content.classList.add("callout-content");
      // 去除原来的引用块样式
      const el_content_sub_parent =  el_content_sub.parentNode; if (!el_content_sub_parent) return content
      while (el_content_sub.firstChild) {
        el_content_sub_parent.insertBefore(el_content_sub.firstChild, el_content_sub);
      }
      el_content_sub_parent.removeChild(el_content_sub)
    }
    else if (el_content_sub instanceof HTMLTableElement){title_type = "table"}
    else if (el_content_sub instanceof HTMLUListElement){title_type = "ul"}
    else if (el_content_sub instanceof HTMLPreElement){title_type = "pre"}
    // ;(()=>{
    //   let color:string = window.getComputedStyle(el_content_sub ,null).getPropertyValue('background-color'); 
    //   if (color) el_title.setAttribute("style", `background-color:${color}`)
    //   else {
    //   color = window.getComputedStyle(el_content_sub ,null).getPropertyValue('background'); 
    //   el_title.setAttribute("style", `background:${color}`)
    //   }
    // })//()
    el_title.setAttribute("title-type", title_type)
    return content
  }
})
