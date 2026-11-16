import Link from "next/link";
import type { Character, Model, Tag, Work } from "@/lib/types";
import { formatCount, formatDate } from "@/lib/format";
import { COLOR_MAP } from "@/lib/taxonomy";
import {
  ArrowUpRight,
  DownloadIcon,
  EyeIcon,
  HeartIcon,
  StarIcon,
  TagIcon,
} from "../Icons";
import CopyButton from "./CopyButton";
import LikeButton from "./LikeButton";
import PromptCard from "./PromptCard";
import ShareRow from "./ShareRow";

export default function Dossier({
  work,
  model,
  characters,
  tags,
  shareUrl,
}: {
  work: Work;
  model?: Model;
  characters: Character[];
  tags: Tag[];
  shareUrl: string;
}) {
  const color = COLOR_MAP.get(work.colorFamily);
  const clean = (v?: string) =>
    v && !/^(undefined|null|none|n\/?a|unknown)$/i.test(v.trim()) ? v : "";
  const rows: { label: string; value: string; copy?: string }[] = [];
  if (model) rows.push({ label: "模型", value: model.name });
  if (clean(work.params.sampler)) rows.push({ label: "采样器", value: clean(work.params.sampler) });
  if (work.params.steps) rows.push({ label: "步数", value: String(work.params.steps) });
  if (work.params.cfg != null) rows.push({ label: "CFG", value: String(work.params.cfg) });
  if (clean(work.params.seed))
    rows.push({ label: "种子", value: clean(work.params.seed)!, copy: clean(work.params.seed)! });
  rows.push({ label: "尺寸", value: clean(work.params.size) || `${work.width} × ${work.height}` });
  if (work.params.clipSkip) rows.push({ label: "Clip skip", value: String(work.params.clipSkip) });
  if (work.params.denoise != null) rows.push({ label: "重绘", value: String(work.params.denoise) });
  rows.push({ label: "入库", value: formatDate(work.createdAt) });

  return (
    <aside className="dossier">
      <span className="dossier__cut" aria-hidden="true" />
      <header className="dossier__head">
        <div className="dossier__kicker">
          <span className="mono">DOSSIER / 作品档案</span>
          <span className="mono">{formatDate(work.createdAt)}</span>
        </div>
        <h1>{work.title}</h1>
        <div className="dossier__by">
          <span className="dossier__avatar">{work.author.slice(0, 1).toUpperCase()}</span>
          <div className="dossier__author">
            <b>{work.author}</b>
            {work.authorUrl ? (
              <a href={work.authorUrl} target="_blank" rel="noreferrer">
                创作者主页 <ArrowUpRight />
              </a>
            ) : (
              <span>本站创作者</span>
            )}
          </div>
          {model && (
            <Link className="dossier__model" href={`/models/${model.id}`}>
              {model.code}
              <i />
            </Link>
          )}
        </div>
        <div className="dossier__stats">
          <span>
            <EyeIcon />
            <b>{formatCount(work.stats.views)}</b>
            浏览
          </span>
          <span>
            <HeartIcon />
            <b>{formatCount(work.stats.likes)}</b>
            喜欢
          </span>
          <span>
            <StarIcon />
            <b>{formatCount(work.stats.favorites)}</b>
            收藏
          </span>
          <span>
            <DownloadIcon />
            <b>{formatCount(work.stats.downloads)}</b>
            下载
          </span>
        </div>
      </header>

      <PromptCard work={work} />

      <section className="dossier__section">
        <h3>
          <span className="mono">PARAMETERS</span> 生成参数
        </h3>
        <dl className="param-grid">
          {rows.map((row) => (
            <div key={row.label} className="param-row">
              <dt>{row.label}</dt>
              <dd>
                {row.copy ? (
                  <span className="param-copy">
                    <span className="mono">{row.value}</span>
                    <CopyButton text={row.copy} label="复制" compact className="param-copy__btn" />
                  </span>
                ) : row.label === "模型" && model ? (
                  <Link href={`/models/${model.id}`}>{row.value}</Link>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {(characters.length > 0 || tags.length > 0) && (
        <section className="dossier__section">
          <h3>
            <span className="mono">SUBJECT / 索引</span> 角色与标签
          </h3>
          <div className="dossier__tags">
            {characters.map((c) => (
              <Link key={c.id} href={`/characters/${c.id}`} className="char-chip">
                <i />
                {c.name}
                <em>{c.series}</em>
              </Link>
            ))}
            {tags.map((t) => (
              <Link key={t.id} href={`/?tags=${t.id}`} className="tag-chip">
                <TagIcon />
                {t.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="dossier__section">
        <h3>
          <span className="mono">PALETTE</span> 主色调
          <Link className="dossier__color-link" href={`/?color=${work.colorFamily}`}>
            {color?.name || work.colorFamily} <ArrowUpRight />
          </Link>
        </h3>
        <div className="palette-row">
          {work.palette.map((hex, i) => (
            <span key={`${hex}-${i}`} className="palette-chip" title={hex}>
              <i style={{ background: hex }} />
              <em className="mono">{hex.replace("#", "").toUpperCase()}</em>
            </span>
          ))}
        </div>
      </section>

      <div className="dossier__actions">
        <LikeButton id={work.id} initial={work.stats.likes} />
        <a className="btn btn--paper btn--lg" href={`/api/works/${work.id}/download`}>
          <DownloadIcon /> 下载原图
        </a>
      </div>
      <ShareRow url={shareUrl} title={`${work.title} · 幻绘`} />

      <footer className="dossier__source">
        <span className="mono">来源 / {work.sourceName}</span>
        {work.sourceUrl && work.sourceUrl.startsWith("http") && (
          <a href={work.sourceUrl} target="_blank" rel="noreferrer">
            原始发布 <ArrowUpRight />
          </a>
        )}
      </footer>
    </aside>
  );
}
