#!/usr/bin/env node
/**
 * genshin-ui audit · 交付前自检
 * 用法：
 *   node scripts/audit.mjs <page.html>
 *   node scripts/audit.mjs --skill
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const args = process.argv.slice(2)
const strict = args.includes('--strict')
const skillMode = args.includes('--skill')
const target = args.find((a) => !a.startsWith('--'))

const PASS = []
const WARN = []
const FAIL = []
const pass = (m) => PASS.push(m)
const warn = (m) => WARN.push(m)
const fail = (m) => FAIL.push(m)

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

function elementKeys(css) {
  return new Set([...css.matchAll(/\[data-gs-element="([^"]+)"\]/g)].map((m) => m[1]))
}

function auditSkill() {
  const skillFile = path.join(ROOT, 'SKILL.md')
  if (!fs.existsSync(skillFile)) return fail('SKILL.md 不存在')
  const md = fs.readFileSync(skillFile, 'utf8')
  const fm = md.match(/^---\n([\s\S]*?)\n---/)
  if (!fm) fail('SKILL.md 缺少 frontmatter')
  else {
    const name = (fm[1].match(/^name:\s*(.+)$/m) || [])[1]
    const desc = (fm[1].match(/^description:\s*(.+)$/m) || [])[1]
    if (!name || !/^[a-z0-9-]+$/.test(name.trim())) fail('frontmatter.name 缺失或非 kebab-case')
    else pass('name: ' + name.trim())
    if (!desc || desc.trim().length < 60) fail('description 过短，触发词不足')
    else if (desc.length > 1200) warn('description 过长（>1200 字符）')
    else pass('description 长度 ' + desc.length)
  }
  const lines = md.split('\n').length
  if (lines > 500) warn('SKILL.md 行数 ' + lines + ' > 500，建议下沉细节')
  else pass('SKILL.md 行数 ' + lines)

  const required = [
    'references/01-design-dna.md',
    'references/02-color-and-type.md',
    'references/03-page-archetypes.md',
    'references/04-components.md',
    'references/05-motion.md',
    'references/06-copywriting.md',
    'references/07-evidence-and-sources.md',
    'assets/genshin-tokens.css',
    'assets/genshin-starter.html',
    'assets/genshin-landing.html',
    'assets/textures/gold-corner.svg',
    'assets/textures/favicon.svg',
    'assets/textures/sigil.svg',
    'assets/textures/parchment-grain.svg',
    'scripts/audit.mjs',
  ]
  const missing = required.filter((r) => !fs.existsSync(path.join(ROOT, r)))
  if (missing.length) fail('缺少必备文件：' + missing.join(', '))
  else pass(required.length + ' 个必备文件齐全')

  for (const f of fs.readdirSync(path.join(ROOT, 'references')).filter((x) => x.endsWith('.md'))) {
    const t = fs.readFileSync(path.join(ROOT, 'references', f), 'utf8')
    if (t.length < 1200) fail('references/' + f + ' 内容过短（' + t.length + ' 字符）')
    if (!/^#\s/m.test(t)) fail('references/' + f + ' 缺少一级标题')
  }
  pass('references 结构与长度检查完成')

  const tokenCss = fs.readFileSync(path.join(ROOT, 'assets/genshin-tokens.css'), 'utf8')
  const keys = elementKeys(tokenCss)
  const expected = ['anemo', 'geo', 'electro', 'dendro', 'hydro', 'pyro', 'cryo']
  const missingKeys = expected.filter((k) => !keys.has(k))
  if (missingKeys.length) fail('tokens 缺元素键：' + missingKeys.join('/'))
  else pass('七元素 token 齐全')

  const pages = ['assets/genshin-starter.html', 'assets/genshin-landing.html']
  for (const p of pages) {
    const html = fs.readFileSync(path.join(ROOT, p), 'utf8')
    const used = new Set([...html.matchAll(/data-gs-element="([^"]+)"/g)].map((m) => m[1]))
    const bad = [...used].filter((k) => !keys.has(k))
    if (bad.length) fail(p + ' 使用了未定义元素键：' + bad.join('/'))
  }
  if (!fs.existsSync(path.join(ROOT, 'assets/textures/gold-corner.svg'))) fail('缺少 gold-corner.svg')
  else pass('starter 使用的元素键均命中 tokens')

  const all = walk(ROOT).filter((f) => /\.(md|html|css|mjs|svg)$/.test(f))
  const todo = new RegExp(['TO' + 'DO', 'FIX' + 'ME', '待' + '补充', '占位' + '待填'].join('|'))
  const badTodo = all.filter((f) => todo.test(fs.readFileSync(f, 'utf8')))
  if (badTodo.length) fail('存在未完成标记：' + badTodo.map((f) => path.relative(ROOT, f)).join(', '))
  else pass('无未完成标记残留')

  const fonts = walk(ROOT).filter((f) => /\.(ttf|otf|woff2?|ttc)$/i.test(f))
  if (fonts.length) fail('skill 内不应内嵌字体文件：' + fonts.map((f) => path.relative(ROOT, f)).join(', '))
  else pass('未内嵌任何字体文件')

  const assetHosts = /webstatic|upload-os|yuanshen|hoyolab|genshin\.hoyoverse\.com/i
  const leaked = all.filter((f) => /\.(html|css|md)$/.test(f) && assetHosts.test(fs.readFileSync(f, 'utf8')))
  if (leaked.length) warn('文件中出现官方资源域名关键词（确认只是说明而非引用）：' + leaked.map((f) => path.relative(ROOT, f)).join(', '))
  else pass('未引用官方素材域名')
}

function auditPage(file) {
  if (!file || !fs.existsSync(file)) return fail('页面文件不存在：' + file)
  const html = fs.readFileSync(file, 'utf8')
  const cssFiles = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map((m) => m[1]).filter((u) => !/^https?:/.test(u))
  let css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
  for (const c of cssFiles) {
    const p = path.resolve(path.dirname(file), c)
    if (fs.existsSync(p)) css += '\n' + fs.readFileSync(p, 'utf8')
    else warn('引用的 CSS 不存在：' + c)
  }
  const all = html + '\n' + css

  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) fail('缺少 viewport meta')
  else pass('viewport 存在')
  if (!/lang=["']zh/i.test(html)) fail('html 缺少 lang="zh"')
  else pass('lang 存在')
  if (!/<title>[^<]+<\/title>/.test(html)) fail('缺少 title')
  else pass('title 存在')

  if (/<img\b[^>]*src=["']https?:/i.test(html)) fail('引用了外链图片（应使用本地或自绘占位）')
  else pass('无外链图片')
  if (/<link[^>]+href=["']https?:/i.test(html) || /@import\s+url\(\s*["']?https?:/i.test(css)) fail('引用了外链字体/样式')
  else pass('无外链字体/样式')
  if (/(webstatic|upload-os|yuanshen|hoyolab|genshin\.hoyoverse\.com)/i.test(all)) fail('出现官方素材资源域名')
  else pass('未引用官方素材域名')

  if (!/--gs-gold/.test(all)) fail('未使用 --gs-gold（金线体系未接上）')
  else pass('使用金线 token')
  if (!/--gs-accent/.test(all)) fail('未使用 --gs-accent（元素强调未接上）')
  else pass('使用元素 token')
  if (!/(corner|diamond|sigil|polygon\(|rotate\(45deg\)|rotate\(90deg\))/.test(all)) fail('缺少金线角饰/菱形/徽记结构')
  else pass('存在金线角饰/菱形/徽记')
  if (!/(parchment|star|radial-gradient|linear-gradient|texture)/.test(all)) fail('缺少纸面/星海纹理层')
  else pass('存在纸面/星海纹理层')
  if (!/(Cinzel|Noto Serif|Songti|serif)/.test(all)) fail('缺少衬线展示字')
  else pass('衬线展示字已声明')
  if (!/(HYWenHei|Noto Sans|PingFang|YaHei|sans-serif)/.test(all)) fail('缺少 UI 黑体')
  else pass('UI 黑体已声明')
  if (!/prefers-reduced-motion/i.test(css)) fail('缺少 prefers-reduced-motion 降级')
  else pass('存在 reduced-motion 降级')

  const tokenPath = path.join(ROOT, 'assets/genshin-tokens.css')
  if (fs.existsSync(tokenPath)) {
    const keys = elementKeys(fs.readFileSync(tokenPath, 'utf8'))
    const used = [...html.matchAll(/data-gs-element="([^"]+)"/g)].map((m) => m[1])
    const bad = [...new Set(used)].filter((k) => k && !keys.has(k))
    if (bad.length) fail('使用未定义元素键：' + bad.join('/'))
    else if (used.length) pass('元素键命中 tokens（' + new Set(used).size + ' 个）')
    const modes = [...html.matchAll(/data-gs-mode="([^"]+)"/g)].map((m) => m[1])
    const badModes = [...new Set(modes)].filter((m) => !['day', 'night'].includes(m))
    if (badModes.length) fail('data-gs-mode 只能是 day/night：' + badModes.join('/'))
    else pass('模式键合法')
  }

  const inlineCss = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
  const rawHex = inlineCss.match(/#[0-9a-fA-F]{3,8}\b/g) || []
  if (rawHex.length) fail('页面内联 CSS 出现裸色值：' + [...new Set(rawHex)].slice(0, 6).join(' '))
  else pass('内联 CSS 无裸色值')
  const rawRgb = inlineCss.match(/(?:rgba?|hsla?)\(/g) || []
  if (rawRgb.length) fail('页面内联 CSS 出现裸 rgb/hsl：' + rawRgb.length + ' 处（应走 token）')
  else pass('内联 CSS 无裸 rgb/hsl')

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0])
  const noAlt = imgs.filter((t) => !/\balt=/.test(t))
  if (noAlt.length) fail(noAlt.length + ' 个 <img> 缺少 alt')
  else if (imgs.length) pass(imgs.length + ' 个图片均有 alt')

  if (/backdrop-filter/i.test(inlineCss) && !/(hud|topbar|app-bar|nav)/i.test(inlineCss)) warn('检测到 backdrop-filter，确认只用于 HUD 而非内容面板')
  const textOnly = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')
  if (!/([A-Z]{3,})/.test(textOnly)) warn('未检测到大写英文小标/编号')
  const numbering = /(0[1-9]|VERSION|Lv\.|20\d{2}[.\-/]\d{1,2}|★★★★★)/.test(textOnly)
  if (!numbering) warn('未检测到编号/等级/日期/星级')
}

if (skillMode) auditSkill()
else auditPage(target)

const report = []
report.push('genshin-ui audit · ' + (skillMode ? 'skill' : path.basename(target || '')))
report.push('PASS ' + PASS.length + ' / WARN ' + WARN.length + ' / FAIL ' + FAIL.length)
for (const p of PASS) report.push('  ✔ ' + p)
for (const w of WARN) report.push('  ! ' + w)
for (const f of FAIL) report.push('  ✘ ' + f)
report.push(FAIL.length ? 'RESULT: FAIL' : strict && WARN.length ? 'RESULT: FAIL (strict)' : 'RESULT: PASS')
console.log(report.join('\n'))
process.exit(FAIL.length || (strict && WARN.length) ? 1 : 0)
