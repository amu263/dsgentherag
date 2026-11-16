import path from "node:path";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { loadDB } from "@/lib/store";
import { parseImageMetadata } from "@/lib/metadata";
import { writeImageVariants } from "@/lib/palette";
import { shortId } from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const MAX = 40 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "没有收到文件" }, { status: 400 });
  }
  if (file.size > MAX) {
    return NextResponse.json({ error: "单张不能超过 40MB" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (!buf.length) return NextResponse.json({ error: "空文件" }, { status: 400 });

  const meta = await parseImageMetadata(buf);
  const id = `u-${Date.now().toString(36)}-${shortId(6)}`;
  try {
    const variant = await writeImageVariants(
      buf,
      path.join(process.cwd(), "public", "media", "uploads"),
      id,
      "/api/uploads",
    );

    const db = loadDB();
    const needle = meta.modelName.toLowerCase();
    const match =
      db.models.find((m) => {
        if (!needle) return false;
        const name = m.name.toLowerCase();
        const en = m.en.toLowerCase();
        if (name === needle || en === needle || needle.includes(name) || name.includes(needle)) {
          return true;
        }
        const aliases = `${m.en} ${m.name} ${m.code}`
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((t) => t.length >= 3);
        return aliases.some((a) => needle.includes(a));
      }) || null;

    return NextResponse.json({
      id,
      fileName: file.name,
      src: variant.src,
      thumb: variant.thumb,
      width: variant.width,
      height: variant.height,
      palette: variant.palette,
      dominant: variant.dominant,
      colorFamily: variant.colorFamily,
      blur: variant.blur,
      parsed: {
        source: meta.source,
        prompt: meta.prompt,
        negativePrompt: meta.negativePrompt,
        params: meta.params,
        modelName: meta.modelName,
        software: meta.software,
      },
      suggestedModelId: match?.id || "",
    });
  } catch {
    return NextResponse.json({ error: "这个文件读不出图像，换一张试试" }, { status: 400 });
  }
}
