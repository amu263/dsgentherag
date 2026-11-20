# 05 · 动效：元素、卷轴与星辉

> 原神的动效不是「弹一下」，而是**元素在空气里扩散**、**纸页被展开**、**星辉从卡面浮起**、**镜头极慢地推移**。
> 四类之外一律不做：弹跳、回弹、无限旋转装饰、闪烁霓虹都不属于提瓦特。

## 1. 四类允许的运动

| 类型 | 语义 | 典型场景 | 时长 |
|---|---|---|---|
| **元素涟漪** | 从触点/徽记扩散，像元素力铺开 | 主题切换、元素切换、页面进入、祈愿揭晓 | 680–900ms |
| **卷轴展开** | 纸页从上/中间展开 | 面板、对话、抽屉、tab 内容 | 420–560ms |
| **星辉浮现** | 卡片从暗到亮、金色扫光 | 图鉴卡、结果卡、角色卡入场 | 480–600ms |
| **镜头推移** | 背景/徽记极慢位移 | 首屏视差、星海、景物层 | 连续（≤0.12 系数） |

时长五档：`160 / 240 / 480 / 720 / 900ms`（token：`--gs-dur-fast/base/slow/hero/rune`）。新加动画先找最近一档，不要发明第六个数字。

缓动：
- `--gs-ease-soft: cubic-bezier(.22,1,.36,1)`：内容落位、涟漪。
- `--gs-ease-silk: cubic-bezier(.4,0,.2,1)`：卷轴/面板。
- `--gs-ease-out: cubic-bezier(.16,1,.3,1)`：星辉/卡片。
- 禁用 bounce / elastic / back。

## 2. 元素涟漪（圆形扩散）——重点

适用：主题切换、元素切换、页面转场、祈愿结果、点击「启程」。

**原则**：
1. 圆心 = 按钮/触点的屏幕坐标（`getBoundingClientRect()` 中心），不是页面中心。
2. 新状态先就位，再用 `clip-path: circle()` 从圆心扩到覆盖视口；不要让用户看到「先变灰再变新」。
3. 两套主题/两个元素共用**同一位置、同一尺寸**的按钮，否则切换瞬间按钮跳动，再好的圆也白费。
4. 动画期间不锁滚动、不阻断路由；切完立即恢复交互。
5. 低端设备/`prefers-reduced-motion` 下退化为 160ms 交叉淡入或瞬时切换，**不要**留一个半灰遮罩。

### 推荐实现：View Transitions（支持时）

