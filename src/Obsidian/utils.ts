/**
 * obsidian 相关工具
 * 
 * 增强复用
 */

import {
  type Plugin,
  MarkdownView,
  setIcon,
} from 'obsidian'

/** obsidian 命令管理 */
export function registerCommands(plugin: Plugin) {
  // 刷新视图
  plugin.addCommand({
    id: 'any-block-rebuild-view',
    name: 'Refresh/rebuild current view',
    // callback: () => {},
    editorCallback: async (_editor, view) => {
      if (!(view instanceof MarkdownView)) return
      const leaf = view.leaf
      if (!leaf) return
      // @ts-expect-error 类型“WorkspaceLeaf”上不存在属性“rebuildView”
      leaf.rebuildView()
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
    statusBtn.setAttribute('aria-label', 'Rebuild View');
    statusBtn.setAttribute('data-tooltip-position', 'top');
    statusBtn.onclick = () => {
      const leaf = plugin.app.workspace.getActiveViewOfType(MarkdownView)?.leaf
      if (!leaf) return
      // @ts-expect-error 类型“WorkspaceLeaf”上不存在属性“rebuildView”
      leaf.rebuildView()
    }
  }
}
