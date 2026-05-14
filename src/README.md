# README

## 目录结构

该文件夹下的文件夹说明：

- ABConverter/  | 共用部分 (核心) (Core)
- Obsidian/     | Obsidian专用部分
- App/          | App 版本专用部分
- MarkdownIt/   | MarkdownIt 专用部分 (主要是vuepress/vitepress用)

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

(1) 同步更新版本号
```bash
pnpm -r exec pnpm version 1.0.1
```
(2) 修改 manifest.json, dist-min/manifest.json, dist-pro/manifest.json 中的 version

## 部署

### Github 类部署

略，详见 .github/workflows/build.yml 文件里的流程

### CF Worker + obsidian-web

obsidian web 地址: https://github.com/MusiCode1/obsidian-web

fork 一下

1. 打开 CF Worker 并使用该 fork 作为仓库源
2. 部署时设置部署命令:

```bash
echo "=== Step01==="
git clone https://github.com/any-block/any-block.git
echo "=== Step02==="
mkdir -p cf/docs
echo "=== Step03==="
mv any-block/docs/* cf/docs

echo "=== Step1==="
node scripts/update-obsidian.js
echo "=== Step2==="
ls -la
echo "=== Step3==="
cd cf
echo "=== Step4==="
npm install
echo "=== Step5==="
npm run deploy
```

> [!warning]
> 
> 注意这里使用的是我魔改过的 obsidian-web 版本。
> 该版本会将 cf/docs 目录下的内容作为替代原有的模板内容。
