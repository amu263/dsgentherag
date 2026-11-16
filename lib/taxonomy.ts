import type { ColorFamily, SortKey, TagGroup } from "./types";

export const SITE = {
  name: "幻绘",
  en: "PHANTOM ARCHIVE",
  short: "PHANTOM",
  description: "AI 生图作品与提示词档案：模型、角色、色调、标签，一次搜全。",
  slogan: "图和提示词，一起收好。",
  url: "http://127.0.0.1:3210",
  locale: "zh-CN",
  nav: [
    { href: "/", label: "发现", en: "DISCOVER" },
    { href: "/models", label: "模型", en: "MODELS" },
    { href: "/characters", label: "角色", en: "CHARACTERS" },
    { href: "/tags", label: "标签", en: "TAGS" },
  ],
};

export const COLOR_FAMILIES: {
  id: ColorFamily;
  name: string;
  en: string;
  hex: string;
  dark?: boolean;
}[] = [
  { id: "red", name: "绯红", en: "RED", hex: "#e0362c" },
  { id: "orange", name: "橙焰", en: "ORANGE", hex: "#f08321" },
  { id: "yellow", name: "硫黄", en: "YELLOW", hex: "#e6d21f" },
  { id: "green", name: "苔绿", en: "GREEN", hex: "#58a04a" },
  { id: "cyan", name: "电青", en: "CYAN", hex: "#29bfc4" },
  { id: "blue", name: "深蓝", en: "BLUE", hex: "#2b5cd9" },
  { id: "purple", name: "紫烟", en: "PURPLE", hex: "#8a5cd9" },
  { id: "pink", name: "桃粉", en: "PINK", hex: "#e86ba4" },
  { id: "earth", name: "土棕", en: "EARTH", hex: "#8a6a4a" },
  { id: "mono", name: "黑白", en: "MONO", hex: "#cfcfcf", dark: true },
];

export const COLOR_MAP = new Map(COLOR_FAMILIES.map((c) => [c.id, c]));

export const SORTS: { id: SortKey; label: string; en: string; hint: string }[] = [
  { id: "featured", label: "站长精选", en: "CURATED", hint: "人工排序" },
  { id: "latest", label: "最新发布", en: "LATEST", hint: "按入库时间" },
  { id: "hot", label: "正在流行", en: "TRENDING", hint: "赞与浏览综合" },
  { id: "likes", label: "最多喜欢", en: "MOST LIKED", hint: "按红心数" },
  { id: "views", label: "最多浏览", en: "MOST VIEWED", hint: "按打开次数" },
  { id: "favorites", label: "最多收藏", en: "MOST SAVED", hint: "按收藏数" },
  { id: "random", label: "随机漫游", en: "SHUFFLE", hint: "每天换一批" },
  { id: "oldest", label: "最早发布", en: "EARLIEST", hint: "档案倒序" },
];

export const SORT_MAP = new Map(SORTS.map((s) => [s.id, s]));

export const TAG_GROUPS: TagGroup[] = [
  "风格",
  "场景",
  "服饰",
  "构图",
  "光影",
  "题材",
  "色调",
  "画质",
  "自定义",
];

export const PAGE_SIZE = 24;

export const ADMIN_COOKIE = "phantom_admin";
