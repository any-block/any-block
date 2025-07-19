<template>
  <div ref="ref_container" class="app-codemirror"></div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { EditorView, basicSetup } from "codemirror"
import { markdown } from "@codemirror/lang-markdown"
import { DecorationSet, keymap } from "@codemirror/view"
import { defaultKeymap } from "@codemirror/commands"
import { oneDark } from "@codemirror/theme-one-dark"
import { StateField } from '@codemirror/state'

import { EditableCodeblockCm } from "../index_cm"

const props = defineProps<{
  mdData: any
}>()
const ref_container = ref<HTMLElement | null>(null)

const ref_editorView = ref<EditorView | null>(null)

// 初始化 CodeMirror
function initEditor() {
  if (!ref_container.value) return
  
  const view = new EditorView({
    doc: props.mdData.string,
    extensions: [       // codemirror 扩展
      basicSetup,       // 基础设置
      keymap.of(defaultKeymap), // 默认快捷键
      markdown(),       // markdown 语言支持
      oneDark,          // 黑暗主题
      extension_update, // 监听更新
      // editableCodeBlock_viewPlugin,
    ],
    parent: ref_container.value
  })
  ref_editorView.value = view

  // 使用 EditableCodeblock 插件
  const _editableCodeblockCm = new EditableCodeblockCm(view, props.mdData, (newStr: string) => {
    console.log('保存3')
    props.mdData.string = newStr
  })
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
.cm-editor {
  height: calc(100% - 10px);
  font-family: inherit;
}
</style>
