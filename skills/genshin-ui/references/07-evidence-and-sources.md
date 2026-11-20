# 07 · 来源、取证与边界

> 本 skill 蒸馏的是《原神》**界面设计语言**，不是游戏素材包。
> 取证过程不下载游戏客户端、不抓取游戏资源；只使用官网与公开截图做**规律观察与取色**，不把任何官方图片、立绘、图标、Logo、字体文件放进 skill。
> 所有纹样、徽记、角饰、网页配色映射均由本 skill 自绘或按观察重制。

## 1. 公开来源

| 来源 | 用途 | 链接 |
|---|---|---|
| 原神中文官网 | 版本页版式、金色/羊皮纸的整体印象、地区主色 | <https://ys.mihoyo.com/> |
| 原神国际服官网 | 英文版式、活动页与 KV 的字体分工 | <https://genshin.hoyoverse.com/en/> |
| Fandom Typeface 条目 | 主字体为米哈游改制的 HYWenHei-85W（汉仪文黑 85W）；拉丁/西里尔另有专有字形 | <https://genshin-impact.fandom.com/wiki/Typeface> |
| Fandom 公开界面截图（见 §2） | 背包、祈愿、登录、角色升级的布局与取色 | <https://genshin-impact.fandom.com/wiki/File:Inventory_Artifact_Set_Filter_4.3.png> |
| App Store 官方截图 | HUD（小地图/队伍/技能）与实机画面比例 | <https://apps.apple.com/app/id1517783697> |
| 萌娘百科 GenshinColor 模板 | 七元素在社区资料中的常用色值（作色相参照） | <https://zh.moegirl.org.cn/Template:Genshincolor> |
| Design by Curio 的 miHoYo UI 分析 | 仅作二手设计评论参考；其“衬线展示字 + 几何正文”不等于游戏内 UI 事实，已在本 skill 中校正 | <https://designbycurio.com/zh/learn/mihoyo-genshin-ui-2024> |
| MDN / W3C | `clip-path`、`color-mix()`、View Transitions、`prefers-reduced-motion` | <https://developer.mozilla.org/> |

## 2. 实测取色（公开截图，sRGB）

方法：下载公开截图（WebP/PNG）→ 用 `sharp` 转 sRGB → 在指定界面位置取点或小区域主色。截图经过压缩与色调映射，单通道误差约 ±2；下表是**观察值**，不是官方色板。

| 界面位置 | 实测值 | 对应 token / 用法 |
|---|---|---|
| 背包物品详情卡纸面 | `#ECE5D8` | `--gs-ivory-1` / `--gs-paper` 一族；纸面基准 |
| 列表中选中的金边 | `#D1BC93` | `--gs-gold-300/400`；选中态描边 |
| 列表行底色（叠在场景上） | `#2F3845` | `--gs-night-800/850`；深色行 |
| 五星圣遗物详情卡头 | `#B76732` | 五星品质暖铜；品质渐变的深端 |
| 星级/强调黄 | `#F8C753` | 五星星色、最高强调 |
| 祈愿详情纸面 | `#F7F1E8` | `--gs-ivory-0/1`；弹窗纸面 |
| 四星概率条 | `#AFA2C6` | `--gs-electro-soft` 一族；四星紫 |
| 祈愿关闭缎带 | `#B48344` | `--gs-gold-600/700`；金色缎带 |
| 角色/升级星海 | `#441D65 → #8648AF` | 星海紫；按角色元素染色 |
| 登录界面天空 | `#32557E → #94A8BC` | 夜幕/远景蓝 |
| 登录晨光 | `#FDEECE` | 暖光高光，只做光晕 |

**与 token 的差异**：`genshin-tokens.css` 为了网页可读性把纸面调暖、金调亮（例如 `--gs-paper #ECE1CA`、`--gs-gold-400 #D3B878`），与实测相差约 4–8/通道。这是有意的：网页没有游戏的光照与色调映射，直接照搬会发灰。若要更“冷纸”的版本，把 `--gs-ivory-1 / --gs-paper` 调到 `#ECE5D8` 附近即可。

### 截图清单

