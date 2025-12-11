import { Plugin } from "unified"
import { Root, RootContent, Paragraph, Text, Code, Html } from "mdast"
import type { VFile } from "vfile"
import { toMarkdown } from "mdast-util-to-markdown"
import { visit } from "unist-util-visit"

// 这里不想去依赖 Quartz 项目，所以用any。但是你可以去看具体的类型定义
// import { type QuartzTransformerPlugin } from "../types"
// import { type BuildCtx } from "../../util/ctx"
type QuartzTransformerPlugin = any
type BuildCtx = any

// 1. Markdown-it
import MarkdownIt from "markdown-it"
const md = new MarkdownIt({
  html: true, // 启用 HTML 标签解析
  breaks: true // 将换行符转换为 <br> 标签
})

// 2. AnyBlock
import { ABConvertManager } from "../ABConverter/ABConvertManager"
import { ABCSetting, ABReg } from "../ABConverter/ABReg"
import "../ABConverter/converter/abc_text"
import "../ABConverter/converter/abc_code"
import "../ABConverter/converter/abc_list"
import "../ABConverter/converter/abc_c2list"
import "../ABConverter/converter/abc_table"
import "../ABConverter/converter/abc_dir_tree"
import "../ABConverter/converter/abc_deco"
import "../ABConverter/converter/abc_ex"
import "../ABConverter/converter/abc_mdit_container"
import "../ABConverter/converter/abc_echarts"
import "../ABConverter/converter/abc_plantuml" // 可选建议：
import "../ABConverter/converter/abc_mermaid"  // 可选建议：新版无额外依赖，旧版非 min 环境下 7.1MB
import "../ABConverter/converter/abc_markmap"  // 可选建议：1.3MB

import { jsdom_init } from "./jsdom_init"
jsdom_init()

/**
 * 大部分选项是为了与 markdown-it 版本保持一致而保留的。
 * 目前这些选项未被使用，但已预留用于未来的行为切换。
 */
export interface AnyBlockOptions {
  // multiline: boolean;
  // rowspan: boolean;
  // headerless: boolean;
  // multibody: boolean;
  // autolabel: boolean;
}

/**
 * 检测 `[header]` 段落
 */
function matchAbHeader(node: RootContent): string | null {
  if (node.type !== "paragraph") return null;
  const text = (node.children as RootContent[])
    .map((c) => (c.type === "text" ? (c as Text).value : ""))
    .join("");
  const m = text.match(ABReg.reg_header);
  return m && m[1] ? m[1] : null;
}

/**
 * 检测 `:::container` 段落
 * 匹配时返回 `{flag, type}`
 */
function matchContainerStart(node: RootContent):
  | { flag: string; type: string }
  | null {
  if (node.type !== "paragraph") return null;
  const text = (node.children as RootContent[])
    .map((c) => (c.type === "text" ? (c as Text).value : ""))
    .join("")
    .trim();
  const m = text.match(ABReg.reg_mdit_head);
  if (!m || !m[3] || !m[4]) return null;
  return { flag: m[3], type: m[4] };
}

/**
 * 检测到一个 `:::` 结尾的段落
 */
function isContainerEnd(node: RootContent, flag: string): boolean {
  if (node.type !== "paragraph") return false;
  const text = (node.children as RootContent[])
    .map((c) => (c.type === "text" ? (c as Text).value : ""))
    .join("")
    .trim();
  return text === flag;
}

/**
 * 将一组 mdast 节点序列化为 markdown 格式
 */
function nodesToMarkdown(nodes: RootContent[]): string {
  return toMarkdown(
    { type: "root", children: nodes } as unknown as Root,
    { listItemIndent: "one" }
  ).trimEnd();
}

/**
 * remark 插件: 将任何特殊的 AnyBlock 语法转换为带有 `lang = "AnyBlock"` 属性的“代码”节点。
 *
 * - `[header]` + (list|heading|code|blockquote|table...)
 * - `:::type ... :::`
 */