```js
function switchWithReveal(el, name, value) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const apply = () => { document.documentElement.dataset[name] = value }
  if (!document.startViewTransition || reduce) { apply(); return }

  const r = el.getBoundingClientRect()
  const x = Math.round(r.left + r.width / 2)
  const y = Math.round(r.top + r.height / 2)
  const t = document.startViewTransition(apply)
  t.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(150vmax at ${x}px ${y}px)`] },
      { duration: 720, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' }
    )
  })
}
```

注意：
- 只对 `::view-transition-new(root)` 做 clip；旧快照保持不动，才像「新世界从触点铺开」。
- `t.ready` 之后再做动画；不要在 `startViewTransition` 回调里做异步请求。
- 圆半径用 `150vmax` 保证任何屏幕都覆盖；用 `calc(100vmax + 主题页高度)` 更稳。
- 如果页面有 sticky 顶栏，顶栏也在 root 快照里；若要顶栏不参与，给它 `view-transition-name` 并单独处理。

### 无 View Transitions 的退化

```js
const apply = () => { html.dataset.theme = next }
if (!document.startViewTransition) { apply(); return }
```
不要用「全屏 div 先盖住再变色」——那会出现用户说的「一闪」和「灰底」。宁可瞬时切换，也不要做半成品遮罩。

### 稳定性检查（必须做）

- 连续来回切换 4 次：每次都从按钮圆心扩散，没有一次缺失。
- 首次进入就切换：主题 CSS 已加载、按钮坐标可测、没有布局移动。
- 从 A→B→A：两个方向的半径、时长、缓动一致。
- 按钮在两套主题下的 `getBoundingClientRect()` 完全一致（位置/尺寸），否则圆会偏。
- 切换后刷新：主题从 localStorage 恢复，圆动画不重播；首屏不闪旧主题。

## 3. 卷轴展开

```css
.scroll-panel { animation: unfurl 520ms var(--gs-ease-silk) both; transform-origin: top center; }
@keyframes unfurl {
  from { clip-path: inset(0 0 100% 0 round var(--gs-radius-lg)); opacity: .6; }
  to   { clip-path: inset(0 0 0 0 round var(--gs-radius-lg)); opacity: 1; }
}
```

- 用 `clip-path: inset()`，不要用 `height: 0 → auto`（会引发布局抖动）。
- 面板内容延迟 60ms、120ms 错峰淡入；最多 4 个。
- 卷轴从顶部展开（像展开信纸）；抽屉从侧边用 `translateX`。

## 4. 星辉浮现

```css
.card-reveal { animation: starlight 560ms var(--gs-ease-out) both; animation-delay: calc(var(--i, 0) * 70ms); }
@keyframes starlight {
  from { opacity: 0; transform: translateY(14px) scale(.98); filter: brightness(.7); }
  to   { opacity: 1; transform: none; filter: brightness(1); }
}
```

- 金色扫光用伪元素 `linear-gradient(105deg, transparent, gold, transparent)` + `translateX(-120% → 120%)`，只播一次。
- 品质越高，光晕越明显；3 星不要发光。
- 不要用 `filter: blur()` 做淡入（移动端掉帧）。

## 5. 镜头推移（视差）

- 首屏星海/元素徽记：`translate3d(0, scrollY * 0.06, 0)`，最多 0.12。
- 只给 1–2 层；不要文字层视差（会晕）。
- `requestAnimationFrame` 节流；`prefers-reduced-motion` 下关闭。
- 不要做滚动劫持；用户滚轮/键盘必须正常工作。

## 6. Hover / 焦点（微交互）

- 卡片：`translateY(-3px)` + 阴影加深，240ms；不要超过 4px。
- 按钮：上浮 1px + 金色内发光；160ms。
- 元素徽记：内圈辉光增强；不旋转。
- 链接：金色下划线/菱形出现；160ms。
- 所有 hover 必须同时有 `:focus-visible` 等价样式。

## 7. 主题/元素切换的「无缝」清单

1. **按钮位置/尺寸一致**：两套主题共用同一个 HUD 组件与同一个按钮，`position: fixed` 或同一 grid 槽位；不要在两套主题里分别布局。
2. **主题 CSS 先加载**：切换只改 `data-gs-mode` / `data-gs-element`，不加载新样式表；颜色/字体均已就位。
3. **图标/字标同步**：favicon、`theme-color`、标题图标、按钮图标在 `apply()` 内同步更新；不要在动画结束后才换。
4. **路由不变**：主题切换不导航；所有按钮、搜索、滚动位置、表单状态保持。
5. **localStorage 预设**：在 `<head>` 内联脚本先读主题，避免首屏闪旧主题；切换时写入。
6. **滚动位置**：切换前后 `scrollY` 不变；不要把页面拉回顶部。
7. **滚动条宽度**：两套主题统一 `scrollbar-gutter: stable` 或统一 8px 滚动条，避免切换时页面横向跳动。
8. **首帧**：新主题的字体/背景在第一帧可用；不要等网络字体加载完才切换（会看到字体闪）。

## 8. 性能底线

- 只动 `transform` / `opacity` / `clip-path`；不要动 `top/left/width/height`。
- 动画元素 ≤ 6 个同时动；超过就拆两段。
- 星海/纸纤维用 CSS 渐变 + 小 SVG，不要视频/大图。
- 一次切换新增网络请求 = 0；图标用内联 SVG 或 data URI。
- 低端机测试：390px、4× CPU 降速，切换 ≥ 30fps；否则退化。
- `prefers-reduced-motion: reduce`：涟漪瞬时、视差关闭、旋转停止、卡片直接显示；功能不受影响。

## 9. 反例

- 圆扩散用灰色遮罩先盖住再淡出 → 用户看到「闪一下」。
- 切换主题时整页刷新/路由跳转 → 圆扩散失去意义，网络占用高。
- 两个主题的按钮位置/尺寸不同 → 圆心漂移，动画像从别处扩散。
- 首次切换没动画（CSS 未加载/坐标未测） → 必须在首次点击前预热。
- 无限旋转的装饰环（非加载/祈愿主徽记） → 抢注意力。
- 弹跳/回弹/超过 1s 的渐入 → 不像提瓦特。

## 10. 五条自检

1. 关掉所有动画，信息还成立吗？
2. 每个 `transition` 都写了具体属性吗？（`all` 不合格）
3. 圆扩散的圆心是否等于按钮中心？来回 4 次都稳定吗？
4. `prefers-reduced-motion` 下还有元素在位移/旋转吗？
5. 切换主题/元素时，路由、滚动、按钮、favicon 是否同步且无刷新？

---

# 第二部分 · 游戏内的动效原型

> 上半部分是网页与主题切换的工程规范；这一部分蒸馏的是**原神界面本身的动效语法**。
> 来源：公开实机视频与官方公开演示的逐段观察（不是帧级拆包），时长按网页转译校准；游戏内过场常为 2–4s，网页不要照搬。

## 11. 九类动效原型（先选类型，再写代码）

| # | 原型 | 触发 | 观感 | 网页时长 |
|---|---|---|---|---|
| 1 | **菜单展开** | Esc / 打开背包角色 | 世界降饱和压暗，内容从右侧或下方错峰浮入，派蒙飞入 | 360–480ms |
| 2 | **场景切换** | 进入角色/祈愿/地图 | 元素色从中心或点击处扩散，星海淡入，旧页不闪白 | 420–560ms |
| 3 | **祈愿开箱** | 祈愿一次/十连 | 星轨蓄力 → 光爆 → 卡面升起；五星才配全屏金闪 | 1.6–2.6s |
| 4 | **星级揭晓** | 结果卡出现 | 星星逐颗弹出，轻微放大回正；五星多一圈金环 | 60–80ms/颗 |
| 5 | **物品获得** | 拾取/领取 | 左下角卡片滑入，稀有度光晕，停留后淡出 | 320ms 入 |
| 6 | **对话推进** | 剧情对话 | 上下黑边收拢，名字先出，正文逐字；选项菱形淡入 | 260ms + 打字机 |
| 7 | **升级/突破** | 角色升级、突破 | 数字滚动，金粒上升，圆环脉冲一次 | 600–900ms |
| 8 | **元素反应** | 战斗命中 | 极短的元素色屏幕边缘闪光 + 粒子；不晃屏 | 120–200ms |
| 9 | **加载/传送** | 进副本、传送 | 元素徽记缓慢旋转，提示语交叉淡入，金色进度线 | 8–12s/圈 |

环境层另有：星点/羽毛/余烬漂移（12–20s，8–16 个，opacity .2–.6），只为「空气在动」，不为抢戏。

### 反面：这些不是原神

- 卡片 3D 翻转、弹跳回弹、弹簧物理。
- 按钮 100ms 闪切、RGB 霓虹呼吸灯。
- 全屏彩带礼花、抖动屏幕、radial 彩虹。
- 任何需要「盯着看才看得懂」的装饰动画。

---

## 12. 菜单展开：错峰，而不是整块飞入

**分镜**：
1. 0ms：背景世界加 `saturate(.8) brightness(.72)` 与暗罩，遮罩 240ms 淡入。
2. 60ms：面板从 `translateY(14px)` / `translateX(24px)` 到 0，360ms `--gs-ease-silk`。
3. 120ms 起：内容项每项延迟 40–60ms，`opacity 0→1` + `translateY(8px)→0`，最多 8 项。
4. 侧边图标从右缘错峰 30ms 进入；不要逐个弹跳。

```css
.menu-scrim { animation: scrim-in 240ms var(--gs-ease-silk) both; }
@keyframes scrim-in { from { opacity: 0 } to { opacity: 1 } }

