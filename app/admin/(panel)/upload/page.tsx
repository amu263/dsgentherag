import type { Metadata } from "next";
import Uploader from "@/components/admin/Uploader";
import { loadDB } from "@/lib/store";

export const metadata: Metadata = { title: "批量入库", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function UploadPage() {
  const db = loadDB();
  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <span className="eyebrow">CONTROL ROOM / 02</span>
          <h1>批量入库</h1>
          <p>拖入原图，自动读取生成参数；确认后一次写入档案。</p>
        </div>
      </header>
      <Uploader
        models={[...db.models].sort((a, b) => a.order - b.order).map((m) => ({ id: m.id, name: m.name }))}
        tagNames={db.tags.map((t) => t.name)}
        characterNames={db.characters.map((c) => c.name)}
      />
    </div>
  );
}
