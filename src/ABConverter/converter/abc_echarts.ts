/**
 * 仅负责转为 echart 的 json/js 文本
 * 
 * 均为 md_str -> md_str, 不负责图表渲染部分
 * 
 * 需要结合 [any-block/obsidian-charts](https://github.com/any-block/obsidian-charts)
 * 或 vuepress 生态系统中的 echarts 插件使用
 */

import {ABConvert_IOEnum, ABConvert, type ABConvert_SpecSimp} from "./ABConvert"
import {ABConvertManager} from "../ABConvertManager"
import {ABReg} from "../ABReg"
import { type List_ListItem, ListProcess } from "./abc_list"

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
    let radial_array: RadialNode[] = list2radial_array(list_data)
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
  match: /list2echarts_sunburst(.*)/,
  detail: "将列表转换为放ECharts旭日图 (平均分配)",
  process_param: ABConvert_IOEnum.text,
  process_return: ABConvert_IOEnum.text,
  process: (el, header, content: string): string=>{
    let list_data: List_ListItem = ListProcess.list2data(content, false)
    list_data = ListProcess.data2strict(list_data)
    let radial_array: RadialNode[] = list2radial_array(list_data, true)

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
function list2radial_array(data: List_ListItem, leafValue: boolean = false): RadialNode[] {
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
