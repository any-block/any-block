<template>
  <div ref="ref_container" class="app-codemirror"></div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { EditorView, basicSetup } from "codemirror"
import { DecorationSet, keymap } from "@codemirror/view"
import { StateField } from '@codemirror/state'

import { AnyBlock_CmPlugin } from "../index_cm"

const props = defineProps<{
  mdData: any
}>()
const ref_container = ref<HTMLElement | null>(null)

const ref_editorView = ref<EditorView | null>(null)

// #region 扩展
// import { basicSetup, minimalSetup } from "codemirror"
import { markdown } from "@codemirror/lang-markdown"
// import { keymap, lineNumbers } from "@codemirror/view"
import { defaultKeymap } from "@codemirror/commands"
import { oneDark } from "@codemirror/theme-one-dark"
import {
  EditorState,
  Extension,
} from '@codemirror/state'
import {
  highlightActiveLine,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLineGutter,
  keymap as keymapExt
} from "@codemirror/view";
import { history, historyKeymap } from "@codemirror/commands";
import { indentOnInput } from "@codemirror/language";
import { indentWithTab } from "@codemirror/commands";
// import { foldGutter, foldKeymap } from "@codemirror/fold";
// import { bracketMatching } from "@codemirror/matchbrackets";
// import { closeBrackets, closeBracketsKeymap } from "@codemirror/closebrackets";
// import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
// import { searchKeymap } from "@codemirror/search";

// import * as HyperMD from 'hypermd'
import ixora from '@retronav/ixora'; // 可以全部导入或分开导入
const cm_extension: Extension[] = [ // codemirror 扩展
  highlightSpecialChars(),  // 高亮显示特殊字符（如制表符/空格）
  history(),                // 提供撤销/重做历史记录功能
  drawSelection(),          // 可视化绘制文本选区
  dropCursor(),             // 拖放时显示插入光标
  EditorState.allowMultipleSelections.of(true), // 允许多个选区共存
  indentOnInput(),          // 输入时自动缩进
  // bracketMatching(),     // 括号匹配
  // closeBrackets(),
  // autocompletion(),      // 代码补全
  rectangularSelection(),   // 支持矩形选区（Alt+拖拽）
  crosshairCursor(),        // 启用十字准星光标（配合矩形选区）
  // highlightActiveLine(), // 高亮当前光标所在行
  highlightActiveLineGutter(),
  keymapExt.of([
    ...defaultKeymap,       // 默认快捷键（复制/粘贴等基础操作）
    ...historyKeymap,       // 历史记录快捷键 (Ctrl+Z/Ctrl+Y)
    // ...closeBracketsKeymap,
    // ...searchKeymap,
    // ...foldKeymap,
    // ...completionKeymap,
    indentWithTab           // Tab 键缩进（替代默认跳转功能）
  ]),
  // lineNumbers(),         // 行号显示

  // basicSetup,            // 基础设置 (包含内容较多，不好按需选择)
  // keymap.of(defaultKeymap), // 默认快捷键 (包含内容较多，不好按需选择)
  markdown(),               // Markdown 语法支持（高亮/折叠等）
  oneDark,                  // 深色主题（VS Code 同款）
  // extension_update,      // 监听更新
  // editableCodeBlock_viewPlugin,
  ixora,                    // 一组第三方扩展 (标题、列表、代码块、引用块、图像、html等)
]

// 或使用 HyperMD 用法，参考 https://github.com/laobubu/HyperMD/blob/master/docs/zh-CN/quick-start.md
// HyperMD.fromTextArea(textareaEl, option) // 仅使用 HyperMD
// 将已有的 CodeMirror 转为 HyperMD
// HyperMD.fromTextArea(ref_container2.value)
// if (ref_editorView.value) {
//   HyperMD.switchToHyperMD(ref_editorView.value as any)
// }
// #endregion

// 初始化 CodeMirror
import { lineNumbers } from "@codemirror/view"
function initEditor() {
  if (!ref_container.value) return
  
  const view = new EditorView({
    doc: props.mdData.string,
    extensions: [       // codemirror 扩展
      ...cm_extension,
      // basicSetup,       // 基础设置
      // keymap.of(defaultKeymap), // 默认快捷键
      // markdown(),       // markdown 语言支持
      // oneDark,          // 黑暗主题

      lineNumbers(), // 显示行号
      extension_update, // 监听更新
      // editableCodeBlock_viewPlugin,
    ],
    parent: ref_container.value
  })
  ref_editorView.value = view

  // 使用 EditableCodeblock 插件
  const _editableCodeblockCm = new AnyBlock_CmPlugin(view, props.mdData)
}

// cm -> str
const extension_update = EditorView.updateListener.of(update => {
  if (update.docChanged) {
    const newContent = update.state.doc.toString()
    props.mdData.string = newContent
  }
})

// str -> cm 更新编辑器内容
watch(() => props.mdData.string, (newVal) => {
  if (!ref_editorView.value) return
  const current = ref_editorView.value.state.doc.toString()
  if (current !== newVal) {
    ref_editorView.value.dispatch({
      changes: {
        from: 0,
        to: current.length,
        insert: newVal
      }
    })
  }
})

onMounted(() => {
  initEditor()
})
</script>

<style lang="scss" scoped>
.app-codemirror {
  height: 100%;
}
</style>

<style lang="scss">
// .app-codemirror > .cm-editor
.cm-editor {
  height: calc(100% - 10px);
  font-family: inherit;
  .cm-scroller {
    padding-right: 15px;
  }
}

// 处理 cm-widgetBuffer 问题
.ab-replace {
  margin: -1em 0 -0.95em 0;
}

/* cm */
.cm-line-yellow {
  text-decoration: underline 1px rgba(255, 255, 0, 0.3);
}
.editable-codeblock-p > .editable-codeblock.editable-textarea > textarea {
  caret-color: #ffffffdd !important; /* 这里优先级不高容易被覆盖 */
}
.cm-heading-1, .cm-heading-1 .ͼ11 {
  color: #E06C75;
}
.cm-heading-2, .cm-heading-2 .ͼ11 {
  color: #ffc078;
}
.cm-heading-3, .cm-heading-3 .ͼ11 {
  color: #98C379;
}

/* ixora plugin */
.ͼx {
  color: red;
}
.ͼy {
  color: yellow;
}
.ͼ1 .cm-blockquote {
  color: currentColor !important;
}
// .app-codemirror .ͼ1 .cm-codeblock {
//   background: none !important;
// }
// .app-codemirror .ͼ1 .cm-blockquote-border {
//   border: none !important;
// }
</style>
