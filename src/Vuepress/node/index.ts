import { getDirname, path } from "@vuepress/utils"

import { ab_mdit, ab_mdit_client, jsdom_init } from "markdown-it-any-block" // npm
const CLIENT_MODE = false
if (!CLIENT_MODE) jsdom_init() // 如果模块根部有直接使用的，可能要改成 await jsdom_init() 同步操作

export default (options, ctx) => {
  return {
    name: 'vuepress-plugin-any-block',
    clientConfigFile: path.resolve(__dirname, '../client/clientConfig.ts'),
    extendsMarkdown: (md: any)=>{
      if (CLIENT_MODE) md.use(ab_mdit_client)
      else md.use(ab_mdit)
    }
  }
}
