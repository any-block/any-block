/**
 * 钩子入口
 * 
 * 总逻辑梳理
 * mermaid
 * - 状态管理器 : 用来设置状态的
 *   - 范围管理器 (全文文本构造) interface SpecKeyword : 一个文档有多个范围管理器
 *     - 装饰管理器 (传入范围管理器) / 替换管理器 : 一个子范围管理器有多个范围，每个范围可以使用的装饰不同
 * 
 * 流程：
 * - 选择范围
 * 
 * TODO 封装为更通用的 Extension 或 ViewPlugin<(Anonymous class), undefined> 类型
 */

import {
  EditorView,
  Decoration,         // 装饰
  type DecorationSet,  // 装饰集
  WidgetType
} from "@codemirror/view"
import { StateField, StateEffect, EditorState, EditorSelection, Transaction, Range } from "@codemirror/state"
import  { MarkdownView, type View, type Editor } from 'obsidian';

import type AnyBlockPlugin from '../../main'
import { ConfDecoration } from "../../config/ABSettingTab"
import { autoMdSelector, type MdSelectorRangeSpec} from "./ABSelector_Md"
import { ABReplacer_Widget } from "./ABReplacer_Widget"
import { abConvertEvent } from "@/ABConverter/ABConvertEvent"
// import { create_decorations } from "../../../CodeMirror/src/" // [!code hl] obsidian-pro

// 获取 - 模式
enum Editor_mode{
  NONE,         // 获取失败
  SOURCE,       // 源码模式
  SOURCE_LIVE,  // 实时模式
  PREVIEW,      // 阅读模式
}

let global_timer: number|null = null // 定时器，单例

/**
 * 状态管理器
 * 
 * @default
 * 启用状态字段装饰功能
 * RAII原则，一次性使用
 */
export class ABStateManager {

  /** --------------------------------- 主要参数 -------------------------- */

  plugin_this: AnyBlockPlugin
  replace_this = this
  view: MarkdownView        // Ob View
  editor: Editor            // Ob Editor
  editorView: EditorView    // CM View
  editorState: EditorState  // CM State
  initialFileName: String | undefined // 固定为构造时的名字

  // 用于防止频繁刷新
  // 若 true->true/false->false，不大刷新，仅局部刷新
  // 若 false->true/true->false，大刷新
  is_prev_cursor_in:boolean
  prev_decoration_mode:ConfDecoration
  prev_editor_mode:Editor_mode

  // get cursor(): EditorPosition {return this.editor.getCursor();}
  // get state(): any {return this.view.getState()}
  // get mdText(): string {return this.editor.getValue()}

  customData: {
    cancelFlag: number[],
    updateMode: string
  } = {
    cancelFlag: [],
    updateMode: '',
  }

  /** --------------------------------- 特殊函数 -------------------------- */

  constructor(plugin_this: AnyBlockPlugin){
    this.plugin_this=plugin_this
    // 因为打开文档会触发，所以后台打开的文档会return false，聚焦到一个非文件的新标签页也会return false
    let ret = this.constructor_init()

    if (this.plugin_this.settings.is_debug) console.log(">>> ABStateManager, initialFileName:", this.initialFileName, "initRet:", ret)

    if (ret) this.setStateEffects()

    // 后处理钩子 (在页面加载后被触发/定时触发)
    {
      if (global_timer !== null) { window.clearInterval(global_timer); global_timer = null; }
      if (plugin_this.settings.enhance_refresh_time > 0) {
        if (plugin_this.settings.enhance_refresh_time < 500) plugin_this.settings.enhance_refresh_time = 500 // limit min time
        global_timer = window.setInterval(() => {
          if (plugin_this.settings.is_debug) console.log("    auto refresh event:", this.initialFileName)
          abConvertEvent(document, true)
        }, plugin_this.settings.enhance_refresh_time)
      }
    }
    abConvertEvent(document)
  }

  // 设置常用变量
  private constructor_init() {
    // 从 obsidian 的 MarkdownView 中获取 codemirror 的 EditorView & EditorState
    // 后续都用不到 obsidian 相关的东西了，只需要用 codemirror 的 api
    const view: MarkdownView|null = this.plugin_this.app.workspace.getActiveViewOfType(MarkdownView); // 未聚焦(active)会返回null
    if (!view) return false
    this.view = view
    this.initialFileName = this.view.file?.basename
    this.editor = this.view.editor
    // @ts-expect-error Editor without cm
    this.editorView = this.editor.cm
    this.editorState = this.editorView.state

    this.is_prev_cursor_in = true
    this.prev_decoration_mode = ConfDecoration.none
    this.prev_editor_mode = Editor_mode.NONE
    return true
  }

