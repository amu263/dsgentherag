import { loadDB } from "@/lib/store";
import { normalizeQuery, runQuery } from "@/lib/query";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = normalizeQuery(Object.fromEntries(url.searchParams.entries()));
  const result = runQuery(loadDB(), q);
  return Response.json(result);
}
