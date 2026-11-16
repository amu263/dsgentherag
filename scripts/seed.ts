import fs from "node:fs/promises";
import path from "node:path";
import { analyseFile, writeImageVariants } from "../lib/palette";
import sharp from "sharp";
import { saveDB } from "../lib/store";
import type { DB, Work } from "../lib/types";

interface ManifestWork {
  slug: string;
  title: string;
  modelId: string;
  modelLabel: string;
  modelShort: string;
  colorFamily?: string;
  tags: string[];
  characters: string[];
  featured: number;
  promptPublic: boolean;
  note: string;
  civitaiId?: number;
  imageUrl?: string;
  localSource?: string;
  width: number;
  height: number;
  prompt: string;
  negativePrompt: string;
  params: Work["params"];
  author: string;
  authorUrl: string;
  sourceName: string;
  sourceUrl: string;
  createdAt: string;
  stats: Work["stats"];
}

interface Manifest {
  works: ManifestWork[];
  models: DB["models"];
  characters: DB["characters"];
  tags: DB["tags"];
}

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

async function fetchImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "image/*" }, redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const type = res.headers.get("content-type") || "";
  if (!type.startsWith("image/")) throw new Error(`not image: ${type} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function main() {
  const manifest = JSON.parse(
    await fs.readFile(path.join(process.cwd(), "scripts", "seed-manifest.json"), "utf8"),
  ) as Manifest;

  const dir = path.join(process.cwd(), "public", "media", "seed");
  await fs.mkdir(dir, { recursive: true });

  const clean = (v: unknown) =>
    typeof v === "string" && /^(undefined|null|none|n\/?a|unknown)$/i.test(v.trim()) ? undefined : v;
  const works: Work[] = [];
  for (let i = 0; i < manifest.works.length; i++) {
    const mw = manifest.works[i];
    const displayPath = path.join(dir, `${mw.slug}.webp`);
    const thumbPath = path.join(dir, `${mw.slug}-thumb.webp`);
    try {
      let variant: Awaited<ReturnType<typeof writeImageVariants>>;
      const exists = await fs
        .access(displayPath)
        .then(() => fs.access(thumbPath))
        .then(() => true)
        .catch(() => false);
      if (exists) {
        const meta = await sharp(displayPath).metadata();
        const analysis = await analyseFile(displayPath);
        variant = {
          ...analysis,
          width: meta.width || mw.width,
          height: meta.height || mw.height,
          src: `/media/seed/${mw.slug}.webp`,
          thumb: `/media/seed/${mw.slug}-thumb.webp`,
        };
      } else {
        const buf = mw.localSource
          ? await fs.readFile(path.join(process.cwd(), mw.localSource))
          : await fetchImage(mw.imageUrl!);
        variant = await writeImageVariants(buf, dir, mw.slug, "/media/seed");
      }
      const work: Work = {
        id: mw.slug,
        title: mw.title,
        prompt: mw.prompt,
        negativePrompt: mw.negativePrompt,
        promptPublic: mw.promptPublic,
        note: mw.note,
        modelId: mw.modelId,
        modelLabel: mw.modelLabel,
        modelShort: mw.modelShort,
        params: {
          steps: typeof mw.params.steps === "number" ? mw.params.steps : undefined,
          sampler: clean(mw.params.sampler) as string | undefined,
          cfg: typeof mw.params.cfg === "number" ? mw.params.cfg : undefined,
          seed: clean(mw.params.seed) as string | undefined,
          size: clean(mw.params.size) as string | undefined,
          clipSkip: typeof mw.params.clipSkip === "number" ? mw.params.clipSkip : undefined,
          denoise: typeof mw.params.denoise === "number" ? mw.params.denoise : undefined,
        },
        tags: mw.tags,
        characters: mw.characters,
        colorFamily: (mw.colorFamily as Work["colorFamily"]) || variant.colorFamily,
        palette: variant.palette,
        width: variant.width,
        height: variant.height,
        src: variant.src,
        thumb: variant.thumb,
        dominant: variant.dominant,
        blur: variant.blur,
        author: mw.author,
        authorUrl: mw.authorUrl,
        sourceName: mw.sourceName,
        sourceUrl: mw.sourceUrl,
        stats: mw.stats,
        createdAt: mw.createdAt,
        featured: mw.featured,
        nsfw: false,
      };
      works.push(work);
      console.log(`[${i + 1}/${manifest.works.length}] ${mw.slug} ${variant.width}x${variant.height} ${variant.colorFamily}`);
    } catch (err) {
      console.error(`FAIL ${mw.slug}:`, (err as Error).message);
    }
  }

  const db: DB = {
    version: 1,
    updatedAt: new Date().toISOString(),
    works,
    models: manifest.models,
    characters: manifest.characters,
    tags: manifest.tags,
  };
  saveDB(db);
  console.log(`DB written: ${works.length} works, ${manifest.models.length} models`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
