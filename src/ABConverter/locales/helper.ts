// Code from https://github.com/valentine195/obsidian-admonition/blob/master/src/lang/helpers.ts

import { ABCSetting } from '../ABSetting';
import en from './en';
import zhCN from './zh-cn'

const localeMap: { [key: string]: Partial<typeof en> } = {
  en,
  'zh': zhCN,
  'zh-TW': zhCN,
  // 'zh-cn': zhCN, // moment.locale 则是 zh-cn, getLanguage 不是
};

let locale: Partial<typeof en> | undefined

export function t(str: keyof typeof en): string {
  if (locale == undefined) {
    // 别名
    if (ABCSetting.state.language == 'English') ABCSetting.state.language = 'en'
    else if (ABCSetting.state.language == '中文') ABCSetting.state.language = 'zh'

    locale = localeMap[ABCSetting.state.language]
  }

  // console.log('locale', ABCSetting.state.language)
  return (locale && locale[str]) || en[str];
}
