"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Work } from "@/lib/types";
import WorkCard from "./WorkCard";

interface Layout {
  width: number;
  colW: number;
  cols: number;
  height: number;
  positions: { x: number; y: number }[];
}

const GAP = 3;
const BAR = 44;

function columnCount(width: number): number {
  if (width >= 1560) return 5;
  if (width >= 1180) return 4;
  if (width >= 840) return 3;
  if (width >= 600) return 3;
  return 2;
}

export default function Masonry({
  items,
  startIndex = 0,
  className = "",
}: {
  items: Work[];
  startIndex?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const useIsoLayout = typeof window === "undefined" ? useEffect : useLayoutEffect;

  const compute = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const width = el.clientWidth;
    if (!width) return;
    const cols = columnCount(width);
    const colW = (width - GAP * (cols - 1)) / cols;
    const heights = new Array(cols).fill(0);
    const positions: { x: number; y: number }[] = [];
    for (const work of items) {
      let col = 0;
      for (let i = 1; i < cols; i++) if (heights[i] < heights[col]) col = i;
      const h = (colW * work.height) / work.width + BAR;
      positions.push({ x: col * (colW + GAP), y: heights[col] });
      heights[col] += h + GAP;
    }
    setLayout({ width, colW, cols, height: Math.max(...heights), positions });
  }, [items]);

  useIsoLayout(() => {
    compute();
  }, [compute]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => compute());
    ro.observe(el);
    return () => ro.disconnect();
  }, [compute]);

  return (
    <div
      ref={ref}
      className={`masonry${layout ? " is-ready" : ""} ${className}`}
      style={{ height: layout ? layout.height : undefined }}
    >
      <noscript>
        <style>{`.masonry{opacity:1!important;columns:3;column-gap:3px}.masonry__item{position:static!important;width:auto!important;transform:none!important;margin-bottom:3px;break-inside:avoid}.masonry{height:auto!important}`}</style>
      </noscript>
      {items.map((work, i) => (
        <div
          key={work.id}
          className="masonry__item"
          style={
            layout
              ? {
                  width: layout.colW,
                  transform: `translate3d(${layout.positions[i].x}px, ${layout.positions[i].y}px, 0)`,
                }
              : undefined
          }
        >
          <WorkCard work={work} index={startIndex + i} />
        </div>
      ))}
    </div>
  );
}
