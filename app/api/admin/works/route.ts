import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { updateDB } from "@/lib/store";
import { createWork, type WorkInput } from "@/lib/adminWork";
import type { Work } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  let body: { items?: WorkInput[] };
  try {
    body = (await request.json()) as { items?: WorkInput[] };
  } catch {
    return NextResponse.json({ error: "请求格式不对" }, { status: 400 });
  }
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return NextResponse.json({ error: "没有要发布的条目" }, { status: 400 });
  if (items.length > 60) return NextResponse.json({ error: "一次最多 60 件" }, { status: 400 });

  const created: { id: string; title: string }[] = [];
  updateDB((db) => {
    for (const item of items) {
      if (!item.src || !item.src.startsWith("/api/uploads/")) continue;
      if (db.works.some((w) => w.src === item.src)) continue;
      const work: Work = createWork(db, item);
      db.works.unshift(work);
      created.push({ id: work.id, title: work.title });
    }
  });

  return NextResponse.json({ ok: true, created });
}
