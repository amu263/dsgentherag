# 04 · 组件配方

> 所有 CSS 只写 `var(--gs-*)`。角饰与徽记来自 `assets/textures/`，可替换为用户自有 SVG。
> 组件不依赖框架；Vue / React 只负责结构，样式照抄。

## 1. 金边纸面板（最核心的组件）

```html
<section class="gs-panel">
  <span class="corner corner--tl"></span><span class="corner corner--tr"></span>
  <span class="corner corner--br"></span><span class="corner corner--bl"></span>
  <h2>风与星海</h2>
</section>
```

```css
.gs-panel {
  position: relative;
  padding: 24px;
  border-radius: var(--gs-radius-lg);
  border: 1px solid var(--gs-gold);
  background: var(--gs-paper-grad);
  box-shadow: var(--gs-shadow-panel);
}
.gs-panel::before {
  content: "";
  position: absolute;
  inset: 4px;
  border: 1px solid var(--gs-line-soft);
  border-radius: calc(var(--gs-radius-lg) - 4px);
  pointer-events: none;
}
[data-gs-mode="night"] .gs-panel { background: var(--gs-night-panel); }
.corner {
  position: absolute; width: 24px; height: 24px;
  background: url("textures/gold-corner.svg") center / contain no-repeat;
  opacity: .9;
}
.corner--tl { top: 5px; left: 5px; }
.corner--tr { top: 5px; right: 5px; transform: rotate(90deg); }
.corner--br { right: 5px; bottom: 5px; transform: rotate(180deg); }
.corner--bl { left: 5px; bottom: 5px; transform: rotate(270deg); }
```

易错：
- 只写外层金边、不写内层淡金线 → 像普通卡片。
- 角饰尺寸超过 30px → 压住内容；小于 18px → 看不见。
- 面板内边距 < 18px → 金边和内层线挤在一起。

## 2. 元素徽记

```html
<span class="gs-element" data-gs-element="anemo" aria-label="风元素">风</span>
```

```css
.gs-element {
  display: grid; place-items: center;
  width: 48px; height: 48px;
  border-radius: 50%;
  border: 1px solid var(--gs-gold);
  background:
    radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--gs-accent) 28%, transparent), transparent 62%),
    var(--gs-surface);
  color: var(--gs-accent-text);
  font-family: var(--gs-font-serif-cn);
  font-size: 18px;
  box-shadow: var(--gs-shadow-gold);
}
```

- 元素色只进内圈辉光/边框/文字；外圈金边。
- 徽记尺寸 32/40/48/64，别出现 36 这种中间档。
- 用汉字/自绘 sigil，不要贴游戏元素图标。

## 3. 品质卡（图鉴/物品/角色）

```html
<article class="gs-card" data-gs-rarity="5">
  <div class="gs-card__art"></div>
  <p class="gs-card__name">苍风之翼</p>
  <p class="gs-card__meta">WEAPON / BOW <span>★★★★★</span></p>
</article>
```

```css
.gs-card {
  border: 1px solid color-mix(in srgb, var(--gs-rarity, var(--gs-gold)) 55%, transparent);
  border-radius: var(--gs-radius-md);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--gs-rarity, var(--gs-gold)) 12%, transparent), transparent 48%),
    var(--gs-paper-grad);
  box-shadow: var(--gs-shadow-card);
  padding: 10px;
  transition: transform var(--gs-dur-base) var(--gs-ease-soft), box-shadow var(--gs-dur-base);
}
.gs-card:hover { transform: translateY(-3px); box-shadow: var(--gs-shadow-float); }
.gs-card__art { aspect-ratio: 1; border: 1px solid var(--gs-line-soft); border-radius: var(--gs-radius-sm); }
.gs-card__stars { color: var(--gs-rarity, var(--gs-gold)); }
```

品质由 `data-gs-rarity` 设 `--gs-rarity`（3 蓝 / 4 紫 / 5 金）；不要用彩虹光。

## 4. 主按钮 / 次按钮

