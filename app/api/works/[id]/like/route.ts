import { updateDB } from "@/lib/store";
import { findWork } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let action = "like";
  try {
    const body = (await request.json()) as { action?: string };
    if (body?.action === "unlike") action = "unlike";
  } catch {
    /* default like */
  }
  const db = updateDB((db) => {
    const work = findWork(db, id);
    if (!work) return;
    work.stats.likes = Math.max(0, work.stats.likes + (action === "like" ? 1 : -1));
  });
  const work = findWork(db, id);
  if (!work) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ likes: work.stats.likes });
}
