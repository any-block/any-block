<script lang="ts" setup>
import { ref, provide, computed, watch, onMounted, nextTick } from 'vue'
import TabBar from './components/TabBar.vue'
import MarkdownEditor from './components/MarkdownEditor.vue'
import MarkdownViewer from './components/MarkdownViewer.vue'
import MarkdownCodeMirror from './components/MarkdownCodeMirror.vue'

import GoldenLayout from './components/goldenLayout/GoldenLayout.vue'
import { prefinedLayouts } from './components/goldenLayout/predefined-layouts'
const GLayoutRootRef = ref(null); // Golden-Layout
provide("LAYOUT", GLayoutRootRef);

// md数据
import { preset_map } from "./utils/preset_map.js"
const mdData = ref<any>({
  mdPreset: 'Normal markdown', // default
  string: '# ' + 'Normal markdown' + '\n\n' + preset_map['Normal markdown']
})
</script>

<template>
  <TabBar class="main-nav"></TabBar>

  <golden-layout
    class="golden-layout main-golden"
    ref="GLayoutRootRef"
    :config="prefinedLayouts.miniRow"
  >
    <template #MdEditor>
      <MarkdownEditor :mdData="mdData"></MarkdownEditor>
    </template>
    
    <template #MdViewer>
      <MarkdownViewer :mdData="mdData"></MarkdownViewer>
    </template>

    <template #MdCodeMirror>
      <MarkdownCodeMirror :mdData="mdData"></MarkdownCodeMirror>
    </template>

    <template #White>
      <div style="width: 100%; height: 100%;"></div>
    </template>
  </golden-layout>
</template>

<!--goldenlayout必须样式-->
<style src="golden-layout/dist/css/goldenlayout-base.css"></style>
<style src="golden-layout/dist/css/themes/goldenlayout-dark-theme.css"></style>

<style>
@import "../../ABConverter/style/styles.css";

html, body, #app {
  height: 100%;
  border: none;
  margin: 0;
  padding: 0;
  background-color: #313131;
  color: #c9c9c9;
}
</style>

<style lang="scss" scoped>
.main-nav {
  height: 28px;
}
.main-golden {
  height: calc(100% - 28px);
  width: 100%;
}
</style>
