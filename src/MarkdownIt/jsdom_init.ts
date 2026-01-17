/**
 * 初始化JSDOM
 * 
 * JsDom。仅用于提供document对象支持 (如果Ob等客户端渲染环境中则不需要，服务端渲染则需要)
 */

// import jsdom from "jsdom"

let dom: any = null;

export async function jsdom_init(enable: boolean = true) {
  const { default: jsdom } = await import('jsdom') // 废弃，要同步，避免docuemnt初始化不及时
  const { JSDOM } = jsdom
  dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
    url: 'http://localhost/', // @warn 若缺少该行，则在mdit+build环境下，编译报错
  })
  if (enable) jsdom_enable()
}

/// 启用 jsdom 环境
export async function jsdom_enable() {
  global.Storage = dom.window.Storage;
  global.window = dom.window as any
  global.history = dom.window.history // @warn 若缺少该行，则在mdit+build环境下，编译报错：ReferenceError: history is not defined
  global.document = dom.window.document
  global.Node = dom.window.Node
  global.NodeList = dom.window.NodeList
  global.HTMLElement = dom.window.HTMLElement
  global.HTMLDivElement = dom.window.HTMLDivElement
  global.HTMLPreElement = dom.window.HTMLPreElement
  global.HTMLQuoteElement = dom.window.HTMLQuoteElement
  global.HTMLTableElement = dom.window.HTMLTableElement
  global.HTMLUListElement = dom.window.HTMLUListElement
  global.HTMLScriptElement = dom.window.HTMLScriptElement
  dom.window.scrollTo = ()=>{} // @warn 若缺少该行，编译警告：Error: Not implemented: window.scrollTo
  global.MutationObserver = dom.window.MutationObserver
}

/// 禁用 jsdom 环境
export async function jsdom_disable() {
  global.window = undefined
  global.history = undefined
  global.document = undefined
}
