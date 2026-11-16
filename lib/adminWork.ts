import type { DB, GenParams, Work, WorkStats } from "./types";
import { COLOR_FAMILIES } from "./taxonomy";
import { shortId, slugify } from "./format";

export interface WorkInput {
  title?: string;
  prompt?: string;
  negativePrompt?: string;
  promptPublic?: boolean;
  note?: string;
  modelId?: string;
  modelName?: string;
  tags?: string[];
  characters?: string[];
  author?: string;
  authorUrl?: string;
  sourceName?: string;
  sourceUrl?: string;
  createdAt?: string;
  featured?: number;
  colorFamily?: string;
  palette?: string[];
  width?: number;
  height?: number;
  src?: string;
  thumb?: string;
  dominant?: string;
  blur?: string;
  params?: GenParams;
  stats?: Partial<WorkStats>;
  nsfw?: boolean;
}

function resolveModel(db: DB, item: WorkInput) {
  if (item.modelId) {
    const found = db.models.find((m) => m.id === item.modelId);
    if (found) return found;
  }
  const name = (item.modelName || "").trim();
  if (name) {
    const found = db.models.find(
      (m) => m.name.toLowerCase() === name.toLowerCase() || m.en.toLowerCase() === name.toLowerCase(),
    );
    if (found) return found;
    const id = `m-${shortId(6)}`;
    const model = {
      id,
      name,
      en: name,
      vendor: "自定义",
      code: name.slice(0, 4).toUpperCase(),
      tagline: "",
      blurb: "",
      order: db.models.length + 1,
    };
    db.models.push(model);
    return model;
  }
  return db.models[0];
}

function resolveTags(db: DB, tags: string[] | undefined): string[] {
  const out: string[] = [];
  for (const raw of tags || []) {
    const name = String(raw).trim().replace(/^#/, "");
    if (!name) continue;
    let tag = db.tags.find(
      (t) => t.id === name || t.name === name || t.en.toLowerCase() === name.toLowerCase(),
    );
    if (!tag) {
      tag = { id: `t-${shortId(6)}`, name, en: "", group: "自定义" };
      db.tags.push(tag);
    }
    if (!out.includes(tag.id)) out.push(tag.id);
  }
  return out;
}

function resolveCharacters(db: DB, characters: string[] | undefined): string[] {
  const out: string[] = [];
  for (const raw of characters || []) {
    const name = String(raw).trim();
    if (!name) continue;
    let character = db.characters.find(
      (c) => c.id === name || c.name === name || c.en.toLowerCase() === name.toLowerCase(),
    );
    if (!character) {
      character = { id: `c-${shortId(6)}`, name, en: "", series: "原创", blurb: "" };
      db.characters.push(character);
    }
    if (!out.includes(character.id)) out.push(character.id);
  }
  return out;
}

function colorFamily(value: string | undefined): Work["colorFamily"] {
  const found = COLOR_FAMILIES.find((c) => c.id === value);
  return found ? found.id : "mono";
}

function isoDate(value: string | undefined): string {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function createWork(db: DB, item: WorkInput): Work {
  const model = resolveModel(db, item);
  const title = (item.title || "未命名作品").trim().slice(0, 80);
  let id = `w-${shortId(8)}`;
  while (db.works.some((w) => w.id === id)) id = `w-${shortId(8)}`;
  return {
    id,
    title,
    prompt: (item.prompt || "").trim(),
    negativePrompt: (item.negativePrompt || "").trim(),
    promptPublic: item.promptPublic !== false,
    note: (item.note || "").trim(),
    modelId: model.id,
    modelLabel: model.name,
    modelShort: model.en || model.name,
    params: item.params || {},
    tags: resolveTags(db, item.tags),
    characters: resolveCharacters(db, item.characters),
    colorFamily: colorFamily(item.colorFamily),
    palette: (item.palette || []).slice(0, 6),
    width: item.width || 1,
    height: item.height || 1,
    src: item.src || "",
    thumb: item.thumb || item.src || "",
    dominant: item.dominant || "#1a1a1a",
    blur: item.blur || "",
    author: (item.author || "匿名").trim().slice(0, 40),
    authorUrl: item.authorUrl || "",
    sourceName: item.sourceName || "本站",
    sourceUrl: item.sourceUrl || "",
    stats: {
      views: item.stats?.views || 0,
      likes: item.stats?.likes || 0,
      favorites: item.stats?.favorites || 0,
      downloads: item.stats?.downloads || 0,
    },
    createdAt: isoDate(item.createdAt),
    featured: Number(item.featured) || 0,
    nsfw: Boolean(item.nsfw),
  };
}

export function applyWorkInput(db: DB, work: Work, item: WorkInput): Work {
  const model = resolveModel(db, item);
  if (item.title != null) work.title = String(item.title).trim().slice(0, 80) || work.title;
  if (item.prompt != null) work.prompt = String(item.prompt).trim();
  if (item.negativePrompt != null) work.negativePrompt = String(item.negativePrompt).trim();
  if (item.promptPublic != null) work.promptPublic = Boolean(item.promptPublic);
  if (item.note != null) work.note = String(item.note).trim();
  if (item.modelId || item.modelName) {
    work.modelId = model.id;
    work.modelLabel = model.name;
    work.modelShort = model.en || model.name;
  }
  if (item.tags) work.tags = resolveTags(db, item.tags);
  if (item.characters) work.characters = resolveCharacters(db, item.characters);
  if (item.colorFamily) work.colorFamily = colorFamily(item.colorFamily);
  if (item.palette) work.palette = item.palette.slice(0, 6);
  if (item.author != null) work.author = String(item.author).trim().slice(0, 40) || "匿名";
  if (item.authorUrl != null) work.authorUrl = String(item.authorUrl);
  if (item.sourceName != null) work.sourceName = String(item.sourceName);
  if (item.sourceUrl != null) work.sourceUrl = String(item.sourceUrl);
  if (item.params) work.params = item.params;
  if (item.featured != null) work.featured = Number(item.featured) || 0;
  if (item.createdAt) work.createdAt = isoDate(item.createdAt);
  if (item.stats) work.stats = { ...work.stats, ...item.stats };
  if (item.nsfw != null) work.nsfw = Boolean(item.nsfw);
  return work;
}

export function safeSlug(title: string): string {
  return slugify(title).slice(0, 40) || `work-${shortId(5)}`;
}
