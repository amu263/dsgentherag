import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { findWork, updateDB } from "@/lib/store";
import { applyWorkInput, type WorkInput } from "@/lib/adminWork";
import { mediaFilePath } from "@/lib/media";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  let body: WorkInput;
  try {
    body = (await request.json()) as WorkInput;
  } catch {
    return NextResponse.json({ error: "请求格式不对" }, { status: 400 });
  }
  let ok = false;
  updateDB((db) => {
    const work = findWork(db, id);
    if (!work) return;
    applyWorkInput(db, work, body);
    ok = true;
  });
  if (!ok) return NextResponse.json({ error: "作品不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const removed: { src: string | null } = { src: null };
  updateDB((db) => {
    const idx = db.works.findIndex((w) => w.id === id);
    if (idx === -1) return;
    removed.src = db.works[idx].src;
    db.works.splice(idx, 1);
  });
  if (removed.src) {
    const original = mediaFilePath(removed.src);
    const thumbSrc = removed.src.replace(/\.webp$/, "-thumb.webp");
    const thumb = mediaFilePath(thumbSrc);
    for (const file of [original, thumb]) {
      if (!file) continue;
      await fs.unlink(file).catch(() => {});
    }
  }
  return NextResponse.json({ ok: true });
}
