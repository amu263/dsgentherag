import { loadDB } from "@/lib/store";
import { buildHaystack, facets } from "@/lib/query";
import { sortWorks } from "@/lib/query";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  const db = loadDB();
  const counts = facets(db);

  const works = tokens.length
    ? db.works
        .filter((w) => {
          const hay = buildHaystack(db, w);
          return tokens.every((t) => hay.includes(t));
        })
        .slice(0, 6)
    : sortWorks(db.works, "featured").slice(0, 4);

  const match = (s: string[]) => (tokens.length ? tokens.every((t) => s.join(" ").toLowerCase().includes(t)) : true);

  const tags = db.tags
    .filter((t) => match([t.name, t.en, t.id]))
    .map((t) => ({ id: t.id, name: t.name, count: counts.tagCounts.get(t.id) || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const characters = db.characters
    .filter((c) => match([c.name, c.en, c.series, c.id]))
    .map((c) => ({ id: c.id, name: c.name, series: c.series, count: counts.charCounts.get(c.id) || 0 }))
    .slice(0, 5);

  const models = db.models
    .filter((m) => match([m.name, m.en, m.vendor, m.code]))
    .map((m) => ({ id: m.id, name: m.name, code: m.code, count: counts.modelCounts.get(m.id) || 0 }))
    .slice(0, 5);

  return Response.json({
    works: works.map((w) => ({
      id: w.id,
      title: w.title,
      thumb: w.thumb,
      model: w.modelShort || w.modelLabel,
      author: w.author,
    })),
    tags,
    characters,
    models,
  });
}
