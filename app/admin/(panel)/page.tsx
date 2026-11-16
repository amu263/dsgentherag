import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { loadDB } from "@/lib/store";
import { facets, sortWorks } from "@/lib/query";
import { formatCount, formatDate } from "@/lib/format";
import { ArrowRight, ArrowUpRight, DownloadIcon, EyeIcon, HeartIcon, ImageIcon, UploadIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "控制台", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminHome() {
  const db = loadDB();
  const counts = facets(db);
  const views = db.works.reduce((s, w) => s + w.stats.views, 0);
  const likes = db.works.reduce((s, w) => s + w.stats.likes, 0);
  const downloads = db.works.reduce((s, w) => s + w.stats.downloads, 0);
  const recent = sortWorks(db.works, "latest").slice(0, 6);
  const privateCount = db.works.filter((w) => !w.promptPublic).length;
  const featured = db.works.filter((w) => w.featured > 0).length;
  const modelRows = [...db.models]
    .map((m) => ({ name: m.name, count: counts.modelCounts.get(m.id) || 0 }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxModel = Math.max(1, ...modelRows.map((m) => m.count));

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <span className="eyebrow">CONTROL ROOM / 01</span>
          <h1>总览</h1>
          <p>{formatDate(db.updatedAt)} 更新 · 共 {db.works.length} 件作品在线</p>
        </div>
        <div className="admin-page__actions">
          <Link href="/admin/upload" className="btn btn--paper">
            <UploadIcon /> 批量入库
          </Link>
          <Link href="/admin/works" className="btn btn--line-paper">
            作品管理 <ArrowRight />
          </Link>
        </div>
      </header>

      <div className="admin-stats">
        <div className="stat">
          <span className="stat__icon"><ImageIcon /></span>
          <b>{formatCount(db.works.length)}</b>
          <span className="stat__label">作品</span>
          <em className="mono">WORKS</em>
        </div>
        <div className="stat">
          <span className="stat__icon"><EyeIcon /></span>
          <b>{formatCount(views)}</b>
          <span className="stat__label">浏览</span>
          <em className="mono">VIEWS</em>
        </div>
        <div className="stat">
          <span className="stat__icon"><HeartIcon /></span>
          <b>{formatCount(likes)}</b>
          <span className="stat__label">喜欢</span>
          <em className="mono">LIKES</em>
        </div>
        <div className="stat">
          <span className="stat__icon"><DownloadIcon /></span>
          <b>{formatCount(downloads)}</b>
          <span className="stat__label">下载</span>
          <em className="mono">DOWNLOADS</em>
        </div>
      </div>

      <div className="admin-cols">
        <section className="admin-panel admin-panel--wide">
          <div className="admin-panel__head">
            <h2>最近入库</h2>
            <Link href="/admin/works">全部 <ArrowUpRight /></Link>
          </div>
          <div className="recent-list">
            {recent.map((w) => (
              <Link key={w.id} href={`/admin/works/${w.id}`} className="recent-row">
                <Image src={w.thumb} alt="" width={54} height={54} style={{ objectFit: "cover" }} />
                <span className="recent-row__main">
                  <b>{w.title}</b>
                  <i>{w.modelShort} · {w.author}</i>
                </span>
                <span className="recent-row__meta mono">{formatDate(w.createdAt)}</span>
                <span className="recent-row__meta mono">♥ {formatCount(w.stats.likes)}</span>
                <ArrowUpRight />
              </Link>
            ))}
          </div>
        </section>

        <div className="admin-side-col">
          <section className="admin-panel">
            <div className="admin-panel__head">
              <h2>模型分布</h2>
              <span className="mono">{modelRows.length} FAMILIES</span>
            </div>
            <div className="model-bars">
              {modelRows.map((m) => (
                <div key={m.name} className="model-bar">
                  <span>{m.name}</span>
                  <i style={{ width: `${(m.count / maxModel) * 100}%` }} />
                  <b>{m.count}</b>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel__head">
              <h2>内容状态</h2>
            </div>
            <div className="admin-mini">
              <div>
                <b>{privateCount}</b>
                <span>件未公开提示词</span>
              </div>
              <div>
                <b>{featured}</b>
                <span>件站长精选</span>
              </div>
              <div>
                <b>{db.models.length}</b>
                <span>个模型</span>
              </div>
              <div>
                <b>{db.tags.length}</b>
                <span>个标签</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