- 背包圣遗物筛选（2560×1440）：<https://genshin-impact.fandom.com/wiki/File:Inventory_Artifact_Set_Filter_4.3.png>
- 祈愿详情（2560×1440）：<https://genshin-impact.fandom.com/wiki/File:Wish_Details_1.png>
- 登录界面（4096×2304）：<https://genshin-impact.fandom.com/wiki/File:Login_Menu_Dawn.png>
- 角色升级（2560×1440）：<https://genshin-impact.fandom.com/wiki/File:Character_Level_Up_After_4.3.png>

## 3. 哪些是实测，哪些是归纳

| 内容 | 性质 |
|---|---|
| HYWenHei-85W 为主字体 | 公开资料明确；游戏内 UI/标题均为黑体，衬线只用于 Logo/KV/活动主视觉 |
| 七元素色相与名称 | 游戏公开设定；token 色值为网页近似 |
| 金边 + 内层淡金线 + 四角角饰 | 公开截图观察 + 归纳 |
| 羊皮纸/星海双材质 | 公开截图观察 + 归纳 |
| 3/4/5 星品质色 | 公开截图观察；色值为近似 |
| 纸/金/行底/星色 | 公开截图取色（§2），受压缩影响 |
| 祈愿开箱、菜单展开、拾取、对话等动效 | 公开实机视频逐段观察；时长是网页转译校准，非帧级实测 |
| 字体/间距/圆角 token | 本 skill 为网页转译制定的规范，不等于游戏内像素 |
| 文案例句、starter 布局、SVG 纹样 | 本 skill 原创 |

动效部分尤其要说明：游戏内祈愿过场约 2–4s，且包含音频、镜头与骨骼动画；网页只保留「蓄力 → 爆发 → 揭晓」的节奏与视觉因果，不追求逐帧复刻。所有数字都是**网页可用时长**，不是解包数据。

## 4. 复现方法（不下载游戏）

1. 打开官方公开页面，或公开的界面截图/实机视频（不下载客户端、不抓资源包）。
2. 只记录：布局顺序、金线粗细关系、圆角/拱形比例、元素强调位置、字体分工、留白、动效节奏。
3. 需要色值时，对公开截图取点或小区域主色；记录来源与区域，别把压缩噪声当官方值。
4. 用 `assets/genshin-tokens.css` 做映射；不要把官方图片当页面背景。
5. 自绘角饰/徽记/星轨（`assets/textures/*.svg` 可直接改），或换成用户自有素材。
6. 跑 `node scripts/audit.mjs <页面>`，确认没有外链图片、官方素材域名、裸色值。

## 5. 法律与伦理边界

- **不**内嵌、分发 HYWenHei / 汉仪文黑或其他商业字体；只写 `font-family` 回退。
- **不**使用官方立绘、角色图标、元素图标、Logo、KV、UI 截图作为页面素材。
- **不**复制游戏内文本、台词、任务描述、官方文案。
- 允许：学习设计语言、使用公开世界观词汇（提瓦特、蒙德、璃月、命之座、祈愿等）做原创页面；注明「非官方」。
- 若用户提供自有角色图/素材，按用户授权使用；本 skill 的默认模板不含任何角色图。

## 6. 本 skill 的自检

```bash
node scripts/audit.mjs assets/genshin-starter.html
node scripts/audit.mjs assets/genshin-landing.html
node scripts/audit.mjs --skill
```

audit 会检查：外链图片/字体/官方素材域名；`--gs-*` token 使用、元素/模式键合法；金线/角饰/徽记/纸面或星海纹理；Display + UI 字体分工；图片 alt、viewport、lang、title；裸色值（tokens 文件除外）；动效与 reduced-motion 降级。

## 7. 版本

- v1.0 · 2026-11-21 · 初版：七元素、双模式、七原型、四类网页动效、两套 starter、audit。
- v1.1 · 2026-11-21 · 补：公开截图实测色表；校正“衬线是游戏原样”的说法；`05-motion.md` 增加九类游戏动效原型（祈愿三幕/菜单/拾取/对话/升级/元素反应/加载/粒子）与时间轴。
- 维护原则：只加「可验证的设计规律」，不堆形容词；新增组件必须能被 token 驱动。