  destructor() {
    if (this.plugin_this.settings.is_debug) console.log("<<< ABStateManager, initialFileName:", this.initialFileName)
    if (global_timer !== null) { window.clearInterval(global_timer); global_timer = null; }
  }

  /** --------------------------------- CM 函数 -------------------------- */

  // 设置初始状态字段并派发。核心
  private setStateEffects() {
    let stateEffects: StateEffect<unknown>[] = []
  
    /**
     * 修改StateEffect1 - 加入StateField、css样式
     * 当EditorState没有(下划线)StateField时，则将该(下划线)状态字段 添加进 EditorEffect中
     *    （函数末尾再将EditorEffect派发到EditorView中）。
     * 就是说只会在第一次时执行，才会触发
     */
    if (!this.editorState.field(this.decorationField, false)) {
      stateEffects.push(StateEffect.appendConfig.of(
        [this.decorationField] 
      ))
      // if (!once_flag) {
      //   once_flag = true
      //   stateEffects.push(StateEffect.appendConfig.of(
      //     [ABDecorationManager.decoration_theme()]
      //   ))
      // }
    }
  
    // 派发
    this.editorView.dispatch({effects: stateEffects})
    return true
  }

  /** 一个类成员。StateField，该状态管理Decoration */
  private decorationField = StateField.define<DecorationSet>({
    create: (editorState:EditorState) => {return Decoration.none},
    // create好像不用管，update无论如何都能触发的
    // 函数的根本作用，是为了修改decorationSet的范围，间接修改StateField的管理范围
    update: (decorationSet:DecorationSet, tr:Transaction)=>{
      return this.onUpdate(decorationSet, tr)
    },
    provide: (f: StateField<DecorationSet>) => EditorView.decorations.from(f)
  })

  /** --------------------------------- on更新事件 ------------------------- */

  // on update, to updateStateField
  private onUpdate (decorationSet:DecorationSet, tr:Transaction): DecorationSet {    
    // 如果没有修改就不管了（点击编辑块的按钮除外）
    // if(tr.changes.empty) return decorationSet

    // 1. 准备，获取 - 编辑器模式、装饰选项、选择器选项
    let editor_mode: Editor_mode = this.getEditorMode()
    let decoration_mode:ConfDecoration
    if(editor_mode==Editor_mode.SOURCE) {
      decoration_mode = this.plugin_this.settings.decoration_source
    }
    else if(editor_mode==Editor_mode.SOURCE_LIVE) {
      decoration_mode = this.plugin_this.settings.decoration_live
    }
    else {
      decoration_mode = this.plugin_this.settings.decoration_render
    }

    // 1.2 排除非装饰 (如源码模式) 的情况
    if (decoration_mode == ConfDecoration.none) {
      // 装饰模式改变，则清空装饰集
      if (decoration_mode != this.prev_decoration_mode) {
        decorationSet = decorationSet.update({
          filter: (from:number, to:number, value:unknown)=>{ return false }
        })
      }
      // 装饰模式不改变，不管
      else {}

      this.is_prev_cursor_in = true; // 返回前操作1
      this.prev_decoration_mode = decoration_mode; this.prev_editor_mode = editor_mode; // 返回前操作2
      return decorationSet
    }

    // 2. 解析、并装饰调整匹配项（删增改），包起来准备防抖（未防抖）
    // // let refreshStrong = this.onUpdate_refresh.bind(this)
    const new_decorationSet = this.onUpdate_refresh(decorationSet, tr, decoration_mode, editor_mode)
    this.prev_decoration_mode = decoration_mode; this.prev_editor_mode = editor_mode; // 返回前操作2
    return new_decorationSet

    // [!code hl] obsidian-pro
    // TODO 没有排除源码模式的情况
    // const create_widget = (
    //   customData: { cancelFlag: number[], updateMode: string|number },
    //   state: EditorState, oldView: EditorView,
    //   rangeSpec: any, // RangeSpec_AnyBlock
    //   // rangeSpec: RangeSpec_Codeblock | RangeSpec_Quote | RangeSpec_AnyBlock,
    //   focusLine: number|null = null, focusOffset: number = 0
    // ): WidgetType => {
    //   // 这里再转回旧版的，复用旧版的逻辑
    //   const rangeSpec_: MdSelectorRangeSpec = {
    //     content: rangeSpec.text_content,

    //     from_ch: rangeSpec.fromPos,
    //     to_ch: rangeSpec.toPos,
    //     header: rangeSpec.header,
    //     selector: rangeSpec.selector,
    //     prefix: rangeSpec.parent_prefix,
    //   }
    //   return new ABReplacer_Widget(rangeSpec_, this.editor, customData)
    // }
    // const new_decorationSet = create_decorations(this.customData, this.editorView, tr, decorationSet, 
    //   create_widget
    // )
    // this.prev_decoration_mode = decoration_mode; this.prev_editor_mode = editor_mode; // 返回前操作2
    // return new_decorationSet
  }

