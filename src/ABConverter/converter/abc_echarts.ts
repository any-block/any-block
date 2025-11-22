/**
 * 仅负责转为 echart 的 json/js 文本
 * 
 * 均为 md_str -> md_str, 不负责图表渲染部分
 * 
 * 需要结合 [any-block/obsidian-charts](https://github.com/any-block/obsidian-charts)
 * 或 vuepress 生态系统中的 echarts 插件使用
 */

import { DateTime, Duration } from 'luxon';

import { ABConvert_IOEnum, ABConvert } from "./ABConvert"
import { type List_ListItem, ListProcess } from "./abc_list"
import { type List_C2ListItem, C2ListProcess } from "./abc_c2list"

const abc_list2echarts_tree = ABConvert.factory({
  id: "list2echarts_tree",
  name: "ECharts树图",
  match: /list2echarts_tree(.*)/,
  detail: "将列表转换为放ECharts树图，可选附加参数: `_tb` 或 `_radial` 或 `_polyline` 等",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    let list_data: List_ListItem = ListProcess.list2data(content, false)
    list_data = ListProcess.data2strict(list_data)
    let radial_array: RadialNode[] = listdata2radial_array(list_data)
    let radial_data: RadialNode = array2data(radial_array) as RadialNode

    // type attachment, 根据类型附加一些不同的信息
    let attachment: string = ""
    const match = header.match(/list2echarts_tree(.*)/);
    if (match) {
      // edgeShape
      if (match[1].trim().toLowerCase() === '_polyline') {
        attachment += `edgeShape: 'polyline',`
      }

      // orient
      if (match[1].trim().toLowerCase() === '_tb') {
        attachment += `orient: 'TB',`
      } else if (match[1].trim().toLowerCase() === '_lr') {
        attachment += `orient: 'LR',`
      } else if (match[1].trim().toLowerCase() === '_bt') {
        attachment += `orient: 'BT',`
      } else if (match[1].trim().toLowerCase() === '_rl') {
        attachment += `orient: 'RL',`
      }

      // 方向
      if (match[1].trim().toLowerCase() === '_radial') {
        attachment += `\
layout: 'radial',
symbol: 'emptyCircle',`
      } else {
        attachment += `\
label: {
  position: 'left', // 展开则显示在左侧
  verticalAlign: 'middle',
  align: 'right',
},
leaves: {
  label: {
    position: 'right', // 折叠后则显示在右侧
    verticalAlign: 'middle',
    align: 'left'
  }
},`
      }
    }

    // json -> script string
    const data_str = JSON.stringify(radial_data)
    const script_str = `\`\`\`echarts
const option = {
  tooltip: {
    trigger: 'item',
    triggerOn: 'mousemove',
  },
  series: [
    {
      type: 'tree',
      data: [${data_str}],
      ${attachment}
      top: '10%',
      bottom: '10%',
      symbolSize: 7,
      initialTreeDepth: 3,
      animationDurationUpdate: 750,
      emphasis: {
        focus: 'descendant',
      },
    },
  ],
}

// const height = 600
\`\`\``
    return script_str
  }
})

const abc_list2echarts_sunburst = ABConvert.factory({
  id: "list2echarts_sunburst",
  name: "ECharts旭日图",
  match: "list2echarts_sunburst",
  detail: "将列表转换为放ECharts旭日图 (平均分配)",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    let list_data: List_ListItem = ListProcess.list2data(content, false)
    list_data = ListProcess.data2strict(list_data)
    let radial_array: RadialNode[] = listdata2radial_array(list_data, true)

    // json -> script string
    const data_str = JSON.stringify(radial_array)
    const script_str = `\`\`\`echarts
const option = {
  series: [
    {
      type: 'sunburst',
      data: ${data_str},
      radius: [0, '90%'],
      label: {
        rotate: 'radial'
      }
    },
  ],
}
\`\`\``
    return script_str
  }
})

const abc_list2echarts_gantt = ABConvert.factory({
  id: "list2echarts_gantt",
  name: "ECharts甘特图",
  match: "list2echarts_gantt",
  detail: "将列表转换为放ECharts甘特图 (ECharts的甘特图是用custom模拟的)",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    let c2list_data: List_C2ListItem = C2ListProcess.list2c2data(content)

    const gantt_array = c2listdata2gantt_array(c2list_data)
    const data_str = JSON.stringify(gantt_array, null, 2)
    return data_str
    
    // type attachment, 根据类型附加一些不同的信息
//     let attachment1: string = `
// dataZoom: [
//   {
//     type: 'slider',
//     filterMode: 'weakFilter',
//     showDataShadow: false,
//     top: 400,
//     labelFormatter: ''
//   },
//   {
//     type: 'inside',
//     filterMode: 'weakFilter'
//   }
// ],
// `

    // return script_str
  }
})

// 树节点类型
type RadialNode = {
  name: string,
  value?: number,
  children?: RadialNode[]
}
/**
 * 
 * @param data 
 * @param leafValue
 *   若为true，则标记叶子节点，并给叶子节点添加 value:1 属性
 *   默认不要给非叶子节点添加 value 属性，可能会影响如旭日图的父节点大小分配
 * @returns 
 */
