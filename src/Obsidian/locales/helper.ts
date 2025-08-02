// Code from https://github.com/valentine195/obsidian-admonition/blob/master/src/lang/helpers.ts

import { getLanguage } from 'obsidian'; // https://github.com/obsidianmd/obsidian-translations?tab=readme-ov-file#existing-languages
// import { moment } from 'obsidian'; // moment.locale()

import en from './en';
import zhCN from './zh-cn'

const localeMap: { [key: string]: Partial<typeof en> } = {
  en,
  'zh': zhCN,
  'zh-TW': zhCN,
  // 'zh-cn': zhCN, // moment.locale 则是 zh-cn, getLanguage 不是
};

const locale = localeMap[getLanguage()];

export function t(str: keyof typeof en): string {
  // console.log('locale', getLanguage())
  return (locale && locale[str]) || en[str];
}

// 多语言
// import { getLanguage } from 'obsidian';
// import en from './locales/en.ts';
// import zhCN from './locales/zh_CN.ts';
// const localeMap: { [key: string]: Partial<typeof en> } = {
//   en,
//   zh: zhCN
// };
// export function t2(localizationId: keyof typeof en, ...inserts: string[]): string {
//   const lang = getLanguage();
//   const userLocale = localeMap[lang || 'en'];
//   let localeStr = userLocale?.[localizationId] ?? en[localizationId] ?? localizationId;
//   localeStr = localeStr.replaceAll(/%(\d+)/g, (_, indexStr) => {
//     const index = parseInt(indexStr, 10);
//     return inserts[index] ?? '';
//   });

//   return localeStr;
// }
