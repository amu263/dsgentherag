import { findWork, updateDB } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = updateDB((db) => {
    const work = findWork(db, id);
    if (work) work.stats.views += 1;
  });
  return Response.json({ views: findWork(db, id)?.stats.views ?? 0 });
}
