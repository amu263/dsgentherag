import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { loadDB } from "@/lib/store";
import { facets, sortWorks } from "@/lib/query";
import { ArrowRight, ArrowUpRight } from "@/components/Icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "模型",
  description: "按生图模型翻阅档案：FLUX.1、GPT-Image 2、Krea 2、Illustrious、Pony、SDXL、Anima、ZImage、MOSS、Qwen-Image…",
};

export default async function ModelsPage() {
  const db = loadDB();
  const counts = facets(db);
  const models = [...db.models]
    .sort((a, b) => a.order - b.order)
    .map((m) => {
      const works = sortWorks(
        db.works.filter((w) => w.modelId === m.id),
        "hot",
      );
      return { model: m, count: counts.modelCounts.get(m.id) || 0, works: works.slice(0, 3) };
    })
    .filter((m) => m.count > 0);

  return (
    <div className="archive-page">
      <header className="archive-head">
        <div className="archive-head__ghost" aria-hidden="true">
          MODELS
        </div>
        <div className="archive-head__inner">
          <div>
            <div className="eyebrow">02 / MODELS · 底座档案</div>
            <h1>模型</h1>
            <p className="archive-head__desc">
              一个模型一种手感。先选底座，再挑你要的光、材质和脸。
            </p>
          </div>
          <div className="archive-head__side">
            <b>{String(models.length).padStart(2, "0")}</b>
            <span>MODEL FAMILIES ON FILE</span>
            <span>{db.works.length} WORKS TAGGED</span>
          </div>
        </div>
      </header>

      <div className="model-grid">
        {models.map(({ model, count, works }) => (
          <Link key={model.id} href={`/models/${model.id}`} className="model-card">
            <div className="model-card__band">
              {works.map((w) => (
                <Image
                  key={w.id}
                  src={w.thumb}
                  alt={w.title}
                  width={240}
                  height={240}
                  sizes="20vw"
                  style={{ objectFit: "cover" }}
                />
              ))}
              {works.length === 0 && <span className="model-card__blank" />}
            </div>
            <div className="model-card__body">
              <div className="model-card__top">
                <span className="model-card__code">{model.code}</span>
                <span className="model-card__count">{count} 件</span>
              </div>
              <h2>{model.name}</h2>
              <div className="model-card__vendor">{model.vendor}</div>
              <p>{model.blurb}</p>
              <div className="model-card__foot">
                进入模型档案 <ArrowUpRight />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="archive-cta">
        <span className="mono">找不到想看的底座？</span>
        <Link href="/" className="btn btn--line">
          在全部作品里筛 <ArrowRight />
        </Link>
      </div>
    </div>
  );
}
