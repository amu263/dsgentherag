import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import type { ColorFamily } from "./types";

export interface ImageAnalysis {
  width: number;
  height: number;
  palette: string[];
  dominant: string;
  colorFamily: ColorFamily;
  blur: string;
}

export interface VariantResult extends ImageAnalysis {
  src: string;
  thumb: string;
}

/** Write display + thumb variants and analyse the image. */
export async function writeImageVariants(
  buf: Buffer,
  dir: string,
  baseName: string,
  publicPrefix: string,
): Promise<VariantResult> {
  await fs.mkdir(dir, { recursive: true });
  const rotated = sharp(buf, { failOn: "none" }).rotate();
  const displayPath = path.join(dir, `${baseName}.webp`);
  const thumbPath = path.join(dir, `${baseName}-thumb.webp`);

  const info = await rotated
    .clone()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86, effort: 4 })
    .toFile(displayPath);

  await rotated
    .clone()
    .resize({ width: 720, height: 720, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78, effort: 4 })
    .toFile(thumbPath);

  const analysis = await analyseFile(displayPath);
  return {
    width: info.width,
    height: info.height,
    ...analysis,
    src: `${publicPrefix}/${baseName}.webp`,
    thumb: `${publicPrefix}/${baseName}-thumb.webp`,
  };
}

export async function analyseFile(
  file: string,
): Promise<Omit<ImageAnalysis, "src" | "thumb" | "width" | "height">> {
  const { data } = await sharp(file)
    .resize(64, 64, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const counts = new Map<number, number>();
  const hueWeight = new Array(24).fill(0);
  let pixels = 0;
  for (let i = 0; i + 2 < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const qr = Math.round(r / 24);
    const qg = Math.round(g / 24);
    const qb = Math.round(b / 24);
    const key = (qr << 16) | (qg << 8) | qb;
    counts.set(key, (counts.get(key) || 0) + 1);
    pixels++;

    const { h, s, l } = rgbToHsl(r, g, b);
    if (s > 0.12 && l > 0.08 && l < 0.96) {
      const bin = Math.min(23, Math.floor(h / 15));
      hueWeight[bin] += 0.2 + s * (0.4 + 0.4 * (1 - Math.abs(l - 0.55) * 2));
    }
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const palette: string[] = [];
  for (const [key, count] of sorted) {
    if (count / pixels < 0.012) continue;
    const hex = quantToHex(key);
    if (palette.some((p) => colorDistance(p, hex) < 42)) continue;
    palette.push(hex);
    if (palette.length >= 5) break;
  }
  if (!palette.length) palette.push("#1a1a1a");

  let best = -1;
  let bestVal = 0;
  for (let i = 0; i < 24; i++) {
    if (hueWeight[i] > bestVal) {
      bestVal = hueWeight[i];
      best = i;
    }
  }

  let colorFamily: ColorFamily = "mono";
  if (best >= 0 && bestVal > pixels * 0.01) {
    const hue = best * 15 + 7.5;
    colorFamily = hueToFamily(hue);
    if (colorFamily === "orange" && bestVal < pixels * 0.06) colorFamily = "earth";
  }

  const dominant = chooseDominant(palette, colorFamily);
  const blur = await makeBlur(file);
  return { palette, dominant, colorFamily, blur };
}

async function makeBlur(file: string): Promise<string> {
  const buf = await sharp(file).resize(20, 20, { fit: "inside" }).webp({ quality: 28 }).toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

function quantToHex(key: number): string {
  const r = ((key >> 16) & 255) * 24;
  const g = ((key >> 8) & 255) * 24;
  const b = (key & 255) * 24;
  return "#" + [r, g, b].map((v) => Math.min(255, v).toString(16).padStart(2, "0")).join("");
}

function chooseDominant(palette: string[], family: ColorFamily): string {
  const target = familyHex(family);
  let best = palette[0] || "#1a1a1a";
  let bestScore = Infinity;
  for (const hex of palette) {
    if (hex === "#000000" || hex === "#ffffff") continue;
    const d = colorDistance(hex, target) * 0.6 + luminance(hex) * 10;
    if (d < bestScore) {
      bestScore = d;
      best = hex;
    }
  }
  return best;
}

function familyHex(f: ColorFamily): string {
  const map: Record<ColorFamily, string> = {
    red: "#e0362c",
    orange: "#f08321",
    yellow: "#e6d21f",
    green: "#58a04a",
    cyan: "#29bfc4",
    blue: "#2b5cd9",
    purple: "#8a5cd9",
    pink: "#e86ba4",
    earth: "#8a6a4a",
    mono: "#cfcfcf",
  };
  return map[f];
}

function hueToFamily(h: number): ColorFamily {
  if (h < 15 || h >= 345) return "red";
  if (h < 42) return "orange";
  if (h < 68) return "yellow";
  if (h < 165) return "green";
  if (h < 197) return "cyan";
  if (h < 252) return "blue";
  if (h < 292) return "purple";
  return "pink";
}

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function hexToRgb(hex: string) {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

function colorDistance(a: string, b: string): number {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return Math.sqrt((ca.r - cb.r) ** 2 + (ca.g - cb.g) ** 2 + (ca.b - cb.b) ** 2);
}
