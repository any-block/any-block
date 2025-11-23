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
    const script_str = ganttdata_to_script(gantt_array)

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
type GanttInfo = {
  data: GanttNode[],
  time_mode: 'ISO8601' | 'timestamp' | 'string' | undefined,
  min_time?: number,
  max_time?: number,
  max_group1: number,
}
function c2listdata2gantt_array(data: List_C2ListItem): GanttInfo {
  let nodes: GanttNode[] = []           // 节点列表
  let prev_nodes: GanttNode|undefined   // 缓存零级level的最新节点
  let prev_group1: number[] = []        // 缓存每一个分组的尾范围，其length表示当前分组数
  let min_time: number|undefined
  let max_time: number|undefined

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
      min_time = (min_time === undefined) ? node.start : Math.min(min_time, node.start)
      max_time = (max_time === undefined) ? node.end : Math.max(max_time, node.end)

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
    time_mode,
    max_group1: prev_group1.length,
    min_time,
    max_time,
  }
}

function ganttdata_to_script(gantt_data: GanttInfo): string {
  const { data: ganttNode, max_group1, min_time, max_time } = gantt_data

  // data数据重新准备
  let data: { value: (string|number)[], itemStyle?: any }[] = []
  for (const item of ganttNode) {
    data.push({
      value: [
        item.content, item.group1, item.start, item.end, item.end - item.start
      ],
      itemStyle: {
        color: getRandomColor()
      }
    })
  }
  // 填充随机颜色
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // 主体
  const categories = Array.from({ length: max_group1 }, (_, i) => '');
  const height_calc = categories.length * 40;
  const startTime = min_time ?? 0 - 1 * 24 * 60 * 60 * 1000;
  let option = {
    tooltip: { // 悬浮显示文字
      trigger: 'item',
    },
    dataZoom: [
      {
        type: 'slider', // 滑动条型 dataZoom
        xAxisIndex: 0, // 控制第一个 X 轴
        filterMode: 'weakFilter',
        height: 20, // 滑动条高度
        bottom: 10, // 距离底部的距离
        start: 0, // 初始显示范围
        end: 100, // 初始显示范围
        handleIcon: 'path://M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
        handleSize: '80%',
        showDetail: false,
      },
      {
        type: 'inside', // 内置型 dataZoom，支持鼠标滚轮缩放
        xAxisIndex: 0, // 控制第一个 X 轴
        filterMode: 'weakFilter',
        start: 0,
        end: 100
      }
    ],
    grid: {
      height: height_calc,
      top: 40,
      bottom: 40,
      left: 15,
      right: 15,
    },
    xAxis: {
      position: 'top',
      min: startTime,
      scale: true,
      splitNumber: 30, // 显示更密集 (非一定，会避免标签重叠)
      axisLabel: {
        fontSize: 10, // 显示更密集
      }
    },
    yAxis: {
      data: categories, // 分类
      inverse: true,
    },
    series: [
      {
        type: 'custom',
        itemStyle: {
          opacity: 0.8 // 透明度
        },
        encode: {
          x: [2, 3], // 将value数组的第N个元素映射到x轴 (开始和结束时间)
          y: 1 // 将value数组的第N个元素映射到y轴 (分类索引)
        },
        data: data
      }
    ]
  };

  const script_str = `\`\`\`echarts
height = ${height_calc + 80}
const option = ${JSON.stringify(option, null, 2)}

// 自定义渲染函数 - x轴
let lastMonth = -1; // 用来记录上一个刻度的月份
option.xAxis.axisLabel.formatter = function (val) {
  let date = new Date(val);
  let currentMonth = date.getMonth();
  if (lastMonth !== currentMonth) { // 如果月份与上一个不同，或者这是第一个刻度
    lastMonth = currentMonth;
    return echarts_lib.format.formatTime('yyyy-MM', val) + '\\n' +
      echarts_lib.format.formatTime('dd', val);
  } else {
    return '\\n' +   // (头部空换行保持高度不变，避免缩放时图表跳动)
      echarts_lib.format.formatTime('dd', val);
  }
}

// 自定义渲染函数 - tooltip, 支持html
option.tooltip.formatter = function (params) {
  // let categoryName = categories[params.value[1]];
  return echarts_lib.format.formatTime('MM-dd', params.value[2]) +
    '/' +
    echarts_lib.format.formatTime('MM-dd', params.value[3]) +
    '<br />' +
    params.value[0].replaceAll('\\n', '<br />');
},

// 自定义渲染函数 - 图表内容
option.series[0].renderItem = function renderItem(params, api) {
  var categoryIndex = api.value(1); // 分类索引
  var start = api.coord([api.value(2), categoryIndex]);
  var end = api.coord([api.value(3), categoryIndex]);
  var height = api.size([0, 1])[1] * 1 - 5;
  var rectShape = echarts_lib.graphic.clipRectByRect( // 绘制矩形，并裁减
    {
      x: start[0],
      y: start[1] - height / 2,
      width: end[0] - start[0],
      height: height,
    },
    {
      x: params.coordSys.x,
      y: params.coordSys.y,
      width: params.coordSys.width,
      height: params.coordSys.height
    }
  );
  var text_array = api.value(0).split('\\n');
  return (
    rectShape && {
      type: 'group', // group 元素，包含矩形和文本
      children: [
        {
          type: 'rect', // 矩形元素
          transition: ['shape'],
          shape: {
            ...rectShape,
            r: 5, // 圆角半径
          },
          style: api.style()
        },
        {
          type: 'text', // 文本元素
          transition: ['style'], // 对样式应用过渡动画
          style: {
            x: start[0] + 5, // 将文本放在矩形内部，并向右偏移 5px
            y: start[1], // 垂直居中
            text: (text_array.length > 1 ? text_array[0] + '...' : text_array[0]),
            // fill: '#fff', // 文本颜色
            textVerticalAlign: 'middle', // 文本垂直对齐方式
            textAlign: 'left' // 文本水平对齐方式
          }
        }
      ]
    }
  );
}
\`\`\``;

  return script_str
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
