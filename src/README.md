# README

## 目录结构

该文件夹下的文件夹说明：

- ABConverter/  | 共用部分 (核心) (Core)
- Obsidian/     | Obsidian专用部分
- App/          | App 版本专用部分
- MarkdownIt/   | MarkdownIt 专用部分 (主要是vuepress/vitepress用)
- Script/       | 一些辅助工具/脚本

具体查看各个文件夹下的 README 文件

## 编译

可以参考github工作流文件: `/.github/workflows/nodejs-build.yml`

单独编译某一版本：

核心模块

```bash
pnpm install      # monorepo，会自动 install 子包的依赖

pnpm ob:build     # 编译ob版本，或 pnpm run ob:build
pnpm ob:build-min # v3.2.1 新增min版本的工作流

pnpm app:dev      # app版本的开发调试，也可以 cd src/App 后运行 pnpm run dev
pnpm app:build    # app版本的构建，也可以 cd src/App 后运行 pnpm run build

pnpm mdit:build   # markdown-it版本的构建 (已上传npm)
```

### For Developer

常用命令

```bash
pnpm -r exec pnpm version 1.0.1 # 同步相同版本号

pnpm -r publish --access public
# -r：递归执行命令（所有子项目）
# --access public：确保公共包可被访问（私有包可不添加）
#  --tag beta: 若为beta版本
# 如没登录需要先 npm adduser

pnpm up -i --latest # 强制列出最新版的包并可选自动升级
```

然后再去更新三个 manifest.json 内的 version (obsidian 用)

以及两个分发 obsidian 仓库中的 manifest.json

## 更新/发布时需做

### 发布到 Obsidian

(1) 同步更新版本号
```bash
pnpm -r exec pnpm version 1.0.1
```
(2) 修改 manifest.json, dist-min/manifest.json, dist-pro/manifest.json 中的 version

---

后来我封装了一下，现在使用 `pnpm run bump 1.0.1` 这个命令即可 (目标版本号自行修改)

---

由于还有使用 npm 版本 core 模块的情况，更新版本时 core 可能也得 publish 一下

### 发布到 npm

主要是 MarkdownIt, Remark, ABConverter 三个需要。

前两者分别作为插件

最后一个仅用于将 Core 模块作为包，忽略 Obsidian 的严格的风格类审查。甚至不需要编译再上传

```bash
# $ pnpm build # 设置了prepublishOnly，不需要先手动编译。但是你可以手动执行这一步，来检查编译是否正常

$ npm adduser  # 先登录，在vscode里他会让我打开浏览器来登录 # 不行用 `npm login` 代替
Username: ...
Password: ...

$ npm publish  # 上传 (注意不要重名、npm账号可能需要邮箱验证)
               # 如果设置了 package.json::script.prepublishOnly，会先执行 (一般是build)
               # 这一步会将当前文件夹内容都上传到npm中名为 `<package.json 里 name@version>` 的包里
               # 如果没有对应包，会自动创建
               # 首次提交可以手动声明为公开包 `npm publish --access public`，否则默认私有，要付费

# or 或
$ npm publish --tag beta  # 如果使用测试或beta版本 (包含 `-tagname`)，如 `-beta` 
                          # 需要 添加 `--tag <tagname>`，如 `--tag beta`
```

## 部署

### Github 类部署

略，详见 .github/workflows/build.yml 文件里的流程

### CF Worker + obsidian-web

> [!WARNING]
> 
> 注意，免费的 CF Worker 打包后 脚本大小不能超过了 Cloudflare 免费计划 3 MiB 的限制

obsidian web 地址: https://github.com/MusiCode1/obsidian-web

fork 一下

1. 打开 CF Worker 并使用该 fork 作为仓库源
2. 部署时设置部署命令:

(有可能说太长了，可以删除注释和打印 + 分一部分给构建命令?)

```bash
# 准备插件
mkdir -p cf/plugins/any-block/
echo "Step1.1"
curl -sSfL https://github.com/any-block/any-block/releases/latest/download/main.js -o cf/plugins/any-block/main.js
echo "Step1.2"
curl -sSfL https://github.com/any-block/any-block/releases/latest/download/manifest.json -o cf/plugins/any-block/manifest.json
echo "Step1.3"
curl -sSfL https://github.com/any-block/any-block/releases/latest/download/styles.css -o cf/plugins/any-block/styles.css

# 准备文档库内容
echo "Step2.1"
git clone https://github.com/any-block/any-block.git
echo "Step2.2"
mkdir -p cf/docs
echo "Step2.3"
mv any-block/docs/* cf/docs

# 运行部署脚本
echo "Step3.1"
node scripts/update-obsidian.js
echo "Step3.2"
ls -la
echo "Step3.3"
cd cf
echo "Step3.4"
npm install
echo "Step3.5"
npm run deploy
```

> [!warning]
> 
> 注意这里使用的是我魔改过的 obsidian-web 版本。
> 该版本会将 cf/docs 目录下的内容作为替代原有的模板内容。
