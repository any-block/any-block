<script setup lang="ts">

const props = defineProps<{
  mdData: any
}>()

// #region 预设md demo数

// 旧版本，提前准备好键值对
// import { preset_map as preset_map_ } from "../utils/preset_map.js"
// const preset_map2: Record<string, string> = preset_map_
// preset_map = { ...preset_map2, ...preset_map }

// 服务端版本
let preset_map: Record<string, string> = import.meta.glob(
  '../../../../docs/demo/**/*.md',
  { 
    query: '?raw',
    eager: true,
    import: 'default'
  }
) as Record<string, string>;
// 文件名处理（移除路径前缀）
Object.entries(preset_map).forEach(([path, content]) => {
  const filename = path.split('/').pop()!.replace(/\.md$/, '');
  delete preset_map[path];
  preset_map[filename] = content;
});

// // 客户端版本
// // TODO 如果未来demo多了，是要改用客户端版本，并按需加载的

// #endregion

onSelect(null, 'README') // 初始化默认值
// 事件
function onSelect(event: any, key?: string) {
  if (!key) key = event.target.value
  props.mdData.mdPreset = key
  props.mdData.string = preset_map[key] // '# ' + key + '\n\n' + 
}
</script>

<template>
  <div class="ab-app-editor">
    <select class="preset-select" @change="onSelect" :value="mdData.mdPreset">
      <option v-for="(value, key) in preset_map" :key="key" :value="key">{{ key }}</option>
    </select>
    <textarea class="editor" spellcheck="false" v-model="mdData.string"></textarea>
  </div>
</template>

<style lang="scss" scoped>
.ab-app-editor {
  height: 100%;
  width: 100%;

  .preset-select {
    width: 100%;
    height: 20px;
    padding: 0 10px;
  }

  .editor {
    box-sizing: border-box;
    height: calc(100% - 20px);
    width: 100%;
    margin: 0;

    tab-size: 2;
    white-space: pre;
    border: none;
    padding: 10px 10px 500px;
    overflow-x: auto;
    overflow-y: auto;
    resize: none;
    background-color: #2b2a33;
    color: #eee;
    font-size: 16px;
  }
}
</style>
