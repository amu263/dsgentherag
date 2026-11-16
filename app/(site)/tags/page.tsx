import Link from "next/link";
import type { Metadata } from "next";
import { loadDB } from "@/lib/store";
import { facets } from "@/lib/query";
import { TAG_GROUPS } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "标签",
  description: "按标签翻阅 AI 生图档案：风格、场景、服饰、构图、光影、题材与色调。",
};

export default async function TagsPage() {
  const db = loadDB();
  const counts = facets(db);
  const groups = TAG_GROUPS.map((group) => ({
    group,
    tags: db.tags
      .filter((t) => t.group === group)
      .map((t) => ({ ...t, count: counts.tagCounts.get(t.id) || 0 }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count),
  })).filter((g) => g.tags.length);

  return (
    <div className="archive-page">
      <header className="archive-head">
        <div className="archive-head__ghost" aria-hidden="true">
          TAGS
        </div>
        <div className="archive-head__inner">
          <div>
            <div className="eyebrow">04 / TAGS · 索引</div>
            <h1>标签</h1>
            <p className="archive-head__desc">
              风格、场景、服饰、构图、光影、题材、色调。点一个，所有相关的图都会浮上来。
            </p>
          </div>
          <div className="archive-head__side">
            <b>{String(db.tags.length).padStart(2, "0")}</b>
            <span>TAGS ON FILE</span>
            <span>{groups.length} GROUPS</span>
          </div>
        </div>
      </header>

      <div className="tag-board">
        <div className="tag-board__intro">
          <h2>从哪个词开始？</h2>
          <p>
            多选标签会取交集；再叠加角色、模型或主色调，就能把范围收窄到一张具体的图。
          </p>
          <Link href="/" className="btn btn--accent" style={{ marginTop: 18 }}>
            回到发现页
          </Link>
        </div>

        <div className="tag-board__groups">
          {groups.map((g, i) => (
            <section key={g.group} className="tag-group">
              <div className="tag-group__head">
                <b>{g.group}</b>
                <span>{String(i + 1).padStart(2, "0")} / {String(groups.length).padStart(2, "0")}</span>
                <span>{g.tags.length} ITEMS</span>
              </div>
              <div className="tag-group__list">
                {g.tags.map((t) => (
                  <Link key={t.id} href={`/?tags=${t.id}`} className="tag-big">
                    {t.name}
                    <b>{t.count}</b>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
