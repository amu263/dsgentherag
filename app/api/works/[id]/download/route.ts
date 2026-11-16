import fs from "node:fs/promises";
import path from "node:path";
import { findWork, updateDB } from "@/lib/store";
import { mediaFilePath } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = updateDB((db) => {
    const work = findWork(db, id);
    if (work) work.stats.downloads += 1;
  });
  const work = findWork(db, id);
  if (!work) return new Response("Not found", { status: 404 });

  const file = mediaFilePath(work.src) || path.join(process.cwd(), "public", work.src.replace(/^\//, ""));
  try {
    const buf = await fs.readFile(file);
    const name = `${work.title.replace(/[\\/:*?"<>|]/g, "")}.webp`;
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
