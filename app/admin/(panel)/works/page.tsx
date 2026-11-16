import type { Metadata } from "next";
import Link from "next/link";
import WorksTable from "@/components/admin/WorksTable";
import { loadDB } from "@/lib/store";
import { buildHaystack } from "@/lib/query";
import { formatCount } from "@/lib/format";
import { ArrowRight, SearchIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "作品管理", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const PAGE = 20;

export default async function AdminWorksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";
  const q = one(params.q).trim().toLowerCase();
  const model = one(params.model);
  const page = Math.max(1, Number(one(params.page)) || 1);
  const db = loadDB();

  let list = [...db.works].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (model) list = list.filter((w) => w.modelId === model);
  if (q) {
    list = list.filter((w) => buildHaystack(db, w).includes(q));
  }
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const items = list.slice((page - 1) * PAGE, page * PAGE);
  const views = db.works.reduce((s, w) => s + w.stats.views, 0);

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (model) sp.set("model", model);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/admin/works${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <span className="eyebrow">CONTROL ROOM / 03</span>
          <h1>作品管理</h1>
          <p>
            {db.works.length} 件作品 · 累计 {formatCount(views)} 次浏览
          </p>
        </div>
        <div className="admin-page__actions">
          <Link href="/admin/upload" className="btn btn--paper">
            批量入库 <ArrowRight />
          </Link>
        </div>
      </header>

      <form className="admin-filter" action="/admin/works" method="get">
        <label className="admin-search">
          <SearchIcon />
          <input name="q" defaultValue={q} placeholder="搜标题、提示词、作者、标签" />
        </label>
        <select name="model" defaultValue={model}>
          <option value="">全部模型</option>
          {db.models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn--paper">
          筛选
        </button>
        {(q || model) && (
          <Link href="/admin/works" className="admin-filter__reset">
            清除
          </Link>
        )}
        <span className="admin-filter__count mono">{total} 条</span>
      </form>

      <WorksTable works={items} />

      {pages > 1 && (
        <div className="admin-pager">
          {page > 1 ? <Link href={pageHref(page - 1)}>← 上一页</Link> : <span>← 上一页</span>}
          <span className="mono">
            {page} / {pages}
          </span>
          {page < pages ? <Link href={pageHref(page + 1)}>下一页 →</Link> : <span>下一页 →</span>}
        </div>
      )}
    </div>
  );
}
