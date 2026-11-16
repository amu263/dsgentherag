import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  if (!/^[a-zA-Z0-9._-]+\.webp$/.test(file)) {
    return new Response("Not found", { status: 404 });
  }
  const full = path.join(process.cwd(), "public", "media", "uploads", file);
  try {
    const buf = await fs.readFile(full);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
