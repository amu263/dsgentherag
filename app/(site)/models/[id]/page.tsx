import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import { loadDB } from "@/lib/store";
import { facets, runQuery, sortWorks } from "@/lib/query";
import { ArrowLeft } from "@/components/Icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const model = loadDB().models.find((m) => m.id === id);
  if (!model) return { title: "模型不存在" };
  return {
    title: `${model.name} 作品`,
    description: `${model.name} · ${model.vendor}。${model.blurb}`,
  };
}

export default async function ModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = loadDB();
  const model = db.models.find((m) => m.id === id);
  if (!model) notFound();
  const counts = facets(db);
  const result = runQuery(db, { model: id, sort: "featured", page: 1 });
  const topTags = db.tags
    .map((t) => ({ t, n: db.works.filter((w) => w.modelId === id && w.tags.includes(t.id)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);
  const siblings = db.models
    .filter((m) => m.id !== id && (counts.modelCounts.get(m.id) || 0) > 0)
    .slice(0, 4);

  return (
    <div className="archive-page">
      <header className="archive-head">
        <div className="archive-head__ghost" aria-hidden="true">
          {model.code}
        </div>
        <div className="archive-head__inner">
          <div>
            <Link href="/models" className="back-link" style={{ display: "inline-flex", gap: 6 }}>
              <ArrowLeft style={{ width: 11, height: 11 }} /> 全部模型
            </Link>
            <h1>{model.name}</h1>
            <p className="archive-head__desc">
              {model.blurb}
              <span className="model-page__vendor">
                {model.vendor} / {model.tagline}
              </span>
            </p>
            <div className="model-page__tags">
              {topTags.map(({ t, n }) => (
                <Link key={t.id} href={`/?tags=${t.id}&model=${id}`} className="tag-chip">
                  #{t.name} <b>{n}</b>
                </Link>
              ))}
            </div>
          </div>
          <div className="archive-head__side">
            <b>{String(counts.modelCounts.get(id) || 0).padStart(2, "0")}</b>
            <span>WORKS IN THIS FAMILY</span>
            <span>{model.code} / {model.vendor.toUpperCase()}</span>
          </div>
        </div>
      </header>

      <section className="gallery-section">
        <div className="gallery-wrap">
          <Gallery
            key={id}
            initial={result.items}
            total={result.total}
            queryString={`model=${id}`}
            heading={`${model.name} 作品`}
          />
        </div>
      </section>

      {siblings.length > 0 && (
        <div className="archive-cta">
          <span className="mono">其他模型</span>
          <div className="archive-cta__links">
            {siblings.map((m) => (
              <Link key={m.id} href={`/models/${m.id}`}>
                {m.name} ↗
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