.menu-panel { animation: panel-in 360ms var(--gs-ease-silk) both; }
@keyframes panel-in {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: none; }
}

.menu-item {
  animation: item-in 320ms var(--gs-ease-soft) both;
  animation-delay: calc(90ms + var(--i, 0) * 50ms);
}
@keyframes item-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
}
```

**禁止**：整块面板 `scale(.9)` 弹入；列表 `filter: blur()` 淡入；每一项都带不同方向。

---

## 13. 祈愿开箱：三幕时间轴（最有仪式感的一段）

祈愿不是「抽卡结果弹窗」，而是**一颗星从天上落到你手里**。分三幕，允许跳过（点击/空格直接到第三幕）。

### 第一幕 · 蓄力（0–800ms）

- 背景压暗到 70%，星点向中心缓慢聚拢。
- 元素徽记/星轨从 0.92 放大到 1，透明度上升；中心出现收缩的金色圆环。
- 粒子从四周向圆心运动（`translate` + `opacity`），数量 12–20，越靠近越慢。
- 声音：低频持续音（若有音频）；网页无音频时用视觉节奏替代。

### 第二幕 · 爆发（800–1200ms）

- 120ms 的元素色/金色全屏闪光（`opacity .55 → 0`），不要纯白闪。
- 金色射线从中心展开（`scale(.2) → 1.4`，`opacity 1 → 0`），只播一次。
- 四星用紫色 `--gs-electro-soft` 系，五星用金色 `--gs-gold-300`。
- 屏幕轻微亮度提升后回落，不要晃屏。

### 第三幕 · 揭晓（1200–2600ms）

- 结果卡从 `translateY(28px) scale(.96)` 升到 0/1，520ms `--gs-ease-cinema`。
- 星星逐颗出现（70ms/颗）；五星额外一圈金环从卡面向外扩散一次。
- 角色/物品剪影先暗后亮，最后 200ms 稳定；名字与稀有度同时可读。
- 五星总时长约 2.6s，四星约 1.8s；十连只完整播第一张最高稀有度，其余卡片快速列出。

```css
.pull { --phase-dur: 800ms; }
.pull__flash {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(circle, var(--gs-gold-100), var(--gs-gold-300) 38%, transparent 70%);
  opacity: 0;
}
.pull.is-burst .pull__flash { animation: burst-flash 420ms var(--gs-ease-out) both; }
@keyframes burst-flash {
  0% { opacity: 0; transform: scale(.2); }
  22% { opacity: .55; }
  100% { opacity: 0; transform: scale(1.4); }
}

