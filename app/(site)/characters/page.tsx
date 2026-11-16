import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { loadDB } from "@/lib/store";
import { facets } from "@/lib/query";
import { ArrowRight } from "@/components/Icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "角色",
  description: "按角色人物翻阅 AI 生图作品：萌音莜奈、珊、阿库娅、芙莉莲与原创角色。",
};

export default async function CharactersPage() {
  const db = loadDB();
  const counts = facets(db);
  const characters = db.characters
    .map((c) => {
      const works = db.works
        .filter((w) => w.characters.includes(c.id))
        .sort((a, b) => b.stats.likes - a.stats.likes);
      const cover = (c.coverId && db.works.find((w) => w.id === c.coverId)) || works[0];
      return { character: c, count: counts.charCounts.get(c.id) || 0, cover };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="archive-page">
      <header className="archive-head">
        <div className="archive-head__ghost" aria-hidden="true">
          SUBJECTS
        </div>
        <div className="archive-head__inner">
          <div>
            <div className="eyebrow">03 / SUBJECTS · 人物索引</div>
            <h1>角色</h1>
            <p className="archive-head__desc">同一张脸，换舞台、换光、换情绪。按人物翻，比按时间翻更有意思。</p>
          </div>
          <div className="archive-head__side">
            <b>{String(characters.length).padStart(2, "0")}</b>
            <span>SUBJECTS ON FILE</span>
            <span>{db.works.length} WORKS TAGGED</span>
          </div>
        </div>
      </header>

      <div className="char-grid">
        {characters.map(({ character: c, count, cover }, i) => (
          <Link key={c.id} href={`/characters/${c.id}`} className="char-card">
            <div className="char-card__media">
              {cover ? (
                <Image
                  src={cover.thumb}
                  alt={c.name}
                  fill
                  sizes="(max-width: 700px) 48vw, 24vw"
                  placeholder="blur"
                  blurDataURL={cover.blur}
                  style={{ objectFit: "cover", objectPosition: c.coverPosition || "50% 30%" }}
                />
              ) : (
                <span className="char-card__blank" />
              )}
              <span className="char-card__no">CHAR.{String(i + 1).padStart(2, "0")}</span>
              <span className="char-card__name">
                {c.name}
                <em>{c.en}</em>
              </span>
            </div>
            <div className="char-card__meta">
              <span>{c.series}</span>
              <b>{count} 件</b>
            </div>
          </Link>
        ))}
      </div>

      <div className="archive-cta">
        <span className="mono">没看到熟悉的角色？</span>
        <Link href="/models" className="btn btn--line">
          换个入口 <ArrowRight />
        </Link>
      </div>
    </div>
  );
}