  /**
   * 刷新内容
   * 
   * 刷新类型:
   * - 装饰调整（删增改），包起来准备防抖
   * - 小刷新：位置映射（每次都会刷新）
   * - 大刷新：全部元素删掉再重新创建（避免频繁大刷新）
   * 
   * 大刷新的条件：
   * - 当鼠标进出范围时
   * - 当装饰类型改变时
   * - 当切换编辑模式时
   * 
   * 性能测试：(2025-05-22, n为当前)
   * 
   * 事件
   * [!code error] 该函数没有卸载干净，关闭重开会重复执行。测试时需要注意这点，以及等待修复
   * - 光标外部移动/增/删
   *   - n次执行函数，每次n次 "外部光标变更"
   * - 光标移动出去
   *   - (同上，但每次函数调用多1次 "光标切换事件")
   * - 光标内部移动/增/删
   *   - n次函数调用，每次n-1次 "外部光标变更"，1次 "内部光标变更"
   * - 光标移动进入
   *   - (同上，但每次函数调用多1次 "光标切换事件")
   * - 点击编辑按钮进入
   *   - (等同于三次操作: 光标移动进入 + 两次光标内部移动)
   * 
   * @param decorationSet 装饰集
   * @param tr 此次更新的修改内容
   * @param decoration_mode 如何装饰 (源md or 下划线 or 渲染成ab块)
   * @param editor_mode 编辑器模式 (源码/实时/阅读)
   */
  private onUpdate_refresh(decorationSet:DecorationSet, tr:Transaction, decoration_mode:ConfDecoration, editor_mode:Editor_mode): DecorationSet {
    const updateMode = this.customData.updateMode; this.customData.updateMode = '' // 仅生效这一次

    // #region 得到映射装饰集 (范围映射 旧装饰集 得到)
    // const old_decorationSet = decorationSet
    try {
      decorationSet = decorationSet.map(tr.changes)
    } catch (e) {
      // 如果将tr更新的新旧对象错误混用，会出现这种问题 (之前修复了光标位置延时问题后，触发了这个问题)
      console.warn('decorationSet map error, maybe paste ab at end', e)
    }
    // #endregion

    // #region 得到新范围集 (更新后)
    const list_rangeSpec:MdSelectorRangeSpec[] = autoMdSelector(this.getMdText(tr))
    // #endregion

    // #region 得到新装饰集 (范围集 (list_rangeSpec) -> 装饰集 (list_add_decoration) 生成)
    // (用于局部刷新)
    let list_decoration_nochange:Range<Decoration>[] = [] // 装饰集 - 无光标变动部分 -> 不会导致刷新
    let list_decoration_change:Range<Decoration>[] = []   // 装饰集 - 有光标变动部分 -> 会导致刷新
    const cursorSpec = this.getCursorCh(tr)               // 光标位置 - 将来 (光标移动后的位置)
    const cursorSpec_last = this.getCursorCh()            // 光标位置 - 过去 (光标移动前的位置)
    let is_current_cursor_in = false // 当前光标是否在ab块区域内
    for (let rangeSpec of list_rangeSpec){
      // (1) 判断光标与该范围项的关系
      let isCursorIn = false // 当前光标是否位于该ab区域内
      let isCursonIn_last = false // 旧光标位于该ab区域内
      if (cursorSpec.from >= rangeSpec.from_ch && cursorSpec.from <= rangeSpec.to_ch
          || cursorSpec.to >= rangeSpec.from_ch && cursorSpec.to <= rangeSpec.to_ch
      ) {
        isCursorIn = true
      }
      if (cursorSpec_last.from >= rangeSpec.from_ch && cursorSpec_last.from <= rangeSpec.to_ch
        || cursorSpec_last.to >= rangeSpec.from_ch && cursorSpec_last.to <= rangeSpec.to_ch
      ) {
        isCursonIn_last = true
      }

      // (2) 给当前范围项创建一个装饰类，并添加到装饰集

      // 先检查特殊光标 - ESC局部源码模式的虚拟光标
      if (this.customData.cancelFlag.includes(rangeSpec.from_ch)) {
        // 光标在内
        if (isCursorIn) {
          const decoration = Decoration.mark({
            class: "cm-line-yellow",
            inclusive: true, // 区别: PosAtDom() 时有区别，false的话pos结果有波动，true则获取结果包含两侧符号，更稳定。且 img.cm-widgetBuffer 可能消失
          // block: true, // 区别: 光标上下移动会跳过 block，但这个也能自行监听且感觉更合适
          })
          list_decoration_change.push(decoration.range(rangeSpec.from_ch, rangeSpec.to_ch))
          continue
        }
        // 光标在外。删除对应的ESC区域
        else {
          if (this.customData.cancelFlag.includes(rangeSpec.from_ch)) {
            this.customData.cancelFlag = this.customData.cancelFlag.filter(item => item !== rangeSpec.from_ch)
          }
        }
      }

      // 该ab区域显示为下划线装饰
      if (isCursorIn) {
        is_current_cursor_in = true
        const decoration = Decoration.mark({class: "ab-line-yellow"}) // TODO fix bug：当光标在局部频繁移动时或其他情况? 这里会被重复添加很多层带这个class的span嵌套
        list_decoration_change.push(decoration.range(rangeSpec.from_ch, rangeSpec.to_ch))
      }
      // 该ab区域显示为渲染的ab块 - 变化
      else if (isCursonIn_last) {
        const decoration = Decoration.replace({
          widget: new ABReplacer_Widget(rangeSpec, this.editor, this.customData),
          // inclusive: true, block: true, // 区别: 光标上下移动会跳过 block
        })
        list_decoration_change.push(decoration.range(rangeSpec.from_ch, rangeSpec.to_ch))
      }
      // 该ab区域显示为渲染的ab块 - 不变化
      else {
        const decoration = Decoration.replace({
          widget: new ABReplacer_Widget(rangeSpec, this.editor, this.customData),
          // inclusive: true, block: true, // 区别: 光标上下移动会跳过 block
        })
        // 强制为变化集，用于手动触发某个位置的块的更新
        if (typeof updateMode == 'number' && updateMode >= rangeSpec.from_ch && updateMode <= rangeSpec.to_ch) {
          list_decoration_change.push(decoration.range(rangeSpec.from_ch, rangeSpec.to_ch))
        } else {
          list_decoration_nochange.push(decoration.range(rangeSpec.from_ch, rangeSpec.to_ch))
        }
      }
    }
    // #endregion

    // #region 若没有变化项，可提前返回
    // 变化项包括: 装饰集变化, 光标进出范围集变化，编辑模式变化
    if (list_decoration_change.length == 0
      && is_current_cursor_in == this.is_prev_cursor_in
      && decoration_mode == this.prev_decoration_mode
      && editor_mode == this.prev_editor_mode
    ){
      this.is_prev_cursor_in = is_current_cursor_in; // 返回前操作1
      return decorationSet
    }
    // #endregion

    // #region 用 "新生成的装饰集" 去调整 "新的旧装饰集"
    // 注意DecorationSet是比较特殊的容器，无法直接更新，要通过给定的update > (filter/add) api来更新
    // 注意尽可能保证装饰集变动少，虽然大部分情况这样做没性能问题，但如果存在渲染慢的ab块 (mermaid等)，会存在卡顿
    // 装饰集变化: debug_count1 - debug_count2(非不变项) + debug_count3(变化项1) + debug_count4(变化项2)
    let debug_count1 = 0, debug_count2 = 0, debug_count3 = 0, debug_count4 = 0
    // (1) 删除变化项
    decorationSet = decorationSet.update({
      filter(from, to, value) { // 全部删掉，和不变集相同的则保留
        for (let i = 0; i < list_decoration_nochange.length; i++) {
          const item = list_decoration_nochange[i]
          if (item.from == from && item.to == to) {
            debug_count1++
            list_decoration_nochange.splice(i, 1); return true;
          }
        }
        debug_count1++
        debug_count2++
        return false
      },
    })
    // (2) 新增变化项1
    // 测出了存在一个没有光标变化的新ab块 (在黏贴一段ab块文本会出现这种情况)
    for (const item of list_decoration_nochange) {
      debug_count3++
      decorationSet = decorationSet.update({
        add: [item],
      })
    }
    // (3) 新增变化项2
    for (const item of list_decoration_change) {
      debug_count4++
      decorationSet = decorationSet.update({
        add: [item],
      })
    }
    if (this.plugin_this.settings.is_debug) console.log(`ab cm 装饰集变化: ${debug_count1} -${debug_count2}+${debug_count3}+${debug_count4}`)
    // #endregion

    // #region (废弃) 光标进出范围集事件检测。废弃，代替之的是把之间的新装饰集分成两个部分: 变化/不变。如果有变化，表示有更新事件
    /*
    if (is_current_cursor_in != this.is_prev_cursor_in
      || decoration_mode != this.prev_decoration_mode
      || editor_mode != this.prev_editor_mode
    ){
      this.is_prev_cursor_in = is_current_cursor_in
      this.prev_decoration_mode = decoration_mode
      this.prev_editor_mode = editor_mode

      // 装饰调整 - 删
      decorationSet = decorationSet.update({            // 减少，全部删掉
        filter: (from:number, to:number, value:any) => { return false }
      })
      // 装饰调整 - 增
      for (let item of list_add_decoration) {
        
        decorationSet = decorationSet.update({
          add: [item]
        })
      }
      console.log('刷新 - 光标切换事件')
    }*/
    // #endregion

    this.is_prev_cursor_in = is_current_cursor_in; // 返回前操作1
    return decorationSet
  }

