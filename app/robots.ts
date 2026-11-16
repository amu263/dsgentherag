import type { MetadataRoute } from "next";

const BASE = process.env.SITE_URL || "http://127.0.0.1:3210";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/admin"] }],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
