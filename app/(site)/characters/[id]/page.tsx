import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import { loadDB } from "@/lib/store";
import { facets, runQuery } from "@/lib/query";
import { ArrowLeft } from "@/components/Icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const character = loadDB().characters.find((c) => c.id === id);
  if (!character) return { title: "角色不存在" };
  return {
    title: `${character.name} 作品`,
    description: `${character.name} · ${character.series}。${character.blurb}`,
  };
}

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = loadDB();
  const character = db.characters.find((c) => c.id === id);
  if (!character) notFound();
  const counts = facets(db);
  const result = runQuery(db, { characters: [id], sort: "featured", page: 1 });
  const cover =
    (character.coverId && db.works.find((w) => w.id === character.coverId)) ||
    db.works.filter((w) => w.characters.includes(id)).sort((a, b) => b.stats.likes - a.stats.likes)[0];

  return (
    <div className="archive-page">
      <header className="character-hero">
        <div className="character-hero__media">
          {cover && (
            <Image
              src={cover.src}
              alt={character.name}
              fill
              sizes="(max-width: 800px) 100vw, 42vw"
              placeholder="blur"
              blurDataURL={cover.blur}
              priority
              style={{ objectFit: "cover", objectPosition: character.coverPosition || "50% 30%" }}
            />
          )}
          <span className="character-hero__no mono">CHARACTER / {character.en}</span>
        </div>
        <div className="character-hero__body">
          <Link href="/characters" className="back-link" style={{ display: "inline-flex", gap: 6 }}>
            <ArrowLeft style={{ width: 11, height: 11 }} /> 全部角色
          </Link>
          <div className="eyebrow">SUBJECT INDEX</div>
          <h1>{character.name}</h1>
          <div className="character-hero__series">{character.series}</div>
          <p>{character.blurb}</p>
          <div className="character-hero__stats">
            <span>
              <b>{counts.charCounts.get(id) || 0}</b>
              件作品
            </span>
            <span>
              <b>{db.works.filter((w) => w.characters.includes(id)).reduce((s, w) => s + w.stats.likes, 0).toLocaleString("zh-CN")}</b>
              次喜欢
            </span>
          </div>
        </div>
      </header>

      <section className="gallery-section">
        <div className="gallery-wrap">
          <Gallery
            key={id}
            initial={result.items}
            total={result.total}
            queryString={`chars=${id}`}
            heading={`${character.name} 的作品`}
          />
        </div>
      </section>
    </div>
  );
}
