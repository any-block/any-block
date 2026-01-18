/**
 * obsidian 相关工具
 * 
 * 增强复用
 */

import {
  type Plugin,
  MarkdownView,
  Notice,
  setIcon,
  TFile,
} from 'obsidian'
import { convert_to_codeblock } from '@/Scripts/index'
import { t } from 'locales/helper'

/** obsidian 命令管理 */
export function registerCommands(plugin: Plugin) {
  // 刷新视图
  plugin.addCommand({
    id: 'any-block-rebuild-view',
    name: t('any-block-rebuild-view'),
    // callback: () => {},
    editorCallback: async (_editor, view) => {
      if (!(view instanceof MarkdownView)) return
      const leaf = view.leaf
      if (!leaf) return
      // @ts-expect-error 类型“WorkspaceLeaf”上不存在属性“rebuildView”
      leaf.rebuildView()
    }
  })

  // 将当前文件的 anyblock 区块全部转换为代码块格式，并生成备份
  // 这里有两种策略，当前选用第二种:
  // - 原文件到备份文件，新内容覆盖当前文件
  // - (选用) 新内容直接生成到临时文件
  plugin.addCommand({
    id: 'any-block-to-codeblock',
    name: t('any-block-to-codeblock'),
    // callback: () => {},
    editorCallback: async (_editor, view) => {
      // 旧内容
      if (!(view instanceof MarkdownView)) return
      const file = view.file
      if (!file) return
      const text = view.data

      // 新内容
      const newText = convert_to_codeblock(text)

      try {
        // 新文件
        let newFile: TFile
        // const newPath = `temp_backup_${file.basename}.md`
        const newPath = `temp_any_block_convert.md`
        // const adapter = plugin.app.vault.adapter
        // const isFileExists = await adapter.exists(newPath)
        // if (isFileExists) {
        //   await adapter.write(newPath, newText)
        // }
        const abstractFile = plugin.app.vault.getAbstractFileByPath(newPath)
        if (abstractFile instanceof TFile) { // 存在则覆盖更新
          newFile = abstractFile
          await plugin.app.vault.modify(abstractFile, newText)
        } else { // 不存在则创建
          newFile = await plugin.app.vault.create(newPath, newText)
        }

        // 旧文件 - 不变
        // editor.setValue(text)

        // 在新标签页中打开该文件
        await plugin.app.workspace.getLeaf('tab').openFile(newFile)
        new Notice(t('any-block-to-codeblock-success') + newPath)
      } catch (error) {
        console.error('转换时文件保存失败:', error)
        new Notice(t('any-block-to-codeblock-fail'))
      }
    }
  })
}

/** obsidian 状态栏管理 (右下角区域) */
export function registerStatus(plugin: Plugin) {
  // 刷新视图
  {
    const statusBtnContainer = plugin.addStatusBarItem();
    statusBtnContainer.addClass('mod-clickable');

    const statusBtn = statusBtnContainer.createEl('div', {
      cls: 'ab-rebuildview-btn'
    })

    setIcon(statusBtn, 'refresh-cw');
    statusBtn.setAttribute('aria-label', t('any-block-rebuild-view-btn'));
    statusBtn.setAttribute('data-tooltip-position', 'top');
    statusBtn.onclick = () => {
      const leaf = plugin.app.workspace.getActiveViewOfType(MarkdownView)?.leaf
      if (!leaf) return
      // @ts-expect-error 类型“WorkspaceLeaf”上不存在属性“rebuildView”
      leaf.rebuildView()
    }
  }
}
