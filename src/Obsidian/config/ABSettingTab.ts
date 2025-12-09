/**
 * Obsidian 的插件设置页面
 * 
 * TODO：设备Debug日志开关
 */

import {App, PluginSettingTab, Setting, Modal, sanitizeHTMLToDom} from "obsidian"
import type AnyBlockPlugin from "../main"
import {ABConvertManager} from "@/ABConverter/ABConvertManager"
import {ABConvert, type ABConvert_SpecUser} from "@/ABConverter/converter/ABConvert"
import { ABCSetting, ABReg } from "@/ABConverter/ABReg"
import { ABAlias_json, ABAlias_json_default } from "@/ABConverter/ABAlias" // 别名模块
import { root_menu_demo } from "@/ABConverter/demo" // 菜单模块

// 加载所有选择器
import {} from "../ab_manager/abm_cm/ABSelector_MdBase"
import {generateSelectorInfoTable} from "../ab_manager/abm_cm/ABSelector_Md"

import { t } from "../locales/helper"

/** 配置文件 - 接口 */
export interface ABSettingInterface {
  // 选择器模块部分
  select_list: ConfSelect           // 是否启用list选择器
  select_quote: ConfSelect          // 是否启用quote选择器
  select_code: ConfSelect           // 是否启用code选择器
  select_heading: ConfSelect        // 是否启用heading选择器
  select_brace: ConfSelect          // 是否启用brace选择器
  decoration_source: ConfDecoration // 是否在源码模式中启用
  decoration_live: ConfDecoration   // 是否在实时模式中启用
  decoration_render: ConfDecoration // 是否在阅读模式中启用
  is_neg_level: boolean,            // 是否使用负标题标志 `<` (其实是还没做出来)

  // 别名模块部分
  alias_use_default: true,              // 使用默认的别名预设 (可以为了性能优化而关掉)
  alias_user: {                         // 别名系统 (V3.0.8提供)，用户定义的别名 (不包含自带的)
    regex: string,
    replacement: string
  }[],
  user_processor: ABConvert_SpecUser[],  // @deprecated 别名系统 (旧)，用户自定义的别名处理器

  // 其他
  is_debug: boolean,                // 是否开启调试打印
  enhance_refresh_time: number,     // 刷新增强的刷新时间 (ms) (<1000为关闭，最快1s)
  inline_split: string,             // 正则里的内联分隔符
  license_key: string               // pro版许可证密钥
}
export enum ConfSelect{
  no = "no",
  ifhead = "ifhead",
  yes = "yes"
}
export enum ConfDecoration{
  none = "none",
  inline = "inline",
  block = "block"
}

const LICENSE_KEY_DEFAULT = "eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJleHBpcnkiOjE3NTk5MzA4MDYwOTcsInRpZXIiOiJwcm8ifQ==.e7jggys0LBESQU5CPbQwIId0iyZZJZoyx2FHc7JPC6BsncUHL+oYORUYceqYeKjmnQIt+FcgqCeE44930sSUmKJVamxqJKB//zZL/RPnyYbqS1aujzZlNmTWx8MRkr4A4V8+0esQIXBHpZS3Ye5gtwWVg/YuLcHq+cPsh9rxWOEmljauclSmCI4zm0o+pMEoY2NbntPv5DBUZ7k7rh7/a4WGUekb2mu9BmQuK+IzqpdjqDrFs6cn50KjqD122U9Wic7rPk1IqH2TMUjOyo8UIFjbs8RsCy//F6rcY5KJ/kDVjyqBMYaDvwZpbY8qzO1xPWc/GBaezk5SVeQrpek7jQ=="
/** 配置文件 - 默认值 */
export const AB_SETTINGS: ABSettingInterface = {
  select_list: ConfSelect.ifhead,
  select_quote: ConfSelect.ifhead,
  select_code: ConfSelect.ifhead,
  select_heading: ConfSelect.ifhead,
  select_brace: ConfSelect.yes,

  decoration_source: ConfDecoration.none,
  decoration_live: ConfDecoration.block,
  decoration_render: ConfDecoration.block,
  is_neg_level: false,

  alias_use_default: true,
  alias_user: [ // 仅给一个默认示例
    {
      "regex": "|alias_demo|",
      "replacement": "|addClass(ab-custom-text-red)|addClass(ab-custom-bg-blue)|"
    },
    {
      "regex": "/\\|alias_reg_demo\\|/",
      "replacement": "|addClass(ab-custom-text-red)|addClass(ab-custom-bg-blue)|"
    },
  ],
  user_processor: [{ // 仅给一个默认示例
    "id": "alias2_demo",
    "name": "alias2_demo",
    "match": "alias2_demo",
    "process_alias": "|addClass(ab-custom-text-blue)|addClass(ab-custom-bg-red)|"
  }],

  is_debug: false,
  enhance_refresh_time: 2000,
  inline_split: "/\\| |,  |， |\\.  |。 |:  |： /",
  license_key: LICENSE_KEY_DEFAULT,
}