.pull__card { opacity: 0; transform: translateY(28px) scale(.96); }
.pull.is-revealed .pull__card {
  animation: card-rise 520ms var(--gs-ease-cinema) both;
}
@keyframes card-rise {
  to { opacity: 1; transform: none; }
}
```

**可用性**：任何时刻点击/回车/空格跳到揭晓；`prefers-reduced-motion` 下直接显示结果卡（保留稀有度颜色），不要保留黑屏蓄力。

---

## 14. 星级、拾取、对话、升级

### 星级逐颗弹出

```css
.star { opacity: 0; transform: scale(.6); }
.is-revealed .star {
  animation: star-pop 260ms var(--gs-ease-out) both;
  animation-delay: calc(var(--i) * 70ms);
}
@keyframes star-pop {
  60% { opacity: 1; transform: scale(1.12); }
  100% { opacity: 1; transform: scale(1); }
}
```

三星不加光晕，四星加一层淡紫内光，五星加金色外发光 + 一次环扩散。**稀有度先于文字可读**。

### 物品获得卡

- 从左下角 `translateX(-16px)` 滑入，320ms；卡片带稀有度底光。
- 图标进入时有一条 400ms 的金色拖尾（伪元素，只播一次）。
- 停留 2.2–2.6s，再 400ms 淡出；连续拾取时后一张替换前一张，不堆叠超过 3 张。
- 不遮挡底部技能栏与对话按钮。

### 对话

- 黑边从上下收拢 260ms；名字牌先淡入 180ms，正文再开始。
- 打字机 28–35 字/秒；标点处停 80–120ms；点击一次显示整段，再点推进。
- 选项从右侧 `translateX(10px)` 淡入，错峰 60ms；用菱形前缀。
- `prefers-reduced-motion`：直接整段显示，不做逐字。

### 升级 / 突破

- 数字用 `tabular-nums` 滚动 600–900ms，缓出收尾；不要无限循环。
- 金粒从数字底部上升 8–12 颗，600ms 内消失。
- 圆形进度环脉冲一次（`scale 1→1.03→1`），不要持续呼吸。

---

## 15. 加载、HUD 与环境

- **加载**：元素徽记 8–12s/圈线性旋转；提示语每 4s 交叉淡入；底部 1px 金色进度线。不要用浏览器默认 spinner，不要无限发光。
- **技能就绪**：圆环从 0 填满到 100%（220ms），随后一次 300ms 外光晕；不要常驻闪烁。
- **地图**：滚轮缩放以鼠标为原点 320ms；图钉 hover `scale(1.15)` 160ms；地区名淡入 240ms。
- **环境粒子**：8–16 个，12–20s 漂移，透明度 .2–.6；减少动效时全部隐藏（信息不依赖粒子）。
- **HUD 进入**：从边缘 `translateY(8px)` 淡入 300ms，错峰 40ms；不要从屏幕外飞入。

---

## 16. 动效分层与预算

| 层 | 时长 | 例子 |
|---|---|---|
| 反馈（按下/悬停） | 120–180ms | 按钮、tab、图钉 |
| 内容（卡片/列表） | 240–360ms | 物品卡、列表项、tooltip |
| 面板（菜单/抽屉） | 360–480ms | 背包、角色面板、对话黑边 |
| 场景（切页/切主题） | 420–560ms | 元素涟漪、星海淡入 |
| 仪式（祈愿/升级） | 900–2600ms | 开箱三幕、五星揭晓 |

规则：
- 同一时刻只允许一个「仪式级」动画；其余层降到 ≤360ms。
- 一屏同时运动的元素 ≤ 6 个；超过就拆成两段。
- 只动 `transform / opacity / clip-path`；不要动 `filter: blur()` 做逐帧。
- 所有循环动画必须有 `prefers-reduced-motion` 关闭分支，且不能承载唯一信息。

---

## 17. 动效验收清单

- [ ] 关掉动画后，稀有度、选中态、结果仍然可读
- [ ] 祈愿/开箱可跳过，跳过不丢结果
- [ ] 五星与四星有明确差异（金/紫、时长、光晕），但不靠文字说明
- [ ] 菜单展开是错峰，不是整块弹入
- [ ] 按钮反馈 ≤180ms，面板 ≤480ms，仪式 ≤2.6s
- [ ] 没有弹跳、回弹、无限呼吸、彩带礼花
- [ ] `prefers-reduced-motion` 下无位移/旋转循环，打字机退化为整段
- [ ] 连续触发 4 次，动画不叠加、不卡死、不遮挡交互

