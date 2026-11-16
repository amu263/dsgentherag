import type { DB, Work, WorkQuery, WorkQueryResult } from "./types";
import { PAGE_SIZE, SORT_MAP } from "./taxonomy";

export function parseTagsParam(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return [...new Set(raw.split(/[,，]/).map((s) => s.trim()).filter(Boolean))];
}

export function normalizeQuery(
  params: Record<string, string | string[] | undefined>,
): WorkQuery {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const sortRaw = one(params.sort) || "featured";
  const sort = SORT_MAP.has(sortRaw as never) ? (sortRaw as WorkQuery["sort"]) : "featured";
  return {
    q: (one(params.q) || "").trim().slice(0, 120),
    model: one(params.model) || "",
    tags: parseTagsParam(params.tags),
    characters: parseTagsParam(params.chars || params.characters),
    color: one(params.color) || "",
    sort,
    page: Math.max(1, Number(one(params.page)) || 1),
    pageSize: PAGE_SIZE,
  };
}

export function queryToParams(q: WorkQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.model) p.set("model", q.model);
  if (q.tags?.length) p.set("tags", q.tags.join(","));
  if (q.characters?.length) p.set("chars", q.characters.join(","));
  if (q.color) p.set("color", q.color);
  if (q.sort && q.sort !== "featured") p.set("sort", q.sort);
  return p;
}

export function buildHaystack(db: DB, w: Work): string {
  if (haystackCache.has(w.id) && haystackCache.get(w.id)?.v === db.updatedAt) {
    return haystackCache.get(w.id)!.s;
  }
  const model = db.models.find((m) => m.id === w.modelId);
  const chars = db.characters.filter((c) => w.characters.includes(c.id));
  const tags = db.tags.filter((t) => w.tags.includes(t.id));
  const s = [
    w.title,
    w.prompt,
    w.negativePrompt,
    w.author,
    w.modelLabel,
    model?.name,
    model?.en,
    model?.vendor,
    ...chars.flatMap((c) => [c.name, c.en, c.series]),
    ...tags.flatMap((t) => [t.name, t.en]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  haystackCache.set(w.id, { v: db.updatedAt, s });
  return s;
}

const haystackCache = new Map<string, { v: string; s: string }>();

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function daySeed(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

export function filterWorks(db: DB, q: WorkQuery): Work[] {
  const tokens = (q.q || "").toLowerCase().split(/\s+/).filter(Boolean);
  return db.works.filter((w) => {
    if (q.model && w.modelId !== q.model) return false;
    if (q.color && w.colorFamily !== q.color) return false;
    if (q.characters?.length && !q.characters.some((c) => w.characters.includes(c))) return false;
    if (q.tags?.length && !q.tags.every((t) => w.tags.includes(t))) return false;
    if (tokens.length) {
      const hay = buildHaystack(db, w);
      if (!tokens.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
}

export function sortWorks(works: Work[], sort: WorkQuery["sort"]): Work[] {
  const list = [...works];
  switch (sort) {
    case "latest":
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "oldest":
      return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "likes":
      return list.sort((a, b) => b.stats.likes - a.stats.likes);
    case "views":
      return list.sort((a, b) => b.stats.views - a.stats.views);
    case "favorites":
      return list.sort((a, b) => b.stats.favorites - a.stats.favorites);
    case "hot":
      return list.sort(
        (a, b) =>
          b.stats.likes * 4 +
          b.stats.favorites * 3 +
          b.stats.views * 0.12 -
          (a.stats.likes * 4 + a.stats.favorites * 3 + a.stats.views * 0.12),
      );
    case "random": {
      const seed = daySeed();
      return list.sort((a, b) => hash(a.id + seed) - hash(b.id + seed));
    }
    case "featured":
    default:
      return list.sort((a, b) => {
        const fa = a.featured > 0 ? a.featured : 9999;
        const fb = b.featured > 0 ? b.featured : 9999;
        if (fa !== fb) return fa - fb;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }
}

export function runQuery(db: DB, q: WorkQuery): WorkQueryResult {
  const page = q.page || 1;
  const pageSize = q.pageSize || PAGE_SIZE;
  const filtered = sortWorks(filterWorks(db, q), q.sort);
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
    hasMore: start + pageSize < filtered.length,
  };
}

export function facets(db: DB) {
  const modelCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const charCounts = new Map<string, number>();
  const colorCounts = new Map<string, number>();
  for (const w of db.works) {
    modelCounts.set(w.modelId, (modelCounts.get(w.modelId) || 0) + 1);
    for (const t of w.tags) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    for (const c of w.characters) charCounts.set(c, (charCounts.get(c) || 0) + 1);
    colorCounts.set(w.colorFamily, (colorCounts.get(w.colorFamily) || 0) + 1);
  }
  return { modelCounts, tagCounts, charCounts, colorCounts };
}