/** 非配置文件 - 当前值/默认值 */
export const expiry = { // 仅用于显示，无其他用处
  expiry: -1
}

/** 设置值面板 */
export class ABSettingTab extends PluginSettingTab {
  plugin: AnyBlockPlugin
  processorPanel: HTMLElement
  selectorPanel: HTMLElement

  // 需要同步obsidian设置和通用设置，保持一致性
  constructor(app: App, plugin: AnyBlockPlugin) {
    super(app, plugin);
    this.plugin = plugin;

    // Convert模块
    ABCSetting.is_debug = this.plugin.settings.is_debug
    ABReg.inline_split = new RegExp(this.plugin.settings.inline_split.slice(1,-1)) // 去除两侧的`/`并变回regExp

    // Alias模块，加载自定义别名
    if (!plugin.settings.alias_use_default) {
      ABAlias_json.length = 0 // 清空数组
    }
    //   新版
    for (let item of plugin.settings.alias_user){
      let newReg: string|RegExp;
      if (/^\/.*\/$/.test(item.regex)) {
        newReg = new RegExp(item.regex.slice(1,-1)) // 去除两侧的`/`并变回regExp
      } else {
        newReg = item.regex
      }
      ABAlias_json.push({
        regex: newReg,
        replacement: item.replacement
      })
    }
    //   旧版
    for (let item of plugin.settings.user_processor){
      ABConvert.factory(item)
    }
  }