export const remark_anyblock_to_codeblock: Plugin<[Partial<AnyBlockOptions>?], Root> =
  (_options = {}) =>
  (tree) => {
    const out: RootContent[] = [];
    const children = [...tree.children] as RootContent[];

    for (let i = 0; i < children.length; i++) {
      const node = children[i];

      // --- square-inline header flow ---
      const header = matchAbHeader(node);
      if (header) {
        const body: RootContent[] = [];
        let j = i + 1;
        for (; j < children.length; j++) {
          const n = children[j];
          if (
            n.type === "list" ||
            n.type === "heading" ||
            n.type === "code" ||
            n.type === "blockquote" ||
            n.type === "table"
          ) {
            body.push(n);
            continue;
          }
          // stop when first non-matching block is hit
          break;
        }
        if (body.length > 0) {
          const codeValue = `[${header}]\n${nodesToMarkdown(body)}`;
          out.push({
            type: "code",
            lang: "AnyBlock",
            value: codeValue,
            data: { markup: "[]" },
          } as Code);
          i = j - 1;
          continue;
        }
      }

      // --- ::: container flow ---
      const container = matchContainerStart(node);
      if (container) {
        const body: RootContent[] = [];
        let j = i + 1;
        for (; j < children.length; j++) {
          const n = children[j];
          if (isContainerEnd(n, container.flag)) {
            break;
          }
          body.push(n);
        }
        if (j < children.length) {
          const codeValue = `[${container.type}]\n${nodesToMarkdown(body)}`;
          out.push({
            type: "code",
            lang: "AnyBlock",
            value: codeValue,
            data: { markup: container.flag },
          } as Code);
          i = j; // skip closing line
          continue;
        }
      }

      // default passthrough
      out.push(node);
    }

    (tree as Root).children = out;
  }

// 渲染 anyblock 代码块
const remark_anyblock_render_codeblock = () => {
  if (typeof document == "undefined") return
  return (tree: Root, _file: VFile) => {
    visit(tree, "code", (node: Code, index: number|undefined, parent: any|undefined) => { // 遍历所有的 code 类型节点
      console.log("\nanyblock codeblock transformer visit:", node)
      if (node.lang != "anyblock") return
      if (!parent || !index) return

      const lines = node.value.split("\n")
      const head = lines.shift()
      const headerMatch = head?.match(/\[(.*)\]/)
      if (!headerMatch) return

      const header = headerMatch[1];
      const content = lines.join("\n").trimStart();
      const markup = (node.data as any)?.markup ?? ""

      const el: HTMLDivElement = document.createElement("div");
      el.classList.add("ab-note", "drop-shadow");
      ABConvertManager.autoABConvert(el, header, content, markup.startsWith(":::") ? "mdit" : "");

      // new node
      console.log("\nanyblock codeblock transformer visit2:", header, 'c==', content)
      console.log("\nanyblock codeblock transformer visit3:", el.outerHTML, el)
      const new_node: Html = {
        type: 'html',
        value: el.outerHTML,
      }
      parent.children.splice(index, 1, new_node)
      // return 'skip'
    })
  }
}

{
  // 定义环境条件
  ABCSetting.env = "remark";

  // 定义默认渲染行为 // [!code hl] risk 同步适配异步，可能会存在问题
  ABConvertManager.getInstance().redefine_renderMarkdown((markdown: string, el: HTMLElement):void => {
    el.classList.add("markdown-rendered")
    // el.textContent = markdown.replace('\n', '<br>'); return; // TODO 临时

    // 只能阻塞
    // const file = unified()
    //   .use(remarkParse)
    //   .use(remarkRehype)
    //   .use(rehypeStringify);
    // const file2: VFile = await file.process(markdown);
    // const result: string = String(file);

    const result = md.render(markdown);

    // console.log('re-renderMarkdown:', markdown, '===>', result)
    const el_child = document.createElement("div"); el.appendChild(el_child); el_child.innerHTML = result;
  })
}

// 这是 Quartz 的 Transformer 插件定义
export const transformer_anyblock: QuartzTransformerPlugin = (/*options: any*/) => {
  return {
    name: "AnyBlock",
    markdownPlugins(_ctx: BuildCtx) {
      return [
        // remark_anyblock_to_codeblock,
        remark_anyblock_render_codeblock, // last
      ]
    },
    htmlPlugins(_ctx: BuildCtx) {
      return []
    }
  }
}
