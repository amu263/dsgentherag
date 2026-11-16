"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Work } from "@/lib/types";
import { formatCount } from "@/lib/format";
import { COLOR_MAP } from "@/lib/taxonomy";
import { ArrowLeft, ArrowRight, DownloadIcon, XIcon } from "../Icons";

export default function ImageStage({
  work,
  prevId,
  nextId,
}: {
  work: Work;
  prevId?: string;
  nextId?: string;
}) {
  const [open, setOpen] = useState(false);
  const color = COLOR_MAP.get(work.colorFamily);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("is-locked");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("is-locked");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <section className="stage" aria-label="作品大图">
        <div className="stage__frame">
          <button type="button" className="stage__open" onClick={() => setOpen(true)} aria-label="全屏查看">
            <Image
              src={work.src}
              alt={work.title}
              width={work.width}
              height={work.height}
              sizes="(max-width: 1000px) 100vw, 62vw"
              priority
              placeholder="blur"
              blurDataURL={work.blur}
              style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "76vh", objectFit: "contain" }}
            />
            <span className="stage__hint">点击全屏</span>
          </button>
        </div>
        <div className="stage__foot">
          <span className="mono">
            {work.width} × {work.height}
          </span>
          <span className="stage__sep" />
          <span className="mono">{color?.name || work.colorFamily}</span>
          <span className="stage__sep" />
          <span className="mono">{formatCount(work.stats.views)} 浏览</span>
          <span className="stage__nav">
            {prevId ? (
              <Link href={`/p/${prevId}`} aria-label="上一件">
                <ArrowLeft />
              </Link>
            ) : (
              <span className="is-disabled">
                <ArrowLeft />
              </span>
            )}
            {nextId ? (
              <Link href={`/p/${nextId}`} aria-label="下一件">
                <ArrowRight />
              </Link>
            ) : (
              <span className="is-disabled">
                <ArrowRight />
              </span>
            )}
          </span>
        </div>
      </section>

      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${work.title} 全屏`}>
          <button type="button" className="lightbox__backdrop" aria-label="关闭" onClick={() => setOpen(false)} />
          <div className="lightbox__bar">
            <span className="mono">{work.title}</span>
            <div>
              <a href={`/api/works/${work.id}/download`} aria-label="下载原图">
                <DownloadIcon />
              </a>
              <button type="button" onClick={() => setOpen(false)} aria-label="关闭">
                <XIcon />
              </button>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="lightbox__img" src={work.src} alt={work.title} />
        </div>
      )}
    </>
  );
}
