import { inflateSync } from "node:zlib";
import type { GenParams } from "./types";

export type MetaSource = "a1111" | "comfyui" | "novelai" | "custom" | "none";

export interface ParsedMeta {
  source: MetaSource;
  prompt: string;
  negativePrompt: string;
  params: GenParams;
  modelName: string;
  software: string;
  rawKeys: string[];
}

const EMPTY: ParsedMeta = {
  source: "none",
  prompt: "",
  negativePrompt: "",
  params: {},
  modelName: "",
  software: "",
  rawKeys: [],
};

/* -------------------------------------------------------------------------- */
/*  PNG text chunks                                                           */
/* -------------------------------------------------------------------------- */

export function readPngTextChunks(buf: Buffer): Record<string, string> {
  const out: Record<string, string> = {};
  if (buf.length < 16) return out;
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) return out;
  let off = 8;
  while (off + 12 <= buf.length) {
    const len = buf.readUInt32BE(off);
    if (len > buf.length - off - 12) break;
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    try {
      if (type === "tEXt") {
        const z = data.indexOf(0);
        if (z > 0) out[data.toString("latin1", 0, z).toLowerCase()] = data.toString("latin1", z + 1);
      } else if (type === "zTXt") {
        const z = data.indexOf(0);
        if (z > 0) {
          const key = data.toString("latin1", 0, z).toLowerCase();
          const text = inflateRaw(data.subarray(z + 2));
          if (text) out[key] = text;
        }
      } else if (type === "iTXt") {
        const z = data.indexOf(0);
        if (z > 0) {
          const key = data.toString("utf8", 0, z).toLowerCase();
          const compressed = data[z + 1] === 1;
          let p = z + 3;
          const langEnd = data.indexOf(0, p);
          p = langEnd + 1;
          const transEnd = data.indexOf(0, p);
          p = transEnd + 1;
          const body = data.subarray(p);
          const text = compressed ? inflateRaw(body) : body.toString("utf8");
          if (text) out[key] = text;
        }
      }
    } catch {
      /* skip malformed chunk */
    }
    off += 12 + len;
    if (type === "IEND") break;
  }
  return out;
}

function inflateRaw(data: Buffer): string {
  try {
    // PNG zTXt/iTXt use zlib (RFC 1950)
    return inflateSync(data).toString("utf8");
  } catch {
    return "";
  }
}

/* -------------------------------------------------------------------------- */
/*  A1111 / Forge / SD.Next parameter strings                                 */
/* -------------------------------------------------------------------------- */

const PARAM_KEYS = [
  "Steps",
  "Sampler",
  "Schedule type",
  "CFG scale",
  "Seed",
  "Size",
  "Model hash",
  "Model",
  "VAE",
  "VAE hash",
  "Clip skip",
  "Denoising strength",
  "Hires upscale",
  "Hires upscaler",
  "Hires steps",
  "Version",
  "Lora hashes",
  "TI hashes",
  "ADetailer model",
  "ADetailer prompt",
  "Face restoration",
];

export function parseA1111(text: string): ParsedMeta | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const looksLikeA1111 =
    /(^|\n)\s*Steps:\s*\d+/i.test(trimmed) ||
    /(^|\n)\s*Negative prompt:/i.test(trimmed) ||
    /(^|\n)\s*Sampler:\s*/i.test(trimmed);
  if (!looksLikeA1111) return null;

  let prompt = "";
  let negativePrompt = "";
  let paramLine = "";
  const negMatch = trimmed.match(/(?:^|\n)Negative prompt:\s*/i);
  if (negMatch && negMatch.index != null) {
    prompt = trimmed.slice(0, negMatch.index).trim();
    const after = trimmed.slice(negMatch.index + negMatch[0].length);
    const stepsIdx = after.search(/(?:^|\n)Steps:\s*\d+/i);
    if (stepsIdx >= 0) {
      negativePrompt = after.slice(0, stepsIdx).trim();
      paramLine = after.slice(stepsIdx).replace(/^\n+/, "");
    } else {
      negativePrompt = after.trim();
    }
  } else {
    const stepsIdx = trimmed.search(/(?:^|\n)Steps:\s*\d+/i);
    if (stepsIdx >= 0) {
      prompt = trimmed.slice(0, stepsIdx).trim();
      paramLine = trimmed.slice(stepsIdx).replace(/^\n+/, "");
    } else {
      prompt = trimmed;
    }
  }

  const params: GenParams = {};
  let modelName = "";
  if (paramLine) {
    const keyRe = new RegExp(`(?:^|,\\s*)(${PARAM_KEYS.map(escapeRe).join("|")}):\\s*`, "gi");
    const marks: { key: string; start: number; end: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = keyRe.exec(paramLine))) {
      marks.push({ key: m[1].toLowerCase(), start: m.index, end: keyRe.lastIndex });
    }
    for (let i = 0; i < marks.length; i++) {
      const value = paramLine
        .slice(marks[i].end, i + 1 < marks.length ? marks[i + 1].start : paramLine.length)
        .replace(/^[,\\s]+/, "")
        .replace(/[,\\s]+$/, "")
        .trim();
      const key = marks[i].key;
      if (key === "steps") params.steps = toNumber(value);
      else if (key === "sampler") params.sampler = value;
      else if (key === "cfg scale") params.cfg = toNumber(value);
      else if (key === "seed") params.seed = value.replace(/[^\d]/g, "") || value;
      else if (key === "size") params.size = value.replace(/\s/g, "");
      else if (key === "clip skip") params.clipSkip = toNumber(value);
      else if (key === "denoising strength") params.denoise = toNumber(value);
      else if (key === "model") modelName = value;
    }
  }
  return {
    source: "a1111",
    prompt,
    negativePrompt,
    params,
    modelName,
    software: "A1111",
    rawKeys: ["parameters"],
  };
}

