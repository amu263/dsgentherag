import type { MetadataRoute } from "next";
import { loadDB } from "@/lib/store";

export const dynamic = "force-dynamic";

const BASE = process.env.SITE_URL || "http://127.0.0.1:3210";

export default function sitemap(): MetadataRoute.Sitemap {
  const db = loadDB();
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/models`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/characters`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/tags`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...db.models.map((m) => ({
      url: `${BASE}/models/${m.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...db.characters.map((c) => ({
      url: `${BASE}/characters/${c.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...db.works.map((w) => ({
      url: `${BASE}/p/${w.id}`,
      lastModified: new Date(w.createdAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
  return urls;
}
