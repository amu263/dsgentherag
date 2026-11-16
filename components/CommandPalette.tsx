"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchIcon, XIcon } from "./Icons";

interface SearchData {
  works: { id: string; title: string; thumb: string; model: string; author: string }[];
  tags: { id: string; name: string; count: number }[];
  characters: { id: string; name: string; series: string; count: number }[];
  models: { id: string; name: string; code: string; count: number }[];
}

const EMPTY: SearchData = { works: [], tags: [], characters: [], models: [] };

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [data, setData] = useState<SearchData>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    setQ("");
    setCursor(0);
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    document.body.classList.add("is-locked");
    return () => {
      clearTimeout(t);
      document.body.classList.remove("is-locked");
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, {
          signal: ctrl.signal,
        });
        if (res.ok) setData((await res.json()) as SearchData);
      } catch {
        /* aborted */
      } finally {
        setBusy(false);
      }
    }, q ? 180 : 0);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open]);

  const links = useMemo(
    () => [
      ...data.works.map((w) => `/p/${w.id}`),
      ...data.characters.map((c) => `/characters/${c.id}`),
      ...data.models.map((m) => `/models/${m.id}`),
      ...data.tags.map((t) => `/?tags=${t.id}`),
    ],
    [data],
  );

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, links.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      } else if (e.key === "Enter" && links[cursor]) {
        e.preventDefault();
        go(links[cursor]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, links, cursor, go, onClose]);

  if (!open) return null;

  let idx = 0;
  const withIndex = (href: string) => idx++;

  return (
    <div className="cmdk" role="dialog" aria-modal="true" aria-label="站内搜索">
      <div className="cmdk__backdrop" onClick={onClose} />
      <div className="cmdk__panel">
        <div className="cmdk__input">
          <SearchIcon />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCursor(0);
            }}
            placeholder="搜提示词、角色、模型、标签……"
            aria-label="搜索关键词"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="清空">
              <XIcon />
            </button>
          )}
          <span className="cmdk__esc">ESC</span>
        </div>

        <div className="cmdk__body">
          {data.works.length > 0 && (
            <section className="cmdk__group">
              <h3>
                作品 <b>{data.works.length}</b>
              </h3>
              <div className="cmdk__works">
                {data.works.map((w) => {
                  const i = withIndex(`/p/${w.id}`);
                  return (
                    <Link
                      key={w.id}
                      href={`/p/${w.id}`}
                      className={`cmdk__work${cursor === i ? " is-cursor" : ""}`}
                      onClick={onClose}
                      onMouseEnter={() => setCursor(i)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={w.thumb} alt="" />
                      <span>
                        <b>{w.title}</b>
                        <i>
                          {w.model} · {w.author}
                        </i>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {data.characters.length > 0 && (
            <section className="cmdk__group">
              <h3>角色</h3>
              <div className="cmdk__list">
                {data.characters.map((c) => {
                  const i = withIndex(`/characters/${c.id}`);
                  return (
                    <Link
                      key={c.id}
                      href={`/characters/${c.id}`}
                      className={`cmdk__row${cursor === i ? " is-cursor" : ""}`}
                      onClick={onClose}
                      onMouseEnter={() => setCursor(i)}
                    >
                      <span>{c.name}</span>
                      <em>{c.series}</em>
                      <b>{c.count}</b>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {data.models.length > 0 && (
            <section className="cmdk__group">
              <h3>模型</h3>
              <div className="cmdk__list">
                {data.models.map((m) => {
                  const i = withIndex(`/models/${m.id}`);
                  return (
                    <Link
                      key={m.id}
                      href={`/models/${m.id}`}
                      className={`cmdk__row${cursor === i ? " is-cursor" : ""}`}
                      onClick={onClose}
                      onMouseEnter={() => setCursor(i)}
                    >
                      <span>{m.name}</span>
                      <em>{m.code}</em>
                      <b>{m.count}</b>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {data.tags.length > 0 && (
            <section className="cmdk__group">
              <h3>标签</h3>
              <div className="cmdk__tags">
                {data.tags.map((t) => {
                  const i = withIndex(`/?tags=${t.id}`);
                  return (
                    <Link
                      key={t.id}
                      href={`/?tags=${t.id}`}
                      className={`cmdk__tag${cursor === i ? " is-cursor" : ""}`}
                      onClick={onClose}
                      onMouseEnter={() => setCursor(i)}
                    >
                      #{t.name}
                      <b>{t.count}</b>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {!busy &&
            data.works.length === 0 &&
            data.tags.length === 0 &&
            data.characters.length === 0 &&
            data.models.length === 0 && (
              <div className="cmdk__none">
                <span>没有搜到</span>
                <p>换个关键词，或从标签开始翻。</p>
              </div>
            )}
        </div>

        <div className="cmdk__foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> 选择
            <kbd>↵</kbd> 打开
          </span>
          {q.trim() ? (
            <Link href={`/?q=${encodeURIComponent(q.trim())}`} onClick={onClose}>
              查看全部结果 →
            </Link>
          ) : (
            <span className="cmdk__hint">输入关键词开始搜索</span>
          )}
        </div>
      </div>
    </div>
  );
}
