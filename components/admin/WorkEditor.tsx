"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Work } from "@/lib/types";
import { COLOR_FAMILIES } from "@/lib/taxonomy";
import { ArrowUpRight, CheckIcon, TrashIcon } from "../Icons";

export default function WorkEditor({
  work,
  tags,
  characters,
  models,
}: {
  work: Work;
  tags: { id: string; name: string }[];
  characters: { id: string; name: string }[];
  models: { id: string; name: string }[];
}) {
  const router = useRouter();
  const tagMap = new Map(tags.map((t) => [t.id, t.name]));
  const charMap = new Map(characters.map((c) => [c.id, c.name]));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: work.title,
    author: work.author,
    authorUrl: work.authorUrl,
    createdAt: work.createdAt.slice(0, 10),
    modelId: work.modelId,
    tags: work.tags.map((id) => tagMap.get(id) || id).join(", "),
    characters: work.characters.map((id) => charMap.get(id) || id).join(", "),
    prompt: work.prompt,
    negativePrompt: work.negativePrompt,
    promptPublic: work.promptPublic,
    note: work.note,
    featured: work.featured,
    colorFamily: work.colorFamily,
    sourceName: work.sourceName,
    sourceUrl: work.sourceUrl,
    sampler: work.params.sampler || "",
    steps: work.params.steps != null ? String(work.params.steps) : "",
    cfg: work.params.cfg != null ? String(work.params.cfg) : "",
    seed: work.params.seed || "",
    size: work.params.size || "",
    views: work.stats.views,
    likes: work.stats.likes,
    favorites: work.stats.favorites,
    downloads: work.stats.downloads,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/works/${work.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          author: form.author,
          authorUrl: form.authorUrl,
          createdAt: new Date(`${form.createdAt}T12:00:00`).toISOString(),
          modelId: form.modelId,
          tags: form.tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
          characters: form.characters.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
          prompt: form.prompt,
          negativePrompt: form.negativePrompt,
          promptPublic: form.promptPublic,
          note: form.note,
          featured: Number(form.featured) || 0,
          colorFamily: form.colorFamily,
          sourceName: form.sourceName,
          sourceUrl: form.sourceUrl,
          params: {
            sampler: form.sampler || undefined,
            steps: form.steps ? Number(form.steps) : undefined,
            cfg: form.cfg ? Number(form.cfg) : undefined,
            seed: form.seed || undefined,
            size: form.size || undefined,
          },
          stats: {
            views: Number(form.views) || 0,
            likes: Number(form.likes) || 0,
            favorites: Number(form.favorites) || 0,
            downloads: Number(form.downloads) || 0,
          },
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || "保存失败");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`确定删除《${work.title}》？`)) return;
    const res = await fetch(`/api/admin/works/${work.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/works");
      router.refresh();
    }
  }

  return (
    <div className="editor">
      <datalist id="editor-tags">
        {tags.map((t) => (
          <option key={t.id} value={t.name} />
        ))}
      </datalist>
      <datalist id="editor-chars">
        {characters.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>

      <div className="editor__preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={work.src} alt={work.title} />
        <div className="editor__meta mono">
          {work.width} × {work.height} · {work.id}
        </div>
        <Link href={`/p/${work.id}`} target="_blank">
          在前台查看 <ArrowUpRight />
        </Link>
      </div>

      <div className="editor__form">
        <section className="editor__block">
          <h2>基本信息</h2>
          <div className="editor__grid">
            <label className="span2">
              标题
              <input value={form.title} onChange={(e) => set("title", e.target.value)} />
            </label>
            <label>
              模型
              <select value={form.modelId} onChange={(e) => set("modelId", e.target.value)}>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              作者
              <input value={form.author} onChange={(e) => set("author", e.target.value)} />
            </label>
            <label>
              入库日期
              <input type="date" value={form.createdAt} onChange={(e) => set("createdAt", e.target.value)} />
            </label>
            <label>
              精选顺位
              <input
                type="number"
                min={0}
                value={form.featured}
                onChange={(e) => set("featured", Number(e.target.value) || 0)}
              />
            </label>
            <label>
              主色调
              <select value={form.colorFamily} onChange={(e) => set("colorFamily", e.target.value as Work["colorFamily"])}>
                {COLOR_FAMILIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              来源名称
              <input value={form.sourceName} onChange={(e) => set("sourceName", e.target.value)} />
            </label>
            <label className="span2">
              来源链接
              <input value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} />
            </label>
            <label className="span2">
              标签
              <input
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                list="editor-tags"
                placeholder="用逗号分隔"
              />
            </label>
            <label className="span2">
              角色
              <input
                value={form.characters}
                onChange={(e) => set("characters", e.target.value)}
                list="editor-chars"
                placeholder="用逗号分隔"
              />
            </label>
          </div>
        </section>

        <section className="editor__block">
          <h2>提示词</h2>
          <label className="editor__check">
            <input
              type="checkbox"
              checked={form.promptPublic}
              onChange={(e) => set("promptPublic", e.target.checked)}
            />
            公开提示词
          </label>
          <label className="editor__full">
            正向提示词
            <textarea rows={5} value={form.prompt} onChange={(e) => set("prompt", e.target.value)} />
          </label>
          <label className="editor__full">
            负面提示词
            <textarea
              rows={3}
              value={form.negativePrompt}
              onChange={(e) => set("negativePrompt", e.target.value)}
            />
          </label>
          <label className="editor__full">
            未公开说明
            <input
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="例如：作者未公开提示词"
            />
          </label>
        </section>

        <section className="editor__block">
          <h2>生成参数</h2>
          <div className="editor__grid editor__grid--3">
            <label>
              采样器
              <input value={form.sampler} onChange={(e) => set("sampler", e.target.value)} />
            </label>
            <label>
              步数
              <input value={form.steps} onChange={(e) => set("steps", e.target.value)} />
            </label>
            <label>
              CFG
              <input value={form.cfg} onChange={(e) => set("cfg", e.target.value)} />
            </label>
            <label>
              Seed
              <input value={form.seed} onChange={(e) => set("seed", e.target.value)} />
            </label>
            <label>
              尺寸
              <input value={form.size} onChange={(e) => set("size", e.target.value)} />
            </label>
          </div>
        </section>

        <section className="editor__block">
          <h2>数据</h2>
          <div className="editor__grid editor__grid--4">
            <label>
              浏览
              <input type="number" value={form.views} onChange={(e) => set("views", Number(e.target.value) || 0)} />
            </label>
            <label>
              喜欢
              <input type="number" value={form.likes} onChange={(e) => set("likes", Number(e.target.value) || 0)} />
            </label>
            <label>
              收藏
              <input
                type="number"
                value={form.favorites}
                onChange={(e) => set("favorites", Number(e.target.value) || 0)}
              />
            </label>
            <label>
              下载
              <input
                type="number"
                value={form.downloads}
                onChange={(e) => set("downloads", Number(e.target.value) || 0)}
              />
            </label>
          </div>
        </section>

        {error && <p className="editor__error">{error}</p>}

        <div className="editor__actions">
          <button type="button" className="btn btn--paper btn--lg" onClick={save} disabled={saving}>
            {saving ? "保存中…" : saved ? (<><CheckIcon /> 已保存</>) : "保存修改"}
          </button>
          <button type="button" className="editor__delete" onClick={remove}>
            <TrashIcon /> 删除作品
          </button>
        </div>
      </div>
    </div>
  );
}
