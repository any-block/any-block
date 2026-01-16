# AnyBlock Remark Plugin

## remark-any-block 使用

当前使用 Remark 解析/渲染引擎的主流 SSG (静态网站生成器) 有:

- Astro
- Quartz4:  包含 OFM (Obsidian风格Markdown) 相关的插件
- Docusaurus:  包含 MDX 相关插件

> [!WARNING]
> 暂时不属于完全通用的 Remark 插件 (doing, 或者你自己改改), 当前该插件测试于 Quartz V4 版本
> 详见 [any-block/QuartzDemo](https://github.com/any-block/QuartzDemo)
> 
> Quartz V4 在 remark 的基础上又封装了一层

## 使用案例/示例

见 [any-block/QuartzDemo](https://github.com/any-block/QuartzDemo)

## 构建

构建就简单的 `pnpm build`

(仅自用) 构建、上传npm:

```bash
# $ pnpm build # 设置了prepublishOnly，不需要先手动编译。但是你可以手动执行这一步，来检查编译是否正常

$ npm adduser  # 先登录，在vscode里他会让我打开浏览器来登录
Username: ...
Password: ...

$ npm publish  # 上传 (注意不要重名、npm账号可能需要邮箱验证)
               # 如果设置了 package.json::script.prepublishOnly，会先执行 (一般是build)
               # 这一步会将当前文件夹内容都上传到npm中名为 `<package.json 里 name@version>` 的包里
               # 如果没有对应包，会自动创建

# or 或
$ npm publish --tag beta  # 如果使用测试或beta版本 (包含 `-tagname`)，如 `-beta` 
                          # 需要 添加 `--tag <tagname>`，如 `--tag beta`
```

> [!warning]
> 补丁: 2025-12-09 开始不再能使用长期验证方式，得每次都要 `npm login` 一下
> 
> 否则报错: 
> ```bash
> npm error code E403
> npm error 403 403 Forbidden - PUT https://registry.npmjs.org/... - Two-factor authentication or granular access token with bypass 2fa enabled is required to publish packages.
> ```
> 
> 详见: https://github.blog/changelog/2025-12-09-npm-classic-tokens-revoked-session-based-auth-and-cli-token-management-now-available/
