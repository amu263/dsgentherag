import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Work } from "@/lib/types";
import { formatCount } from "@/lib/format";
import { ArrowUpRight, ShuffleIcon } from "./Icons";

export default function Hero({
  featured,
  total,
  models,
  creators,
  randomId,
  updated,
}: {
  featured: Work[];
  total: number;
  models: number;
  creators: number;
  randomId: string;
  updated: string;
}) {
  const shelf = featured.slice(0, 3);
  const rotations = ["-2.4deg", "1.6deg", "-1.2deg"];
  return (
    <section className="index-hero">
      <div className="index-hero__ghost" aria-hidden="true">
        DISCOVER
      </div>
      <div className="index-hero__inner">
        <div className="index-hero__main">
          <div className="eyebrow">01 / DISCOVER · 公开档案</div>
          <h1>
            图和提示词，
            <br />
            <span className="hl">一起收好。</span>
          </h1>
          <div className="index-hero__meta">
            <span>
              <b className="num">{formatCount(total)}</b> 件作品
            </span>
            <span className="sep" />
            <span>
              <b className="num">{models}</b> 个模型
            </span>
            <span className="sep" />
            <span>
              <b className="num">{formatCount(creators)}</b> 位创作者
            </span>
            <Link className="hero-shuffle" href={`/p/${randomId}`}>
              <ShuffleIcon /> 随便看看
            </Link>
          </div>
        </div>

        <div className="index-hero__shelf" aria-label="编辑精选">
          {shelf.map((work, i) => (
            <Link
              key={work.id}
              href={`/p/${work.id}`}
              className="shelf-card"
              style={{ "--rot": rotations[i] } as CSSProperties}
            >
              <Image
                src={work.thumb}
                alt={work.title}
                fill
                sizes="(max-width: 760px) 30vw, 180px"
                placeholder="blur"
                blurDataURL={work.blur}
                priority={i === 0}
                style={{ objectFit: "cover" }}
              />
              <span className="shelf-card__no">PICK 0{i + 1}</span>
              <span className="shelf-card__tag">
                {work.title}
                <br />
                <span className="mono" style={{ fontSize: 8, letterSpacing: ".08em", opacity: 0.62 }}>
                  {work.modelShort || work.modelLabel}
                </span>
              </span>
            </Link>
          ))}
          {shelf.length === 0 && <div className="shelf-card shelf-card--empty">NO PICKS YET</div>}
          <span className="shelf-stamp" aria-hidden="true">
            <ArrowUpRight />
            <b>{updated}</b>
            <i>UPDATED</i>
          </span>
        </div>
      </div>
    </section>
  );
}