```css
.gs-btn {
  display: inline-flex; align-items: center; gap: 10px;
  min-height: 44px; padding: 0 22px;
  border-radius: var(--gs-radius-pill);
  border: 1px solid var(--gs-gold);
  background: linear-gradient(180deg, var(--gs-ink-800), var(--gs-ink-900));
  color: var(--gs-gold-100);
  font-size: 13px; font-weight: 800; letter-spacing: .08em;
  box-shadow: var(--gs-shadow-btn), 0 0 0 3px color-mix(in srgb, var(--gs-gold) 10%, transparent) inset;
  transition: transform var(--gs-dur-base), box-shadow var(--gs-dur-base);
}
.gs-btn::before { content: ""; width: 7px; height: 7px; background: var(--gs-gold-grad); transform: rotate(45deg); }
.gs-btn:hover { transform: translateY(-1px); box-shadow: var(--gs-shadow-btn-hover), 0 0 0 3px color-mix(in srgb, var(--gs-gold) 22%, transparent) inset; }
.gs-btn--ghost { background: transparent; color: var(--gs-fg-soft); box-shadow: none; }
```

- 主按钮是深墨底 + 金边，不是金色底 + 黑字（那是「土豪金」）。
- 菱形前缀是 7px，不是图标。
- 一个区块最多 2 个按钮；主/次分明。

## 5. 胶囊 tab + 菱形标记

```css
.gs-tabs { display: flex; gap: 4px; }
.gs-tab {
  position: relative; padding: 7px 14px; border: 0; border-radius: 999px;
  background: transparent; color: var(--gs-fg-muted); font-size: 12px; font-weight: 700;
}
.gs-tab.is-active { color: var(--gs-accent-text); background: color-mix(in srgb, var(--gs-accent) 12%, transparent); }
.gs-tab.is-active::after {
  content: ""; position: absolute; left: 50%; bottom: 1px;
  width: 5px; height: 5px; background: var(--gs-gold);
  transform: translateX(-50%) rotate(45deg);
}
```

Tab 数量 3–5；超过 5 个用左侧分类栏。

## 6. HUD 顶栏

```css
.gs-hud {
  position: sticky; top: 0; z-index: 40;
  display: flex; align-items: center; gap: 18px;
  height: 68px; padding: 0 var(--gs-gutter);
  background: color-mix(in srgb, var(--gs-surface) 86%, transparent);
  border-bottom: 1px solid var(--gs-line);
  backdrop-filter: blur(14px) saturate(120%);
}
.gs-hud a { color: var(--gs-fg-muted); text-decoration: none; font-size: 12px; font-weight: 700; }
.gs-hud a.is-active { color: var(--gs-accent-text); }
```

- 品牌区：sigil + 中文名 + 英文小标；不要放巨大 logo。
- 导航胶囊；激活项加菱形，不用下划线。
- 右侧队伍头像 30px 圆 + 金边；最多 4 个。
- 磨砂只用于 HUD，不要给内容面板加玻璃拟态。

## 7. 小地图圆环

```css
.gs-minimap {
  width: 104px; aspect-ratio: 1; border-radius: 50%;
  border: 1px solid var(--gs-gold);
  background:
    radial-gradient(circle at 50% 50%, transparent 54%, color-mix(in srgb, var(--gs-accent) 12%, transparent) 55%, transparent 72%),
    conic-gradient(from 0deg, color-mix(in srgb, var(--gs-gold) 22%, transparent), transparent 20%, color-mix(in srgb, var(--gs-gold) 18%, transparent) 42%, transparent 60%, color-mix(in srgb, var(--gs-gold) 22%, transparent) 82%, transparent);
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--gs-gold) 8%, transparent);
}
```

- 内环虚线；中心指针用元素色三角。
- 小地图是装饰性导航，不要真放地图 tiles。

## 8. 队伍头像 / 用户

```css
.gs-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  border: 1px solid var(--gs-gold);
  background: radial-gradient(circle at 50% 38%, var(--gs-gold-100), transparent 46%),
    conic-gradient(from 210deg, var(--gs-accent-soft), var(--gs-surface), var(--gs-accent));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--gs-gold) 18%, transparent);
}
```

- 头像必须圆；不要方圆角矩形（那是 ZZZ）。
- 当前角色加 1px 元素色外圈；其他降透明。

## 9. 任务追踪

```html
<aside class="gs-quests">
  <h2>QUEST / 委托</h2>
  <div class="gs-quest"><p>前往风起地，聆听古树的低语</p><span>MAIN · 01</span></div>
</aside>
```