  /** --------------------------------- 一些小工具 ------------------------- */

  /**
   * 获取编辑器模式
   */ 
  private getEditorMode(): Editor_mode {
    /** @warning 不能用 editor_dom = document
     * 再editor_dom = editor_dom?.getElementsByClassName("workspace-tabs mod-top mod-active")[0];
     * 用document的话不知道为什么总是有属性is-live-preview的，总是认为是实时模式 
     */
    // const t: 'source' | 'preview' = this.view.getMode() // 但判断不出是不是实时
    // let editor_dom: Element | undefined = this.plugin_this.app.workspace.getActiveViewOfType(MarkdownView)?.containerEl // 弃用，当前活动窗口不一定是创建时的那个窗口
    let editor_dom: Element = this.view.containerEl
    if (!editor_dom) { // The current cursor is focused on a non-Markdown window.
      return Editor_mode.NONE; 
    }
    let str = editor_dom?.getAttribute("data-mode")
    if (str == "source") {
      editor_dom = editor_dom?.getElementsByClassName("markdown-source-view")[0]
      if(editor_dom?.classList.contains('is-live-preview')) return Editor_mode.SOURCE_LIVE
      else return Editor_mode.SOURCE
    }
    else if (str=="preview"){
      return Editor_mode.PREVIEW  // 但其实不会判定，因为实时是不触发update方法的
    }
    else {
      /*console.warn("无法获取编辑器模式，可能会产生BUG");*/ 
      return Editor_mode.NONE;
    } // 点一下编辑器再点其他布局位置，就会发生
  }

