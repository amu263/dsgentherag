import path from "node:path";

export const UPLOAD_URL_PREFIX = "/api/uploads/";

/** Resolve a work media URL to an on-disk file (uploads live outside Next's static snapshot). */
export function mediaFilePath(src: string): string | null {
  if (!src) return null;
  if (src.startsWith(UPLOAD_URL_PREFIX)) {
    const file = src.slice(UPLOAD_URL_PREFIX.length);
    if (!/^[a-zA-Z0-9._-]+\.webp$/.test(file)) return null;
    return path.join(process.cwd(), "public", "media", "uploads", file);
  }
  if (src.startsWith("/media/seed/")) {
    const file = src.slice("/media/seed/".length);
    if (!/^[a-zA-Z0-9._-]+\.webp$/.test(file)) return null;
    return path.join(process.cwd(), "public", "media", "seed", file);
  }
  return null;
}