```css
.gs-quests { padding: 16px; border: 1px solid var(--gs-line); border-radius: var(--gs-radius-lg); background: color-mix(in srgb, var(--gs-night-800) 72%, transparent); }
.gs-quest { display: flex; gap: 10px; padding: 11px 0; border-top: 1px solid var(--gs-line-soft); }
.gs-quest::before { content: ""; width: 6px; height: 6px; margin-top: 6px; background: var(--gs-accent); transform: rotate(45deg); }
.gs-quest span { display: block; font-family: var(--gs-font-mono); font-size: 8px; letter-spacing: .1em; color: var(--gs-fg-muted); }
```

- 3 条以内；每条 2 行（任务 + 类型）。
- 不用 checkbox/进度条堆叠；任务追踪是氛围，不是后台列表。

## 10. 对话框 + 选项

```css
.gs-dialogue { display: grid; grid-template-columns: 88px 1fr; gap: 18px; padding: 22px; }
.gs-choice {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 9px 12px; border: 1px solid var(--gs-line-soft);
  border-radius: var(--gs-radius-md); background: color-mix(in srgb, var(--gs-surface) 58%, transparent);
  text-align: left; font-size: 13px;
}
.gs-choice::before { content: ""; width: 6px; height: 6px; background: var(--gs-gold); transform: rotate(45deg); }
.gs-choice:hover { border-color: var(--gs-accent); background: color-mix(in srgb, var(--gs-accent) 10%, transparent); }
```

- 说话人用展示字 + 元素色（叙事模式衬线 / 忠实模式 900 黑体）；正文 14px/1.9。
- 选项 2–3 个；菱形 bullet；不要用 emoji。

## 11. 星级 / 品质

```css
.gs-stars { color: var(--gs-star-5); letter-spacing: .1em; text-shadow: 0 0 12px color-mix(in srgb, var(--gs-star-5) 55%, transparent); }
```

- 星数 3/4/5；与品质边框一致。
- 星星用 ★ 字符或自绘 star.svg；不要彩虹描边。

## 12. 进度 / 元素充能

```css
.gs-progress { height: 4px; border-radius: 999px; background: var(--gs-line-soft); overflow: hidden; }
.gs-progress > i { display: block; height: 100%; width: var(--v, 60%); background: var(--gs-accent); box-shadow: 0 0 10px color-mix(in srgb, var(--gs-accent) 55%, transparent); }
```

- 进度条 3–5px；元素色；圆角。
- 环形进度用 `conic-gradient` + mask，不要 SVG 大图。

## 13. 命之座 / 装饰环

```css
.gs-orbit { position: relative; width: 132px; aspect-ratio: 1; border: 1px solid var(--gs-line); border-radius: 50%; }
.gs-orbit::before { content: ""; position: absolute; inset: 16px; border: 1px dashed color-mix(in srgb, var(--gs-gold) 55%, transparent); border-radius: 50%; }
.gs-orbit__node { position: absolute; width: 11px; height: 11px; border: 1px solid var(--gs-gold); background: var(--gs-surface); transform: translate(-50%, -50%) rotate(45deg); }
.gs-orbit__node.is-on { background: var(--gs-accent); box-shadow: 0 0 12px var(--gs-accent); }
```

- 6 节点；激活节点最多 1–2 个。
- 装饰环不做无限旋转（除非是加载/祈愿的主徽记，且 60s 以上）。

## 14. 加载徽记 / 元素涟漪

```css
.gs-rune {
  width: 120px; aspect-ratio: 1;
  background: var(--gs-accent);
  -webkit-mask: url("textures/sigil.svg") center / contain no-repeat;
  mask: url("textures/sigil.svg") center / contain no-repeat;
  animation: gs-drift 70s linear infinite;
}
@keyframes gs-drift { to { transform: rotate(360deg); } }
```

切换主题/元素的「元素涟漪」：见 `references/05-motion.md` §2；用 View Transitions 的 `clip-path: circle()`，失败就瞬时切换，不要做假的灰色遮罩。

## 15. 状态与可访问性

- 所有交互元素必须有 `:focus-visible` 金色/元素色描边。
- tab 用 `role="tablist"` + `aria-selected`；按钮有可读文本或 `aria-label`。
- 色弱：元素色 + 汉字/图形双编码（如「风」+ 绿），不只靠颜色。
- `prefers-reduced-motion` 下停止旋转/视差/涟漪，内容仍完整。
- 金边/角饰是 `aria-hidden` 或 CSS 背景，不能进入可读文本。
- 图片必须有 `alt`；纯装饰图 `alt=""`。