  /**
   * 获取光标位于全文第几个字符
   * 
   * @param tr 如果有tr参数，则计算通过修改后光标将会在什么位置。
   * 如果没有，则获取当前位置 (未经tr更新的旧位置)
   */
  private getCursorCh(tr?: Transaction) {
    const ranges = tr?.state?.selection?.ranges
    if (ranges && ranges.length==1) { // 有tr，且单光标
      return {
        from: ranges[0].from,
        to: ranges[0].to
      }
    }

    let cursor_from_ch = 0
    let cursor_to_ch = 0
    let list_text: string[] = this.editor.getValue().split("\n")
    for (let i=0; i<=this.editor.getCursor("to").line; i++){
      if (this.editor.getCursor("from").line == i) {cursor_from_ch = cursor_to_ch+this.editor.getCursor("from").ch}
      if (this.editor.getCursor("to").line == i) {cursor_to_ch = cursor_to_ch+this.editor.getCursor("to").ch; break;}
      cursor_to_ch += list_text[i].length+1
    }
    return {
      from: cursor_from_ch, 
      to: cursor_to_ch
    }
  }

  /**
   * 获取当前文本
   * 
   * @param tr 如果有tr参数，则获取修改后的md文本
   * 如果没有，则获取当前位置 (未经tr更新的旧位置)
   */
  private getMdText(tr?: Transaction): string {
    const mdText = tr?.state?.doc?.toString()
    if (mdText) {
      return mdText
    }

    return this.editor.getValue()
  }