/* -------------------------------------------------------------------------- */
/*  NovelAI                                                                   */
/* -------------------------------------------------------------------------- */

export function parseNovelAI(jsonText: string): ParsedMeta | null {
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(jsonText);
  } catch {
    return null;
  }
  if (!j || typeof j !== "object") return null;
  const p = typeof j.prompt === "string" ? j.prompt : "";
  const uc = typeof j.uc === "string" ? j.uc : typeof j.negative_prompt === "string" ? (j.negative_prompt as string) : "";
  if (!p && !uc && !j.steps) return null;
  const width = Number(j.width) || 0;
  const height = Number(j.height) || 0;
  return {
    source: "novelai",
    prompt: p,
    negativePrompt: uc,
    params: {
      steps: Number(j.steps) || undefined,
      sampler: typeof j.sampler === "string" ? j.sampler : undefined,
      cfg: Number(j.scale) || undefined,
      seed: j.seed != null ? String(j.seed) : undefined,
      size: width && height ? `${width}x${height}` : undefined,
    },
    modelName: typeof j.model === "string" ? j.model : "NovelAI",
    software: "NovelAI",
    rawKeys: ["Comment"],
  };
}

/* -------------------------------------------------------------------------- */
/*  ComfyUI                                                                   */
/* -------------------------------------------------------------------------- */

type ComfyNode = { class_type?: string; inputs?: Record<string, unknown>; _meta?: { title?: string } };

function resolveText(nodes: Record<string, ComfyNode>, value: unknown, depth = 0): string {
  if (depth > 8) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const [id] = value as [string, number];
    const node = nodes[id];
    if (!node) return "";
    const inp = node.inputs || {};
    if (typeof inp.text === "string") return inp.text;
    if (typeof inp.text_g === "string") return inp.text_g;
    if (inp.text) return resolveText(nodes, inp.text, depth + 1);
    if (inp.conditioning) return resolveText(nodes, inp.conditioning, depth + 1);
    if (inp.string) return resolveText(nodes, inp.string, depth + 1);
    if (inp.clip_l) return resolveText(nodes, inp.clip_l, depth + 1);
    return "";
  }
  return "";
}

function firstNode(nodes: Record<string, ComfyNode>, types: string[]): ComfyNode | null {
  for (const node of Object.values(nodes)) if (node.class_type && types.includes(node.class_type)) return node;
  return null;
}

export function parseComfyJSON(text: string): ParsedMeta | null {
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(text);
  } catch {
    return null;
  }
  if (!j || typeof j !== "object") return null;
  if (Array.isArray(j.nodes)) return parseComfyWorkflow(j as Record<string, unknown>);
  const nodes = j as Record<string, ComfyNode>;
  const hasComfy = Object.values(nodes).some(
    (n) => n && typeof n === "object" && typeof (n as ComfyNode).class_type === "string",
  );
  if (!hasComfy) return null;

  const sampler = firstNode(nodes, ["KSampler", "KSamplerAdvanced", "KSampler (Efficient)", "SamplerCustom", "SamplerCustomAdvanced"]);
  const positive = sampler?.inputs?.positive ? resolveText(nodes, sampler.inputs.positive) : "";
  const negative = sampler?.inputs?.negative ? resolveText(nodes, sampler.inputs.negative) : "";
  let prompt = positive;
  let negPrompt = negative;
  if (!prompt) {
    const clauses = Object.values(nodes).filter((n) => n.class_type === "CLIPTextEncode");
    prompt = clauses.map((n) => (typeof n.inputs?.text === "string" ? n.inputs.text : "")).filter(Boolean)[0] || "";
    negPrompt = negPrompt || clauses.map((n) => (typeof n.inputs?.text === "string" ? n.inputs.text : "")).filter(Boolean)[1] || "";
  }
  const latent = firstNode(nodes, ["EmptyLatentImage", "EmptySD3LatentImage", "EmptyLatentImageSDXL"]);
  const width = Number(latent?.inputs?.width) || 0;
  const height = Number(latent?.inputs?.height) || 0;
  const ckpt = firstNode(nodes, ["CheckpointLoaderSimple", "CheckpointLoader", "UNETLoader"]);
  const modelName =
    (typeof ckpt?.inputs?.ckpt_name === "string" && ckpt.inputs.ckpt_name) ||
    (typeof ckpt?.inputs?.unet_name === "string" && ckpt.inputs.unet_name) ||
    "";
  const steps = sampler?.inputs?.steps;
  const cfg = sampler?.inputs?.cfg;
  const seed = sampler?.inputs?.seed ?? sampler?.inputs?.noise_seed;
  const samplerName = sampler?.inputs?.sampler_name;
  return {
    source: "comfyui",
    prompt,
    negativePrompt: negPrompt,
    params: {
      steps: steps != null ? Number(steps) : undefined,
      cfg: cfg != null ? Number(cfg) : undefined,
      seed: seed != null ? String(seed) : undefined,
      sampler: typeof samplerName === "string" ? samplerName : undefined,
      size: width && height ? `${width}x${height}` : undefined,
      denoise: sampler?.inputs?.denoise != null ? Number(sampler.inputs.denoise) : undefined,
    },
    modelName,
    software: "ComfyUI",
    rawKeys: ["prompt"],
  };
}

