import Hero from "@/components/Hero";
import FilterBar from "@/components/FilterBar";
import Gallery from "@/components/Gallery";
import { loadDB } from "@/lib/store";
import { facets, normalizeQuery, queryToParams, runQuery, sortWorks } from "@/lib/query";
import { COLOR_FAMILIES, TAG_GROUPS } from "@/lib/taxonomy";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = normalizeQuery(params);
  const db = loadDB();
  const result = runQuery(db, query);
  const counts = facets(db);

  const featured = sortWorks(
    db.works.filter((w) => w.featured > 0),
    "featured",
  ).slice(0, 3);
  const fallback = sortWorks(db.works, "latest").slice(0, 3);
  const shelf = featured.length ? featured : fallback;
  const randomId = db.works.length ? db.works[Math.floor(Math.random() * db.works.length)].id : "";
  const creators = new Set(db.works.map((w) => w.author)).size;
  const updated = db.works
    .map((w) => w.createdAt)
    .sort()
    .at(-1);

  const facetData = {
    models: [...db.models]
      .sort((a, b) => a.order - b.order)
      .map((m) => ({ id: m.id, name: m.name, code: m.code, count: counts.modelCounts.get(m.id) || 0 }))
      .filter((m) => m.count > 0),
    characters: [...db.characters]
      .map((c) => ({ id: c.id, name: c.name, series: c.series, count: counts.charCounts.get(c.id) || 0 }))
      .sort((a, b) => b.count - a.count),
    tags: TAG_GROUPS.flatMap((group) =>
      db.tags
        .filter((t) => t.group === group)
        .map((t) => ({ id: t.id, name: t.name, group: t.group, count: counts.tagCounts.get(t.id) || 0 }))
        .sort((a, b) => b.count - a.count),
    ),
    colors: COLOR_FAMILIES.map((c) => ({
      id: c.id,
      name: c.name,
      hex: c.hex,
      count: counts.colorCounts.get(c.id) || 0,
    })),
  };

  const queryString = queryToParams(query).toString();
  const heading = query.q ? `搜索「${query.q}」` : undefined;

  return (
    <>
      <Hero
        featured={shelf}
        total={db.works.length}
        models={db.models.filter((m) => (counts.modelCounts.get(m.id) || 0) > 0).length}
        creators={creators}
        randomId={randomId}
        updated={updated ? formatDate(updated) : "2026.11.16"}
      />
      <FilterBar facets={facetData} query={query} total={result.total} />
      <section className="gallery-section" id="gallery">
        <div className="gallery-wrap">
          <Gallery
            key={queryString || "all"}
            initial={result.items}
            total={result.total}
            queryString={queryString}
            heading={heading}
          />
        </div>
      </section>
    </>
  );
}
