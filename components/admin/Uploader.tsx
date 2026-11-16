"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronDown, ImageIcon, UploadIcon, XIcon } from "../Icons";

interface Parsed {
  source: string;
  prompt: string;
  negativePrompt: string;
  params: {
    steps?: number;
    sampler?: string;
    cfg?: number;
    seed?: string;
    size?: string;
    clipSkip?: number;
    denoise?: number;
  };
  modelName: string;
  software: string;
}

interface UploadResult {
  id: string;
  fileName: string;
  src: string;
  thumb: string;
  width: number;
  height: number;
  palette: string[];
  dominant: string;
  colorFamily: string;
  blur: string;
  parsed: Parsed;
  suggestedModelId: string;
}

interface Draft {
  key: string;
  fileName: string;
  preview: string;
  file: File;
  status: "uploading" | "ready" | "error";
  error?: string;
  result?: UploadResult;
  title: string;
  modelId: string;
  prompt: string;
  negativePrompt: string;
  promptPublic: boolean;
  tags: string;
  characters: string;
  author: string;
  createdAt: string;
  featured: number;
  sampled: string;
  steps: string;
  cfg: string;
  seed: string;
  size: string;
  expanded: boolean;
}

const SOURCE_LABEL: Record<string, string> = {
  a1111: "A1111 / Forge 参数",
  comfyui: "ComfyUI 工作流",
  novelai: "NovelAI 参数",
  custom: "EXIF 文本",
  none: "未读到参数",
};