  /**
   * 光标位置纠正
   * 
   * 问题导致的原理：
   * 替换后的区间被识别为原子区间（atomic range），CodeMirror 默认会将光标定位到原子区间的开始位置
   * 当使用方向键移动时，光标会跳过整个原子区间
   * 
   * 光标位置修复方案：
   * (使其行为与callout一致，避免光标向上/向下移动时，跨越整个ab块。不过光标向下是正常的)
   * 检测逻辑：向上移动时，从范围外向上移动到范围内且第一格处
   * 缺点1：必须借助setTimeout，否则事件还是会被覆盖
   * 缺点2：光标会连同滚动条一起到达顶端，然后再往段末尾移动，会有问题
   * 
   * 最后解决方法：
   * 最后居然是靠css解决的……以前ab-replace消除cm-widgetBuffer自带的间隙，居然会导致光标移动时跳过cm-widgetBuffer，非常奇怪
   * 把ab-replace的负margin再调整一下，就正常了
   */
  private setPos(cursorSepc: number) {
    window.setTimeout(() => { // 使用微任务确保在当前事务完成后执行
      // 方式一：EditorSelection
      const newSelection = EditorSelection.create([
        EditorSelection.range(cursorSepc, cursorSepc)
      ])
      this.editorView.dispatch({
        selection: newSelection
      })

      // 方式二：EditorState
      // const newSelection = EditorState.create({}).selection;
      // const tr2 = this.editorState.update({
      //   selection: newSelection,
      //   changes: tr.changes
      // })
      // this.editorView.dispatch(tr2)

      // 方式三
      // 设置光标到第3行第5列（行号从0开始）。打印顺序对，实际光标位置没改变
      // const targetLine = 6;
      // const targetColumn = 2;
      // // 创建新选区
      // const newSelection = EditorState.create({
      //   doc: this.editorView.state.doc,
      //   selection: { anchor: this.editorView.state.doc.line(targetLine + 1).from + targetColumn }
      // });
      // // 通过事务更新视图
      // this.editorView.dispatch({
      //   selection: newSelection.selection,
      //   effects: EditorView.scrollIntoView(newSelection.selection.main.from) // 滚动到光标
      // });

      // 方式四：obsidian editor。打印顺序对，实际光标位置没改变
      // this.editor.setCursor(correct)
      // this.editor.setCursor({ch: 1, line: 6})
    }, 50)
  }

  /** 防抖器（可复用） */
  /*debouncedFn = this.debounce(this.onUpdate_refresh, 1000, false)
  private debounce(
    method:any,       // 防抖方法
    wait:number,      // 等待
    immediate:boolean // 是否立即执行
  ) {
    let timeout:number|null
    // debounced函数为返回值
    // 使用Async/Await处理异步，如果函数异步执行，等待setTimeout执行完，拿到原函数返回值后将其返回
    // args为返回函数调用时传入的参数，传给method
    let debounced = function(...args: any[]) {
      return new Promise (resolve => {
        // 用于记录原函数执行结果
        let result
        // 将method执行时this的指向设为debounce返回的函数被调用时的this指向
        let context = this
        // 如果存在定时器则将其清除
        if (timeout) {
          clearTimeout(timeout)
        }
        // 立即执行需要两个条件，一是immediate为true，二是timeout未被赋值或被置为null
        if (immediate) {
          // 如果定时器不存在，则立即执行，并设置一个定时器，wait毫秒后将定时器置为null
          // 这样确保立即执行后wait毫秒内不会被再次触发
          let callNow = !timeout
          timeout = window.setTimeout(() => {
            timeout = null
          }, wait)
          // 如果满足上述两个条件，则立即执行并记录其执行结果
          if (callNow) {
            result = method.apply(context, args)
            resolve(result)
          }
        } else {
          // 如果immediate为false，则等待函数执行并记录其执行结果
          // 并将Promise状态置为fullfilled，以使函数继续执行
          timeout = window.setTimeout(() => {
            // args是一个数组，所以使用fn.apply
            // 也可写作method.call(context, ...args)
            result = method.apply(context, args)
            resolve(result)
          }, wait)
        }
      })
    }
  
    // 在返回的debounced函数上添加取消方法
    //debounced.cancel = function() {
    //  clearTimeout(timeout)
    //  timeout = null
    //}
  
    return debounced
  }*/
}
