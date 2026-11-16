import Link from "next/link";
import { SITE } from "@/lib/taxonomy";

export default function SiteFooter({ works }: { works: number }) {
  return (
    <footer className="site-foot">
      <div className="site-foot__top">
        <div>
          <div className="foot-brand">
            幻绘 <i>PHANTOM ARCHIVE</i>
          </div>
          <p className="foot-slogan">图和提示词，一起收好。</p>
        </div>
        <div className="foot-links">
          {SITE.nav.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label} / {n.en}
            </Link>
          ))}
          <Link href="/tags">标签索引</Link>
        </div>
        <div className="foot-count">
          <b>{String(works).padStart(3, "0")}</b>
          <span>WORKS ON FILE</span>
        </div>
      </div>
      <div className="site-foot__bottom">
        <span>© 2026 幻绘 · 作品版权归创作者所有</span>
        <span className="barcode" aria-hidden="true" />
        <span>VOL. 01 / NEW ERIDU</span>
      </div>
    </footer>
  );
}
