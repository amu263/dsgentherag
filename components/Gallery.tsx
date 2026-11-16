"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Work } from "@/lib/types";
import Masonry from "./Masonry";
import { ArrowDown, ArrowRight, ShuffleIcon } from "./Icons";

export default function Gallery({
  initial,
  total,
  queryString = "",
  heading,
  emptyTitle = "这片档案还是空的",
  emptyHint = "换一组筛选条件，或者回到全部作品。",
  showEmptyClear = true,
}: {
  initial: Work[];
  total: number;
  queryString?: string;
  heading?: string;
  emptyTitle?: string;
  emptyHint?: string;
  showEmptyClear?: boolean;
}) {
  const [items, setItems] = useState<Work[]>(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initial.length < total);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(initial);
    setPage(1);
    setHasMore(initial.length < total);
  }, [initial, total]);

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const p = new URLSearchParams(queryString);
      p.set("page", String(page + 1));
      const res = await fetch(`/api/works?${p.toString()}`);
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as { items: Work[]; hasMore: boolean };
      setItems((prev) => [...prev, ...data.items]);
      setPage((v) => v + 1);
      setHasMore(data.hasMore);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, page, queryString]);

  if (!initial.length) {
    return (
      <div className="empty">
        <div className="empty__mark">∅</div>
        <h3>{emptyTitle}</h3>
        <p>{emptyHint}</p>
        {showEmptyClear && (
          <Link className="btn btn--accent" href="/">
            回到全部作品 <ArrowRight />
          </Link>
        )}
      </div>
    );
  }

  const percent = total > 0 ? Math.min(100, (items.length / total) * 100) : 0;

  return (
    <>
      {heading && (
        <div className="gallery-head">
          <h2>{heading}</h2>
          <span className="mono">
            {items.length} / {total} ON FILE
          </span>
        </div>
      )}
      <Masonry items={items} />
      <div className="gallery-status">
        {hasMore ? (
          <>
            <button type="button" className="load-more" onClick={loadMore} disabled={loading}>
              {loading ? "读取中" : "继续翻档案"}
              {loading ? <ShuffleIcon /> : <ArrowDown />}
            </button>
            <div className="progress-line" aria-hidden="true">
              <i style={{ width: `${percent}%` }} />
            </div>
            <span className="mono">
              {items.length} / {total}
            </span>
          </>
        ) : (
          <span className="mono">END OF FILE · 共 {total} 件</span>
        )}
        <div ref={sentinel} className="sr-only" aria-hidden="true" />
      </div>
    </>
  );
}
