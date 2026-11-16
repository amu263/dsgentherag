import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import WorkEditor from "@/components/admin/WorkEditor";
import { findWork, loadDB } from "@/lib/store";

export const metadata: Metadata = { title: "编辑作品", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = loadDB();
  const work = findWork(db, id);
  if (!work) notFound();

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <Link href="/admin/works" className="back-link" style={{ color: "#55514a" }}>
            ← 作品管理
          </Link>
          <h1 style={{ marginTop: 8 }}>{work.title}</h1>
          <p className="mono">{work.id}</p>
        </div>
      </header>
      <WorkEditor
        work={work}
        tags={db.tags.map((t) => ({ id: t.id, name: t.name }))}
        characters={db.characters.map((c) => ({ id: c.id, name: c.name }))}
        models={db.models.map((m) => ({ id: m.id, name: m.name }))}
      />
    </div>
  );
}
