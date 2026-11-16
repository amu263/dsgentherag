import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ImageStage from "@/components/detail/ImageStage";
import Dossier from "@/components/detail/Dossier";
import ViewPing from "@/components/detail/ViewPing";
import Masonry from "@/components/Masonry";
import { findWork, loadDB } from "@/lib/store";
import { sortWorks } from "@/lib/query";
import { SITE } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const work = findWork(loadDB(), id);
  if (!work) return { title: "作品不存在" };
  const description = work.promptPublic
    ? work.prompt.slice(0, 150)
    : `${work.title} · ${work.modelLabel} · 提示词未公开`;
  return {
    title: `${work.title} — ${work.modelShort || work.modelLabel}`,
    description,
    openGraph: {
      title: `${work.title} · 幻绘`,
      description,
      images: [{ url: work.src, width: work.width, height: work.height, alt: work.title }],
    },
  };
}

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = loadDB();
  const work = findWork(db, id);
  if (!work) notFound();

  const latest = sortWorks(db.works, "latest");
  const pos = latest.findIndex((w) => w.id === work.id);
  const prevId = pos > 0 ? latest[pos - 1].id : undefined;
  const nextId = pos >= 0 && pos < latest.length - 1 ? latest[pos + 1].id : undefined;

  const model = db.models.find((m) => m.id === work.modelId);
  const characters = db.characters.filter((c) => work.characters.includes(c.id));
  const tags = work.tags
    .map((t) => db.tags.find((tag) => tag.id === t))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const related = db.works
    .filter((w) => w.id !== work.id)
    .map((w) => {
      let score = 0;
      if (w.modelId === work.modelId) score += 2;
      for (const t of w.tags) if (work.tags.includes(t)) score += 1.4;
      for (const c of w.characters) if (work.characters.includes(c)) score += 3;
      if (w.colorFamily === work.colorFamily) score += 0.6;
      return { w, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.w);

  const shareUrl = `${process.env.SITE_URL || SITE.url}/p/${work.id}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: work.title,
    contentUrl: `${SITE.url}${work.src}`,
    width: work.width,
    height: work.height,
    datePublished: work.createdAt,
    creator: { "@type": "Person", name: work.author },
    description: work.promptPublic ? work.prompt.slice(0, 300) : work.title,
  };

  return (
    <article className="detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="detail-top">
        <div className="detail-top__inner">
          <Link href="/" className="back-link">
            ← 返回档案
          </Link>
          <span className="mono detail-top__no">
            NO.{String(pos + 1).padStart(3, "0")} / {String(latest.length).padStart(3, "0")}
          </span>
          <div className="detail-pager">
            {prevId ? <Link href={`/p/${prevId}`}>← 上一件</Link> : <span>← 上一件</span>}
            {nextId ? <Link href={`/p/${nextId}`}>下一件 →</Link> : <span>下一件 →</span>}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <ImageStage work={work} prevId={prevId} nextId={nextId} />
        <Dossier
          work={work}
          model={model}
          characters={characters}
          tags={tags}
          shareUrl={shareUrl}
        />
      </div>

      {related.length > 0 && (
        <section className="related">
          <div className="related__head">
            <span className="eyebrow">RELATED / 同档案</span>
            <h2>你可能还想翻到的</h2>
          </div>
          <Masonry items={related} />
        </section>
      )}

      <ViewPing id={work.id} />
    </article>
  );
}
