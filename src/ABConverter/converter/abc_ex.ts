/**
 * 处理器_特殊
 * 
 * 这是一个demo: 教你如何写一个自己的转换器
 */

import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import { get_ABAlias_iter } from "../ABAlias";

const _abc_faq = ABConvert.factory({
  id: "faq",
  name: "FAQ",
  match: "FAQ",
  detail: "Render FAQs/dialogues. Each item needs to start with `/^([a-zA-Z])(: |：)(.*)/`",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    const e_faq:HTMLElement = document.createElement("div"); el.appendChild(e_faq); e_faq.classList.add("ab-faq");
    const list_content:string[] = content.split("\n");

    let mode_qa:string = ""
    let last_content:string = ""
    for (let line of list_content){
      const m_line = line.match(/^([\S]+)(:|：)(.*)/) // 这里可以和 `code(chat)` 的 chat-view-qq 微信格式保持一致，可以互相转换
      if (!m_line){ // 不匹配
        if (mode_qa) {
          last_content = last_content + "\n" + line
        }
        continue
      } else {      // 匹配
        if (mode_qa) {
          const e_faq_line = document.createElement("div"); e_faq.appendChild(e_faq_line); e_faq_line.classList.add("ab-faq-line", `ab-faq-${mode_qa}`);
          const e_faq_bubble = document.createElement("div"); e_faq_line.appendChild(e_faq_bubble); e_faq_bubble.classList.add("ab-faq-bubble", `ab-faq-${mode_qa}`);
          const e_faq_content = document.createElement("div"); e_faq_bubble.appendChild(e_faq_content); e_faq_content.classList.add("ab-faq-content");
          ABConvertManager.getInstance().m_renderMarkdownFn(last_content, e_faq_content)
        }
        mode_qa = m_line[1]
        last_content = m_line[3]
      }
    }
    // 循环尾
    if (mode_qa) {
          const e_faq_line = document.createElement("div"); e_faq.appendChild(e_faq_line); e_faq_line.classList.add("ab-faq-line", `ab-faq-${mode_qa}`);
          const e_faq_bubble = document.createElement("div"); e_faq_line.appendChild(e_faq_bubble); e_faq_bubble.classList.add("ab-faq-bubble", `ab-faq-${mode_qa}`);
          const e_faq_content = document.createElement("div"); e_faq_bubble.appendChild(e_faq_content); e_faq_content.classList.add("ab-faq-content");
          ABConvertManager.getInstance().m_renderMarkdownFn(last_content, e_faq_content)
    }
    return el
  }
})

const _abc_info_converter = ABConvert.factory({
  id: "info_converter",
  name: "INFO",
  detail: "View the registered processor list in the current software version",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.el,
  process: (el, header, content: string): HTMLElement=>{
    const table_p: HTMLDivElement = document.createElement("div"); el.appendChild(table_p); table_p.classList.add("ab-setting", "md-table-fig1");
    const table: HTMLDivElement = document.createElement("table"); table_p.appendChild(table); table.classList.add("ab-setting","md-table-fig2");
    {
      const thead = document.createElement("thead"); table.appendChild(thead);
      const tr = document.createElement("tr"); thead.appendChild(tr);
      let th;
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "Processor name";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "The default drop-down box";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "Purpose description";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "Input type";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "Output type";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "RegExp";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "Is enable";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "Source";
      th = document.createElement("th"); tr.appendChild(th); th.textContent = "Alias substitution";
    }
    const tbody = document.createElement("tbody"); table.appendChild(tbody);
    for (let item of ABConvertManager.getInstance().list_abConvert){
      const tr = document.createElement("tr"); tbody.appendChild(tr)
      let td
      td = document.createElement("td"); tr.appendChild(td); td.textContent = item.name;
      td = document.createElement("td"); tr.appendChild(td); td.textContent = String(item.default);
      td = document.createElement("td"); tr.appendChild(td); td.textContent = item.detail; td.setAttribute("style", "max-width:240px;overflow-x:auto;white-space:nowrap;");
      // td = document.createElement("td"); tr.appendChild(td); td.textContent = item.is_render?"渲染":"文本";
      td = document.createElement("td"); tr.appendChild(td); td.textContent = String(item.process_param);
      td = document.createElement("td"); tr.appendChild(td); td.textContent = String(item.process_return);
      td = document.createElement("td"); tr.appendChild(td); td.textContent = String(item.match);
      td = document.createElement("td"); tr.appendChild(td); td.textContent = item.is_disable?"No":"Yes";
      td = document.createElement("td"); tr.appendChild(td); td.textContent = item.register_from;
      td = document.createElement("td"); tr.appendChild(td); td.textContent = item.process_alias;
    }
    return el
  }
})

const _abc_info_alias = ABConvert.factory({
  id: "info_alias",
  name: "INFO_Alias",
  match: "info_alias",
  detail: "View the registered alias list in the current software version",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.json,
  process: (el, header, content: string): string=>{
    return JSON.stringify(
      Array.from(get_ABAlias_iter(), (item) => ({
        regex: item.regex.toString(),
        replacement: item.replacement,
      })),
      null,
      2,
    )
  }
})