function listdata2radial_array(data: List_ListItem, leafValue: boolean = false): RadialNode[] {
  let nodes: RadialNode[] = []        // 节点树
  let prev_nodes: RadialNode[] = []   // 缓存每个level的最新节点

  // 第一次变换，所有节点为 "key": {...} 形式
  for (let index = 0; index<data.length; index++) {
    // 当前节点
    const item = data[index]
    const current_key: string = item.content
    const current_value: RadialNode = {
      name: current_key,
      ...(leafValue ? { value: 1 } : {})
    }
    prev_nodes[item.level] = current_value

    // 放入节点树的对应位置中
    if (item.level>=1 && prev_nodes.hasOwnProperty(item.level-1)) { // 非根节点且有父节点
      let lastItem = prev_nodes[item.level-1]
      if (typeof lastItem != "object" || Array.isArray(lastItem)) {
        console.error(`list数据不合规，父节点的value值不是{}类型`)
        return nodes
      }
      if (leafValue) { // 非叶子节点需删除value属性
        delete lastItem.value
      }
      if (!lastItem.hasOwnProperty("children")) {
        lastItem.children = [current_value]
      } else {
        lastItem.children!.push(current_value)
      }
    } else if (item.level==0) { // 根节点
      nodes.push(current_value)
    } else { // 不合规
      console.error(`list数据不合规，没有正规化. level:${item.level}, prev_nodes:${prev_nodes}`)
      return nodes
    }
  }

  return nodes
}

// gantt节点类型
type GanttNode = {
  content: string,
  start: number,        // 时间戳，支持从 ISO 8601 字符串解析并转换而来。如果无法转换过来，则...(TODO)
  end: number,          // 时间戳，支持从 ISO 8601 字符串解析并转换而来。如果无法转换过来，则...(TODO)
  duration: number,     // (冗余，先不用)
  group1: number,       // 自动分组1
  group2?: string,      // (暂不支持第二分组，即时间线名)
}
function c2listdata2gantt_array(data: List_C2ListItem): {
  data: GanttNode[],
  time_mode: 'ISO8601' | 'timestamp' | 'string' | undefined
} {
  let nodes: GanttNode[] = []           // 节点列表
  let prev_nodes: GanttNode|undefined   // 缓存零级level的最新节点
  let prev_group1: number[] = []        // 缓存每一个分组的尾范围，其length表示当前分组数

  let time_mode: 'ISO8601' | 'timestamp' | 'string' | undefined // 第一次遇到时间节点时，记录模式

  // 第一次变换，所有节点为 "key": {...} 形式
  for (let index = 0; index<data.length; index++) {
    const item = data[index]
    const content: string = item.content.trim()

    // 时间节点
    if (item.level == 0) {
      // 1.1. 准备字段
      const content_array = content.split("/")
      const start_time_str: string = content_array[0].trim();
      // node.start = start_time_str;
      const end_time_str: string = content_array[1] ? content_array[1].trim() : "P1D"
      // node.end = end_time_str;
      // const mid_time_str: string|null = content_array[2] ? content_array[2].trim() : null // 暂不支持，以后再说

      // 1.2. 准备格式类型
      if (!time_mode) {
        if (/^\d+$/.test(start_time_str)) {
            time_mode = 'timestamp';
        } else if (DateTime.fromISO(start_time_str).isValid) {
            time_mode = 'ISO8601';
        } else {
            time_mode = 'string';
        }
      }

      // 2.1. 填充初始值
      const node: GanttNode = {
        content: "",
        start: 0,
        end: 0,
        duration: 0,
        group1: 0,
      }

      // 2.2. 填充归一化的时间
      if (time_mode === 'ISO8601') {
        const startDateTime = DateTime.fromISO(start_time_str);
        if (startDateTime.isValid) { node.start = startDateTime.toMillis(); }
        else { console.warn('开始时间解析失败1'); prev_nodes = undefined; continue; }
        //
        const potentialEndDate = DateTime.fromISO(end_time_str);
        if (potentialEndDate.isValid) { // b1. 绝对日期
          node.end = potentialEndDate.toMillis();
        } else {
          const potentialDuration = Duration.fromISO(end_time_str);
          if (potentialDuration.isValid) { // b2. 持续时间 (e.g., "P1D")
            node.end = startDateTime.plus(potentialDuration).toMillis();
          } else { // b3. 解析失败
            console.warn('结束时间解析失败1'); prev_nodes = undefined; continue;
          }
        }
      } else if (time_mode === 'timestamp') {
        const startTimestamp = parseInt(start_time_str, 10);
        if (!isNaN(startTimestamp)) node.start = startTimestamp;
        else { console.warn('开始时间戳解析失败2'); prev_nodes = undefined; continue; }
        //
        const endTimestamp = parseInt(end_time_str, 10);
        if (!isNaN(endTimestamp)) node.end = endTimestamp;
        else { console.warn('结束时间戳解析失败2'); prev_nodes = undefined; continue; }
      } else {
        console.warn('暂不支持非时间格式的甘特图时间解析');
        prev_nodes = undefined
        continue
      }

      // 2.3. 填充分组
      if (prev_group1.length == 0) {
        // b1. 还没有第一组，添加新组
        node.group1 = 0; prev_group1.push(node.end);
      } else {
        // b2. 寻找到所属组
        let target_group1: undefined | number
        for (let group1=0; group1 < prev_group1.length; group1++) {
          if (node.start < prev_group1[group1]) continue
          target_group1 = group1
          node.group1 = group1; prev_group1[group1] = node.end;
          break
        }
        // b3. 没有合适组，添加新组
        if (target_group1 === undefined) {
          node.group1 = prev_group1.length; prev_group1.push(node.end);
        }
      }

      nodes.push(node)
      prev_nodes = node
      continue
    }
    // 内容节点
    else {
      if (!prev_nodes || !time_mode) continue // 异常
      prev_nodes.content = content
      prev_nodes = undefined
    }
  }

  return {
    data: nodes,
    time_mode
  }
}

// 将data数组转对象，如果根节点只有一个则正常转，如果有多个根节点则自动加上名为root的根节点
function array2data(array: object[]): object {
  if (array.length==1) {
    return array[0]
  } else {
    return {
      name: "root",
      children: array
    }
  }
}
