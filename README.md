# 幻绘 · PHANTOM ARCHIVE

面向中文用户的 AI 生图作品与提示词档案。影院暗色画廊 + 档案纸白详情页，单一荧光柠檬主色，瀑布流首页，图和提示词放在同一张卡上。

本地地址：**http://127.0.0.1:3210**

## 有什么

- **瀑布流首页**：行优先瀑布流，卡片之间 3px 无缝拼接；支持无限加载。
- **筛选与搜索**：模型、角色、标签（多选取交集）、主色调四组筛选；关键词搜索标题、提示词、作者、模型、角色、标签；筛选条件全部写进 URL，可分享。
- **排序**：站长精选（后台精选顺位）、最新、正在流行、最多喜欢、最多浏览、最多收藏、随机漫游、最早发布。
- **作品详情**：大图 / 全屏查看、上一件下一件、完整提示词与负面提示词、采样器 / 步数 / CFG / 种子 / 尺寸、角色与标签索引、主色调色板、下载原图、分享到微博、点赞与浏览量。
- **模型档案**：12 个模型家族（FLUX.1、GPT-Image 2、Krea 2、Illustrious、Pony、SDXL、SD 1.5、Anima、ZImage、MOSS、Qwen-Image、MiniMax），可进入单模型作品页。
- **角色与标签档案**：角色卡、分组标签索引。
- **搜索面板**：`⌘K` / `Ctrl+K` / `/` 打开，跨作品、角色、模型、标签即时搜索。
- **管理员后台**：`/admin` 登录后可见；批量拖入原图，自动读取 A1111 / Forge（PNG tEXt）、ComfyUI（prompt JSON / workflow）、NovelAI（Comment JSON）、JPEG EXIF 中的生成参数；逐张改标题、模型、标签、角色、提示词与采样参数；一次发布。作品可再编辑、切换精选、删除。

## 本地运行

需要 Node.js 22+。

```bash
npm install
cp .env.example .env.local      # 可跳过，使用默认密码
npm run dev                     # http://127.0.0.1:3210
```

生产模式：

```bash
npm run build
npm start                       # 默认 3210 端口
```

## 管理员入口

- 地址：`/admin`（站内导航不会出现入口，登录后才在顶栏显示「控制台 / 入库」）
- 默认密码：`phantom2026`，在 `.env.local` 里用 `ADMIN_PASSWORD` 覆盖
- 会话签名密钥：`ADMIN_SECRET`，生产环境必须替换
- 登录会话 7 天，HttpOnly Cookie

## 数据与图片

```
data/db.json                作品 / 模型 / 角色 / 标签（唯一数据源）
public/media/seed/          示例作品图（1600px WebP + 720px 缩略图）
public/media/uploads/       后台上传的图片（gitignore，运行时通过 /api/uploads/* 提供）
scripts/seed.ts             示例数据构建脚本
scripts/seed-manifest.json  示例作品元数据
```

示例作品来自 Civitai 公开 API（含真实提示词与生成参数）以及站主自己的 GPT-Image 2 图集，仅用于本地演示。**公开或商业上线前请替换为自己拥有授权的作品**；站点页脚已写明作品版权归创作者所有。

重置示例数据：

```bash
npm run seed
```

## 目录

```
app/(site)/                 前台：首页、作品、模型、角色、标签
app/admin/                  管理员登录 + 控制台
app/api/                    作品查询、搜索、点赞、浏览、下载、上传、后台写入
components/                 瀑布流、筛选、详情、搜索面板、后台组件
lib/                        数据层、查询、元数据解析、调色板、鉴权、seed 类型
app/globals.css             设计 token 与全站样式（无 UI 框架）
```

## 实现说明

- Next.js 16 App Router + React 19 + TypeScript；图片处理用 `sharp`，不依赖数据库服务。
- JSON 存储在单进程写入（后台低频写入），部署到多实例前应换成数据库。
- 上传图不放进 `public` 的构建快照，而是由 `/api/uploads/[file]` 运行时读取，避免 `next start` 只服务构建时静态文件的问题。
- 移动端 390px 宽无横向滚动；筛选弹层在窄屏变为底部面板。
- 站点无账户体系、评论与收藏夹：点赞和浏览是匿名计数，符合「先本地运行」的轻量形态。

## 截图

`docs/evidence/` 下有桌面与移动端截图。