  display(): void {
    const {containerEl} = this;
    containerEl.empty();
    let settings = this.plugin.settings
    // new Setting(containerEl).setName('AnyBlock').setHeading();

    // 弃用，移至 MiniDocs
    // const div_url = containerEl.createEl('div');
    //   div_url.empty(); div_url.appendChild(sanitizeHTMLToDom(t("see website for detail")));
    //   div_url.style.marginBottom = "1em";

    // #region 标签页 (设置项框架)
    const el_note = containerEl.createEl('div', {cls: 'ab-note'})
    const el_tab = el_note.createEl('div', {cls: 'ab-tab-root'})
    const el_tab_nav = el_tab.createEl('div', {cls: 'ab-tab-nav'})
    const el_tab_content = el_tab.createEl('div', {cls: 'ab-tab-content'})
    let ab_tab_nav_item: HTMLElement
    let ab_tab_content_item: HTMLElement
    let ab_tab_div_html: HTMLElement
    // #endregion

    // #region Mini docs
    ab_tab_nav_item = el_tab_nav.createEl('button', {cls: 'ab-tab-nav-item', text: t("Mini docs")})
    ab_tab_content_item = el_tab_content.createEl('div', {cls: 'ab-tab-content-item'})
    new Setting(ab_tab_content_item).setName(t("Mini docs")).setHeading();
    ab_tab_div_html = ab_tab_content_item.createEl('div');
      ab_tab_div_html.appendChild(sanitizeHTMLToDom(t("see website for detail")));

    new Setting(ab_tab_content_item).setName(t("Mini docs menu")).setHeading();
    ab_tab_div_html = ab_tab_content_item.createEl('div');
      ab_tab_div_html.appendChild(sanitizeHTMLToDom(t("Mini docs menu2")));
    // #endregion

    // #region 选择器管理
    ab_tab_nav_item = el_tab_nav.createEl('button', {cls: 'ab-tab-nav-item', text: t("Selector manager")})
    ab_tab_content_item = el_tab_content.createEl('div', {cls: 'ab-tab-content-item'})
    new Setting(ab_tab_content_item).setName(t("Selector manager")).setHeading();
    ab_tab_content_item.createEl('p', {text: t("Selector manager2")})
    this.selectorPanel = generateSelectorInfoTable(ab_tab_content_item)
    // #endregion

    // #region 装饰管理器 (目前禁止设置)
    /*ab_tab_nav_item = el_tab_nav.createEl('button', {cls: 'ab-tab-nav-item', text: t("Selector managerN")})
    ab_tab_content_item = el_tab_content.createEl('div', {cls: 'ab-tab-content-item'})
    ab_tab_content_item.createEl('h2', {text: '装饰管理器'});
    new Setting(ab_tab_content_item)
      .setName('源码模式中启用')
      .setDesc('推荐：不启用')
      .addDropdown((component)=>{
        component
        .addOption(ConfDecoration.none, "不启用")
        .addOption(ConfDecoration.inline, "仅启用线装饰")
        .addOption(ConfDecoration.block, "启用块装饰")
        .setValue(settings.decoration_source)
        .onChange(async v=>{
          ts-ignore 这里枚举必然包含v值的
          settings.decoration_source = ConfDecoration[v]  
          await this.plugin.saveSettings();    
        })
      })
    new Setting(ab_tab_content_item)
      .setName('实时模式中启用')
      .setDesc('推荐：启用块装饰/线装饰')
      .addDropdown((component)=>{
        component
        .addOption(ConfDecoration.none, "不启用")
        .addOption(ConfDecoration.inline, "仅启用线装饰")
        .addOption(ConfDecoration.block, "启用块装饰")
        .setValue(settings.decoration_live)
        .onChange(async v=>{
          ts-ignore 这里枚举必然包含v值的
          settings.decoration_live = ConfDecoration[v]
          await this.plugin.saveSettings(); 
        })
      })
    new Setting(ab_tab_content_item)
      .setName('渲染模式中启用')
      .setDesc('推荐：启用块装饰')
      .addDropdown((component)=>{
        component
        .addOption(ConfDecoration.none, "不启用")
        .addOption(ConfDecoration.block, "启用块装饰")
        .setValue(settings.decoration_render)
        .onChange(async v=>{
          ts-ignore 这里枚举必然包含v值的
          settings.decoration_render = ConfDecoration[v]    
          await this.plugin.saveSettings(); 
        })
      })*/
    // #endregion

    // #region 转换器/处理器的管理
    ab_tab_nav_item = el_tab_nav.createEl('button', {cls: 'ab-tab-nav-item', text: t("Convertor manager")})
    ab_tab_content_item = el_tab_content.createEl('div', {cls: 'ab-tab-content-item'})
    new Setting(ab_tab_content_item).setName(t("Convertor manager")).setHeading();
    ab_tab_content_item.createEl('p', {text: t("Convertor manager2")});
    ab_tab_content_item.createEl('p', {text: t("Convertor manager3")});
    const div = ab_tab_content_item.createEl("div");
    ABConvertManager.autoABConvert(div, "info_converter", "", "unknown") // this.processorPanel = ABConvertManager.getInstance().generateConvertInfoTable(containerEl)
    this.processorPanel = div
    // #endregion

    // #region 别名系统 (独立功能)
    ab_tab_nav_item = el_tab_nav.createEl('button', {cls: 'ab-tab-nav-item', text: t("AliasSystem manager")})
    ab_tab_content_item = el_tab_content.createEl('div', {cls: 'ab-tab-content-item'})
    new Setting(ab_tab_content_item).setName(t("AliasSystem manager")).setHeading();
    ab_tab_content_item.createEl('p', {text: t("AliasSystem manager2")});
    ab_tab_content_item.createEl('p', {text: t("AliasSystem manager3")});
    new Setting(ab_tab_content_item)
      .setName(t("AliasSystem manager4"))
      .addButton(component => {
        component
        .setIcon("plus-circle")
        .onClick(e => {
          new ABModal_alias(this.app, async (result)=>{
            // 1. 保存到对象
            let newReg: string|RegExp;
            if (/^\/.*\/$/.test(result.regex)) {
              newReg = new RegExp(result.regex.slice(1,-1)) // 去除两侧的`/`并变回regExp
            } else {
              newReg = result.regex
            }
            ABAlias_json.push({
              regex: newReg,
              replacement: result.replacement
            })
            // 2. 保存到文件
            await this.plugin.saveSettings();
          }).open()
        })
      })
    new Setting(ab_tab_content_item)
      .setName(t("AliasSystem manager5"))
      .addButton(component => {
        component
        .setIcon("plus-circle")
        .onClick(e => {
          new ABProcessorModal(this.app, async (result)=>{
            // 1. 保存到对象
            ABConvert.factory(result)
            settings.user_processor.push(result)
            // 2. 保存到文件
            await this.plugin.saveSettings();
            // 3. 刷新处理器的图表
            this.processorPanel.remove()
            const div = ab_tab_content_item.createEl("div");
            ABConvertManager.autoABConvert(div, "info_converter", "", "null_content")
            this.processorPanel = div
          }).open()
        })
      })
    // #endregion

    // TODO 添加json编辑器而非文本编辑json
    // TODO 持久化
    // #region (pro) 菜单模块 (独立功能)
    if (ABCSetting.env === 'obsidian-pro') {
      ab_tab_nav_item = el_tab_nav.createEl('button', {cls: 'ab-tab-nav-item', text: "编辑器菜单"})
      ab_tab_content_item = el_tab_content.createEl('div', {cls: 'ab-tab-content-item'})
      new Setting(ab_tab_content_item).setName("编辑器菜单").setHeading()
      ab_tab_content_item.createEl('p', {text: `(!将弃用，请使用同作者开发的 AnyMenu 插件)`})
      ab_tab_content_item.createEl('p', {text: `你可以在这里编辑扩展的编辑器右键菜单，加入自定义要黏贴的预设文本。
编辑器菜单是一个独立功能的通用模块，你可以把他当作另一个独立功能的插件来使用`})
      ab_tab_content_item.createEl('p', {text: `! 仅测试用。目前这一部分在非Pro版仅供查询不可编辑，且目前不写配置文件，设置后重启就不生效了`})

      // demo (注意: 不支持callback为函数)
      // const textarea = ab_tab_content_item.createEl('textarea')
      // textarea.style.width = "100%"
      // textarea.style.height = "600px"
      // textarea.style.resize = "vertical"
      // textarea.textContent = JSON.stringify(root_menu_demo, null, 2)

      // demo2
      const div = ab_tab_content_item.createEl('div')
      ABConvertManager.autoABConvert(div, "json-e", `\`\`\`json\n${JSON.stringify(root_menu_demo, null, 2)}\n\`\`\``, "unknown", {
        save: (str_with_prefix: string, force_refresh: boolean = false) => {
          // 去除代码块
          const match = /^(```+|~~~+)(.*)\n([\s\S]*?)\n(\1)$/gm.exec(str_with_prefix)
          let content2 = str_with_prefix
          if (match) {
            content2 = match[3]
          }

          Object.assign(root_menu_demo, JSON.parse(content2)) // 以json方式拷贝
        }
      })
    }
    // #endregion

    // #region (pro) 许可证
    if (ABCSetting.env === 'obsidian-pro') {
      ab_tab_nav_item = el_tab_nav.createEl('button', {cls: 'ab-tab-nav-item', text: t("License")})
      ab_tab_content_item = el_tab_content.createEl('div', {cls: 'ab-tab-content-item'})
      new Setting(ab_tab_content_item).setName(t("License")).setHeading()
      ab_tab_content_item.createEl('p', {text: t("License2")})
      // new Setting(ab_tab_content_item)
      //   .setName("Serial number")
      //   .addText(text => text
      //     .setDisabled(true)
      //     .setValue("TODO                                 ")
      //   )
      new Setting(ab_tab_content_item)
        .setName(t("License key"))
        .addTextArea(text => text
          .setValue(settings.license_key)
          .onChange(async (value) => {
            settings.license_key = value
            await this.plugin.saveSettings()
          })
        )
      new Setting(ab_tab_content_item)
        .setName(t("License Expiry"))
        .addText(text => text
          .setDisabled(true)
          .setValue(expiry.expiry > 0 ?
            new Date(expiry.expiry).toLocaleDateString() :
            "No License: " + expiry.expiry)
        )
      new Setting(ab_tab_content_item)
        .setName("Debug")
        .setDesc("Only for developer use")
        .addToggle(toggle => toggle
          .setValue(settings.is_debug)
          .onChange(async (value) => {
            settings.is_debug = value; ABCSetting.is_debug = value;
            await this.plugin.saveSettings()
          })
        )
    }
    // #endregion

    // #region 标签页 - 动态部分
    const lis:NodeListOf<HTMLButtonElement> = el_tab.querySelectorAll(":scope>.ab-tab-nav>.ab-tab-nav-item")
    const contents = el_tab.querySelectorAll(":scope>.ab-tab-content>.ab-tab-content-item")
    if (lis.length!=contents.length) console.warn("ab-tab-nav-item和ab-tab-content-item的数量不一致2")
    for (let i=0; i<lis.length; i++){
      // init
      if (i==0) {
        lis[i].setAttribute("is_activate", "true")
        contents[i].setAttribute("is_activate", "true")
        contents[i].setAttribute("style", "display:block")
      } else {
        lis[i].setAttribute("is_activate", "false")
        contents[i].setAttribute("is_activate", "false")
        contents[i].setAttribute("style", "display:none")
      }

      // onclick
      lis[i].onclick = ()=>{
        for (let j=0; j<contents.length; j++){
          lis[j].setAttribute("is_activate", "false")
          contents[j].setAttribute("is_activate", "false")
          contents[j].setAttribute("style", "display:none")
        }
        lis[i].setAttribute("is_activate", "true")
        contents[i].setAttribute("is_activate", "true")
        contents[i].setAttribute("style", "display:block")
      }
    }
    // #endregion
  }
}

/** 设置子面板 - 自定义处理器 */
class ABProcessorModal extends Modal {
  args: ABConvert_SpecUser
  onSubmit: (args: ABConvert_SpecUser)=>void

  constructor(
    app: App, 
    onSubmit: (args: ABConvert_SpecUser)=>void
  ) {
    super(app);
    this.args = {
      id: "",
      name: "",
      match: "",
      process_alias: ""
    }
    this.onSubmit = onSubmit
  }

  onOpen() {  // onOpen() 方法在对话框打开时被调用，它负责创建对话框中的内容。想要获取更多信息，可以查阅 HTML elements。
    let { contentEl } = this;
    contentEl.setText(t("Custom processor"));
    contentEl.createEl("p", {text: ""})
    new Setting(contentEl)
      .setName(t("Custom processor2"))
      .setDesc(t("Custom processor3"))
      .addText((text)=>{
        text.onChange((value) => {
          this.args.id = value
        })
      })

    new Setting(contentEl)
      .setName(t("Custom processor4"))
      .setDesc(t("Custom processor5"))
      .addText((text)=>{
        text.onChange((value) => {
        this.args.name = value
      })
    })

    new Setting(contentEl)
      .setName(t("Custom processor6"))
      .setDesc(t("Custom processor7"))
      .addText((text)=>{
        text.onChange((value) => {
        this.args.match = value
      })
    })

    new Setting(contentEl)
      .setName(t("Custom processor8"))
      .setDesc(t("Custom processor9"))
      .addText((text)=>{
        text.onChange((value) => {
        this.args.process_alias = value
      })
    })

    new Setting(contentEl)
      .addButton(btn => {
        btn
        .setButtonText(t("Submit"))
        .setCta() // 这个不知道什么意思
        .onClick(() => {
          if(this.args.id && this.args.name && this.args.match && this.args.process_alias){
            this.close();
            this.onSubmit(this.args);
          }
        })
      })
  }

  onClose() {  // onClose() 方法在对话框被关闭时调用，它负责清理对话框所占用的资源。
    let { contentEl } = this;
    contentEl.empty();
  }
}

/** 设置子面板 - 别名 */
class ABModal_alias extends Modal {
  args: {regex: string,replacement: string}
  onSubmit: (args: {regex: string,replacement: string})=>void

  constructor(
    app: App, 
    onSubmit: (args: {regex: string,replacement: string})=>void
  ) {
    super(app);
    this.args = {
      regex: "",
      replacement: ""
    }
    this.onSubmit = onSubmit
  }

  onOpen() {  // onOpen() 方法在对话框打开时被调用，它负责创建对话框中的内容。想要获取更多信息，可以查阅 HTML elements。
    let { contentEl } = this;
    contentEl.setText(t("Custom alias"));
    contentEl.createEl("p", {text: ""})
    new Setting(contentEl)
      .setName(t("Custom alias2"))
      .setDesc(t("Custom alias3"))
      .addText((text)=>{
        text.onChange((value) => {
        this.args.regex = value
      })
    })

    new Setting(contentEl)
      .setName(t("Custom alias4"))
      .setDesc(t("Custom alias5"))
      .addText((text)=>{
        text.onChange((value) => {
        this.args.replacement = value
      })
    })

    new Setting(contentEl)
      .addButton(btn => {
        btn
        .setButtonText(t("Submit"))
        .setCta() // 这个不知道什么意思
        .onClick(() => {
          if(this.args.regex && this.args.replacement){
            this.close();
            this.onSubmit(this.args);
          }
        })
      })
  }

  onClose() {  // onClose() 方法在对话框被关闭时调用，它负责清理对话框所占用的资源。
    let { contentEl } = this;
    contentEl.empty();
  }
}
