<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import ab_mdit from "../index_mdit"

const props = defineProps<{
  mdData: any
}>()

// 渲染方法
import MarkdownIt from "markdown-it";
const md = new MarkdownIt({
  html: true, // 启用 HTML 标签解析
  breaks: true // 将换行符转换为 <br> 标签
})
md.use(ab_mdit) // 使用anyblock插件
function fn_renderMarkdown(markdown: string, el: HTMLElement, ctx?: any): void {
  if (!el) return;
  el.classList.add("markdown-rendered"); el.innerHTML = ''

  const result: string = (md as MarkdownIt).render(markdown)
  const el_child = document.createElement("div"); el.appendChild(el_child); el_child.innerHTML = result;
}

// 绑定事件
const ref_markdownViewer = ref<HTMLElement | null>(null)
watch(() => props.mdData.string, (newVal)=>{
  if (!ref_markdownViewer.value) return
  fn_renderMarkdown(newVal, ref_markdownViewer.value)
})
onMounted(()=>{
  nextTick().then(() => {
    if (!ref_markdownViewer.value) return
    fn_renderMarkdown(props.mdData.string, ref_markdownViewer.value)
  })
})
</script>

<template>
  <div class="ab-app-render" ref="ref_markdownViewer"></div>
</template>

<style lang="scss" scoped>
.ab-app-render {
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  margin: 0;

  padding: 10px 20px 500px;
  overflow: auto;
}
</style>

<style lang="scss">
.ab-app-render {
  /* ob和vuepress版本外面有一层，但这里没有，要给间距 */
  >div>div.ab-note,
  >div>div.cv-note {
    margin: 26px 0;
  }

  /** 一些markdown样式校正，不知道为什么，默认的行为有很多很怪 */
  ul {
    margin: 0;
    padding-left: 20px;
    list-style-type: disc;
  }
  table {
    display: table;
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    border: solid 1px currentColor;
    padding: 0 4px;
  }
  pre {
    background-color: #0D1117;
    padding: 1em;
  }
  blockquote {
    background-color: #204E8A44; /** 半透明以区分嵌套 */
    margin: 16px 0;
    padding: 1em;
  }
  img {
    max-width: 100%;
  }
  h2 {
    color: #ffc078;
  }
  p {
    display: block;
    margin: 0;
  }
  strong {
    color: red;
  }
  em {
    color: yellow;
  }
  s {
    color: gray;
  }
}
</style>