function parseComfyWorkflow(j: Record<string, unknown>): ParsedMeta | null {
  const nodes = j.nodes as Array<Record<string, unknown>>;
  const byId = new Map<number, Record<string, unknown>>();
  for (const n of nodes) if (typeof n.id === "number") byId.set(n.id, n);
  const sampler = nodes.find((n) => String(n.type).includes("KSampler"));
  const widgets = (n: Record<string, unknown> | undefined) => (n?.widgets_values as unknown[]) || [];
  const textNodes = nodes.filter((n) => String(n.type).includes("CLIPTextEncode") || String(n.type).includes("TextEncode"));
  const prompt = typeof widgets(textNodes[0])[0] === "string" ? (widgets(textNodes[0])[0] as string) : "";
  const negative = typeof widgets(textNodes[1])[0] === "string" ? (widgets(textNodes[1])[0] as string) : "";
  const sw = widgets(sampler);
  return {
    source: "comfyui",
    prompt,
    negativePrompt: negative,
    params: {
      steps: typeof sw[2] === "number" ? sw[2] : undefined,
      cfg: typeof sw[3] === "number" ? sw[3] : undefined,
      sampler: typeof sw[4] === "string" ? sw[4] : undefined,
      seed: sw[0] != null ? String(sw[0]) : undefined,
    },
    modelName: "",
    software: "ComfyUI",
    rawKeys: ["workflow"],
  };
}

/* -------------------------------------------------------------------------- */
/*  Unified                                                                   */
/* -------------------------------------------------------------------------- */

export function parseMetadataText(text: string): ParsedMeta | null {
  if (!text) return null;
  return parseComfyJSON(text) || parseNovelAI(text) || parseA1111(text);
}

export async function parseImageMetadata(buf: Buffer): Promise<ParsedMeta> {
  const chunks = readPngTextChunks(buf);
  const keys = Object.keys(chunks);
  const candidates =
    chunks.parameters ||
    chunks.prompt ||
    chunks.workflow ||
    chunks.comment ||
    chunks.description ||
    "";
  if (candidates) {
    if (chunks.prompt && !chunks.parameters) {
      const comfy = parseComfyJSON(chunks.prompt);
      if (comfy) return { ...comfy, rawKeys: keys, software: comfy.software || "ComfyUI" };
    }
    if (chunks.workflow && !chunks.parameters && !chunks.prompt) {
      const flow = parseComfyJSON(chunks.workflow);
      if (flow) return { ...flow, rawKeys: keys };
    }
    const parsed = parseMetadataText(candidates);
    if (parsed) return { ...parsed, rawKeys: keys };
    if (chunks.comment) {
      const nai = parseNovelAI(chunks.comment);
      if (nai) return { ...nai, rawKeys: keys };
    }
  }

  // EXIF (JPEG / WebP / some PNGs)
  try {
    const exifr = (await import("exifr")).default;
    const exif = (await exifr.parse(buf, {
      userComment: true,
      xmp: true,
      tiff: true,
      exif: true,
    })) as Record<string, unknown> | undefined;
    if (exif) {
      const raw = [exif.UserComment, exif.userComment, exif.ImageDescription, exif.imageDescription, exif.description]
        .filter((v): v is string => typeof v === "string" && v.length > 12)
        .map((v) => v.replace(/^UNICODE\0?/, "").replace(/^ASCII\0?/, ""))
        .join("\n");
      const parsed = parseMetadataText(raw);
      if (parsed) return { ...parsed, source: parsed.source === "none" ? "a1111" : parsed.source, rawKeys: ["EXIF"] };
      if (raw.trim()) {
        return {
          ...EMPTY,
          source: "custom",
          prompt: raw.trim(),
          rawKeys: ["EXIF"],
          software: "EXIF",
        };
      }
    }
  } catch {
    /* no exif */
  }

  return { ...EMPTY };
}

function toNumber(v: string): number | undefined {
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