function splitList(value: string): string[] {
  return value
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Uploader({
  models,
  tagNames,
  characterNames,
}: {
  models: { id: string; name: string }[];
  tagNames: string[];
  characterNames: string[];
}) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [drag, setDrag] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [batchModel, setBatchModel] = useState("");
  const [batchAuthor, setBatchAuthor] = useState("阿木");
  const [batchTags, setBatchTags] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const readyCount = drafts.filter((d) => d.status === "ready").length;
  const percent = drafts.length ? Math.round((readyCount / drafts.length) * 100) : 0;

  function patch(key: string, changes: Partial<Draft>) {
    setDrafts((list) => list.map((d) => (d.key === key ? { ...d, ...changes } : d)));
  }

  async function uploadOne(draft: Draft) {
    try {
      patch(draft.key, { status: "uploading", error: "" });
      const form = new FormData();
      form.append("file", draft.file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as UploadResult & { error?: string };
      if (!res.ok) {
        patch(draft.key, { status: "error", error: data.error || "上传失败" });
        return;
      }
      const parsed = data.parsed;
      patch(draft.key, {
        status: "ready",
        result: data,
        preview: data.thumb,
        modelId: data.suggestedModelId || draft.modelId,
        prompt: parsed.prompt || draft.prompt,
        negativePrompt: parsed.negativePrompt || draft.negativePrompt,
        promptPublic: Boolean(parsed.prompt),
        sampled: parsed.params.sampler || "",
        steps: parsed.params.steps != null ? String(parsed.params.steps) : "",
        cfg: parsed.params.cfg != null ? String(parsed.params.cfg) : "",
        seed: parsed.params.seed || "",
        size: parsed.params.size || `${data.width}x${data.height}`,
      });
    } catch {
      patch(draft.key, { status: "error", error: "网络中断，点重试" });
    }
  }

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files)
      .filter((f) => /image\/(jpeg|png|webp|avif)/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name))
      .slice(0, 40);
    if (!list.length) return;
    setPublished(null);
    setError("");
    const fresh: Draft[] = list.map((file) => {
      const base = file.name.replace(/\.[^.]+$/, "").replace(/[._-]+/g, " ").trim();
      return {
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name,
        preview: URL.createObjectURL(file),
        file,
        status: "uploading",
        title: base.slice(0, 60),
        modelId: models[0]?.id || "",
        prompt: "",
        negativePrompt: "",
        promptPublic: true,
        tags: "",
        characters: "",
        author: "阿木",
        createdAt: today(),
        featured: 0,
        sampled: "",
        steps: "",
        cfg: "",
        seed: "",
        size: "",
        expanded: true,
      };
    });
    setDrafts((prev) => [...prev, ...fresh]);

    const queue = [...fresh];
    const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
      while (queue.length) {
        const next = queue.shift();
        if (next) await uploadOne(next);
      }
    });
    await Promise.all(workers);
  }

  function removeDraft(key: string) {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  }

  function applyBatch() {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.status !== "ready") return d;
        const tags = batchTags
          ? [...new Set([...splitList(d.tags), ...splitList(batchTags)])].join(", ")
          : d.tags;
        return {
          ...d,
          modelId: batchModel || d.modelId,
          author: batchAuthor.trim() || d.author,
          tags,
        };
      }),
    );
  }

  async function publish() {
    const ready = drafts.filter((d) => d.status === "ready" && d.result);
    if (!ready.length || publishing) return;
    setPublishing(true);
    setError("");
    try {
      const items = ready.map((d) => ({
        title: d.title,
        prompt: d.prompt,
        negativePrompt: d.negativePrompt,
        promptPublic: d.promptPublic,
        modelId: d.modelId,
        tags: splitList(d.tags),
        characters: splitList(d.characters),
        author: d.author,
        createdAt: new Date(`${d.createdAt}T12:00:00`).toISOString(),
        featured: d.featured,
        colorFamily: d.result!.colorFamily,
        palette: d.result!.palette,
        width: d.result!.width,
        height: d.result!.height,
        src: d.result!.src,
        thumb: d.result!.thumb,
        dominant: d.result!.dominant,
        blur: d.result!.blur,
        sourceName: "本站",
        sourceUrl: "",
        params: {
          steps: d.steps ? Number(d.steps) : undefined,
          sampler: d.sampled || undefined,
          cfg: d.cfg ? Number(d.cfg) : undefined,
          seed: d.seed || undefined,
          size: d.size || undefined,
        },
      }));
      const res = await fetch("/api/admin/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = (await res.json().catch(() => ({}))) as { created?: unknown[]; error?: string };
      if (!res.ok) {
        setError(data.error || "发布失败");
        return;
      }
      setPublished(data.created?.length || items.length);
      setDrafts([]);
      router.refresh();
    } catch {
      setError("发布失败，检查一下网络");
    } finally {
      setPublishing(false);
    }
  }

  const total = useMemo(() => drafts.length, [drafts]);

  return (
    <div className="uploader">
      <datalist id="tag-options">
        {tagNames.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <datalist id="char-options">
        {characterNames.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {published !== null && (
        <div className="upload-success">
          <CheckIcon />
          <div>
            <b>已入库 {published} 件作品</b>
            <span>前台已更新，可以继续拖入下一批。</span>
          </div>
          <a href="/admin/works" className="btn btn--paper">
            去管理
          </a>
        </div>
      )}

      <div
        className={`dropzone${drag ? " is-drag" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void addFiles(e.dataTransfer.files);
        }}
      >
        <span className="dropzone__icon">
          <UploadIcon />
        </span>
        <b>把图片拖进来</b>
        <span>JPG / PNG / WebP · 自动读取 A1111、ComfyUI、NovelAI 参数</span>
        <button type="button" className="btn btn--paper" onClick={() => fileRef.current?.click()}>
          选择文件
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="dropzone__hint mono">最多 40 张 / 次 · 单张 ≤ 40MB</span>
      </div>

      {total > 0 && (
        <>
          <div className="batch-bar">
            <span className="batch-bar__count mono">
              {readyCount}/{total} 就绪
            </span>
            <div className="batch-bar__fields">
              <label>
                统一模型
                <select value={batchModel} onChange={(e) => setBatchModel(e.target.value)}>
                  <option value="">保持不变</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                追加标签
                <input
                  value={batchTags}
                  onChange={(e) => setBatchTags(e.target.value)}
                  placeholder="用逗号分隔"
                  list="tag-options"
                />
              </label>
              <label>
                作者
                <input value={batchAuthor} onChange={(e) => setBatchAuthor(e.target.value)} />
              </label>
              <button type="button" className="btn btn--paper" onClick={applyBatch}>
                应用到全部
              </button>
            </div>
            <button
              type="button"
              className="batch-bar__collapse"
              onClick={() =>
                setDrafts((prev) => prev.map((d) => ({ ...d, expanded: !prev.every((x) => !x.expanded) })))
              }
            >
              全部展开 / 收起
            </button>
          </div>

          <div className="upload-list">
            {drafts.map((d, i) => (
              <article key={d.key} className={`up-item is-${d.status}`}>
                <div className="up-item__thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.preview} alt="" />
                  <span className="up-item__no mono">{String(i + 1).padStart(2, "0")}</span>
                  {d.status === "uploading" && <span className="up-item__loading">读取中</span>}
                </div>
                <div className="up-item__body">
                  <div className="up-item__head">
                    <input
                      className="up-title"
                      value={d.title}
                      onChange={(e) => patch(d.key, { title: e.target.value })}
                      placeholder="作品标题"
                      aria-label="作品标题"
                    />
                    <span className={`up-badge${d.result?.parsed.source === "none" ? " is-muted" : ""}`}>
                      {d.status === "error" ? "读取失败" : SOURCE_LABEL[d.result?.parsed.source || "none"]}
                    </span>
                    <button
                      type="button"
                      className="up-icon"
                      onClick={() => patch(d.key, { expanded: !d.expanded })}
                      aria-label={d.expanded ? "收起" : "展开"}
                    >
                      <ChevronDown style={{ transform: d.expanded ? "rotate(180deg)" : "none" }} />
                    </button>
                    <button type="button" className="up-icon" onClick={() => removeDraft(d.key)} aria-label="移除">
                      <XIcon />
                    </button>
                  </div>

                  {d.status === "error" && (
                    <div className="up-error">
                      <span>{d.error}</span>
                      <button type="button" onClick={() => void uploadOne(d)}>
                        重试
                      </button>
                    </div>
                  )}

                  {d.expanded && d.status !== "error" && (
                    <>
                      <div className="up-grid">
                        <label>
                          模型
                          <select
                            value={d.modelId}
                            onChange={(e) => patch(d.key, { modelId: e.target.value })}
                          >
                            {models.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          作者
                          <input value={d.author} onChange={(e) => patch(d.key, { author: e.target.value })} />
                        </label>
                        <label>
                          标签
                          <input
                            value={d.tags}
                            onChange={(e) => patch(d.key, { tags: e.target.value })}
                            placeholder="赛博朋克, 雨夜, 全身"
                            list="tag-options"
                          />
                        </label>
                        <label>
                          角色
                          <input
                            value={d.characters}
                            onChange={(e) => patch(d.key, { characters: e.target.value })}
                            placeholder="原创角色"
                            list="char-options"
                          />
                        </label>
                        <label>
                          入库日期
                          <input
                            type="date"
                            value={d.createdAt}
                            onChange={(e) => patch(d.key, { createdAt: e.target.value })}
                          />
                        </label>
                        <label>
                          精选顺位
                          <input
                            type="number"
                            min={0}
                            value={d.featured}
                            onChange={(e) => patch(d.key, { featured: Number(e.target.value) || 0 })}
                          />
                        </label>
                      </div>

                      <label className="up-full">
                        提示词
                        <textarea
                          rows={3}
                          value={d.prompt}
                          onChange={(e) => patch(d.key, { prompt: e.target.value })}
                          placeholder="正向提示词"
                        />
                      </label>

                      <details className="up-details">
                        <summary>负面提示词与采样参数</summary>
                        <label className="up-full">
                          负面提示词
                          <textarea
                            rows={2}
                            value={d.negativePrompt}
                            onChange={(e) => patch(d.key, { negativePrompt: e.target.value })}
                          />
                        </label>
                        <div className="up-grid up-grid--params">
                          <label>
                            采样器
                            <input
                              value={d.sampled}
                              onChange={(e) => patch(d.key, { sampled: e.target.value })}
                            />
                          </label>
                          <label>
                            步数
                            <input value={d.steps} onChange={(e) => patch(d.key, { steps: e.target.value })} />
                          </label>
                          <label>
                            CFG
                            <input value={d.cfg} onChange={(e) => patch(d.key, { cfg: e.target.value })} />
                          </label>
                          <label>
                            Seed
                            <input value={d.seed} onChange={(e) => patch(d.key, { seed: e.target.value })} />
                          </label>
                          <label>
                            尺寸
                            <input value={d.size} onChange={(e) => patch(d.key, { size: e.target.value })} />
                          </label>
                        </div>
                      </details>

                      <div className="up-foot">
                        <label className="up-check">
                          <input
                            type="checkbox"
                            checked={d.promptPublic}
                            onChange={(e) => patch(d.key, { promptPublic: e.target.checked })}
                          />
                          公开提示词
                        </label>
                        <span className="mono">
                          {d.result ? `${d.result.width} × ${d.result.height}` : "—"}
                        </span>
                        {d.result && (
                          <span className="up-palette">
                            {d.result.palette.slice(0, 4).map((hex) => (
                              <i key={hex} style={{ background: hex }} />
                            ))}
                          </span>
                        )}
                        <span className="up-src mono">{d.fileName}</span>
                      </div>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="publish-bar">
            <div className="publish-bar__info">
              <b>{readyCount}</b> 件待发布
              <span className="mono">{percent}% READY</span>
            </div>
            {error && <span className="publish-bar__error">{error}</span>}
            <button type="button" className="btn btn--accent btn--lg" onClick={publish} disabled={!readyCount || publishing}>
              {publishing ? "正在写入档案…" : `发布 ${readyCount} 件`}
            </button>
          </div>
        </>
      )}

      {total === 0 && (
        <div className="upload-empty">
          <ImageIcon />
          <p>队列是空的。先拖几张图进来。</p>
        </div>
      )}
    </div>
  );
}
