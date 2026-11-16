"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Work } from "@/lib/types";
import { formatCount, formatDate } from "@/lib/format";
import { PencilIcon, StarIcon, TrashIcon } from "../Icons";

export default function WorksTable({ works }: { works: Work[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function toggleFeature(work: Work) {
    if (busy) return;
    setBusy(work.id);
    await fetch(`/api/admin/works/${work.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: work.featured > 0 ? 0 : 1 }),
    });
    setBusy("");
    router.refresh();
  }

  async function remove(work: Work) {
    if (busy) return;
    if (!window.confirm(`确定删除《${work.title}》？图片文件也会一起删除。`)) return;
    setBusy(work.id);
    await fetch(`/api/admin/works/${work.id}`, { method: "DELETE" });
    setBusy("");
    router.refresh();
  }

  return (
    <div className="wtable-wrap">
      <table className="wtable">
        <thead>
          <tr>
            <th>作品</th>
            <th>模型</th>
            <th>作者</th>
            <th>数据</th>
            <th>入库</th>
            <th>状态</th>
            <th aria-label="操作" />
          </tr>
        </thead>
        <tbody>
          {works.map((w) => (
            <tr key={w.id} className={busy === w.id ? "is-busy" : ""}>
              <td>
                <div className="wtable__work">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={w.thumb} alt="" />
                  <div>
                    <Link href={`/p/${w.id}`} target="_blank">
                      {w.title}
                    </Link>
                    <span className="mono">{w.id}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className="wtable__model">{w.modelShort || w.modelLabel}</span>
              </td>
              <td>{w.author}</td>
              <td>
                <span className="mono wtable__stats">
                  ♥ {formatCount(w.stats.likes)} · 阅 {formatCount(w.stats.views)}
                </span>
              </td>
              <td className="mono">{formatDate(w.createdAt)}</td>
              <td>
                <div className="wtable__flags">
                  {w.featured > 0 && <span className="flag flag--lime">精选</span>}
                  {!w.promptPublic && <span className="flag">提示词未公开</span>}
                </div>
              </td>
              <td>
                <div className="wtable__actions">
                  <button
                    type="button"
                    className={`wtable__btn${w.featured > 0 ? " is-on" : ""}`}
                    onClick={() => void toggleFeature(w)}
                    title={w.featured > 0 ? "取消精选" : "设为精选"}
                    aria-label="切换精选"
                  >
                    <StarIcon />
                  </button>
                  <Link href={`/admin/works/${w.id}`} className="wtable__btn" title="编辑" aria-label="编辑">
                    <PencilIcon />
                  </Link>
                  <button
                    type="button"
                    className="wtable__btn wtable__btn--danger"
                    onClick={() => void remove(w)}
                    title="删除"
                    aria-label="删除"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {works.length === 0 && <div className="wtable__empty">没有符合条件的作品。</div>}
    </div>
  );
}
