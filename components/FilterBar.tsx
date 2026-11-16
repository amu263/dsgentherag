"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { COLOR_FAMILIES, SORTS, TAG_GROUPS, SORT_MAP } from "@/lib/taxonomy";
import { queryToParams } from "@/lib/query";
import type { SortKey, WorkQuery } from "@/lib/types";
import { CheckIcon, ChevronDown, SearchIcon, XIcon } from "./Icons";

export interface Facets {
  models: { id: string; name: string; code: string; count: number }[];
  characters: { id: string; name: string; series: string; count: number }[];
  tags: { id: string; name: string; group: string; count: number }[];
  colors: { id: string; name: string; hex: string; count: number }[];
}

export default function FilterBar({
  facets,
  query,
  total,
}: {
  facets: Facets;
  query: WorkQuery;
  total: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const activeTags = useMemo(
    () => (query.tags || []).map((id) => facets.tags.find((t) => t.id === id)).filter(Boolean),
    [query.tags, facets.tags],
  );
  const activeChars = useMemo(
    () =>
      (query.characters || [])
        .map((id) => facets.characters.find((c) => c.id === id))
        .filter(Boolean),
    [query.characters, facets.characters],
  );
  const activeModel = facets.models.find((m) => m.id === query.model);
  const activeColor = COLOR_FAMILIES.find((c) => c.id === query.color);
  const activeCount =
    activeTags.length + activeChars.length + (activeModel ? 1 : 0) + (activeColor ? 1 : 0) + (query.q ? 1 : 0);

  function push(next: URLSearchParams) {
    next.delete("page");
    const url = next.toString() ? `/?${next.toString()}` : "/";
    startTransition(() => {
      router.push(url, { scroll: false });
    });
    requestAnimationFrame(() => {
      const el = document.getElementById("gallery");
      if (el && el.getBoundingClientRect().top < -120) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  function withParam(key: string, value: string | null, mode: "set" | "toggle" = "set") {
    const p = queryToParams(query);
    if (mode === "set") {
      if (value) p.set(key, value);
      else p.delete(key);
    } else if (value) {
      const cur = new Set((p.get(key) || "").split(",").filter(Boolean));
      if (cur.has(value)) cur.delete(value);
      else cur.add(value);
      if (cur.size) p.set(key, [...cur].join(","));
      else p.delete(key);
    }
    push(p);
  }

  function clearAll() {
    const p = new URLSearchParams();
    if (query.sort && query.sort !== "featured") p.set("sort", query.sort);
    push(p);
  }

  function selectSort(sort: SortKey) {
    withParam("sort", sort === "featured" ? null : sort);
  }

  return (
    <div className={`filterbar${pending ? " is-pending" : ""}`}>
      <div className="filterbar__inner">
        <div className="filterbar__left">
          <Popover
            label="模型"
            meta={activeModel ? activeModel.name : "ALL"}
            active={!!activeModel}
            align="left"
          >
            {(close) => (
              <div className="pop__body">
                <button
                  type="button"
                  className={`opt${!query.model ? " is-on" : ""}`}
                  onClick={() => {
                    withParam("model", null);
                    close();
                  }}
                >
                  <span className="check">
                    <CheckIcon />
                  </span>
                  全部模型
                  <span className="count">{facets.models.reduce((s, m) => s + m.count, 0)}</span>
                </button>
                {facets.models.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`opt${query.model === m.id ? " is-on" : ""}`}
                    onClick={() => {
                      withParam("model", m.id);
                      close();
                    }}
                  >
                    <span className="check">
                      <CheckIcon />
                    </span>
                    <span>
                      {m.name}
                      <em className="series">{m.code}</em>
                    </span>
                    <span className="count">{m.count}</span>
                  </button>
                ))}
              </div>
            )}
          </Popover>

          <Popover
            label="角色"
            meta={activeChars.length ? `+${activeChars.length}` : "ALL"}
            active={activeChars.length > 0}
          >
            {(close) => <CharacterPicker facets={facets} query={query} withParam={withParam} close={close} />}
          </Popover>

          <Popover
            label="标签"
            meta={activeTags.length ? `+${activeTags.length}` : "ALL"}
            active={activeTags.length > 0}
          >
            {() => (
              <TagPicker
                facets={facets}
                query={query}
                toggle={(id) => withParam("tags", id, "toggle")}
              />
            )}
          </Popover>

          <Popover label="色调" meta={activeColor ? activeColor.name : "ALL"} active={!!activeColor}>
            {(close) => (
              <ColorPicker
                facets={facets}
                value={query.color || ""}
                onPick={(id) => {
                  withParam("color", id);
                  close();
                }}
              />
            )}
          </Popover>
        </div>

        <div className="filterbar__spacer" />

        <div className="filterbar__right">
          <span className="result-count">
            <b>{total}</b> 件
          </span>
          <Popover
            label="排序"
            meta={SORT_MAP.get(query.sort || "featured")?.label || "站长精选"}
            active={(query.sort || "featured") !== "featured"}
            align="right"
            className="sort-btn"
          >
            {(close) => (
              <div className="pop__body">
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`opt${(query.sort || "featured") === s.id ? " is-on" : ""}`}
                    onClick={() => {
                      selectSort(s.id);
                      close();
                    }}
                  >
                    <span className="check">
                      <CheckIcon />
                    </span>
                    <span>
                      {s.label}
                      <em className="series">{s.hint}</em>
                    </span>
                    <span className="count">{s.en}</span>
                  </button>
                ))}
              </div>
            )}
          </Popover>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="active-row">
          {query.q && (
            <button type="button" className="active-chip" onClick={() => withParam("q", null)}>
              搜索 <b>{query.q}</b>
              <XIcon />
            </button>
          )}
          {activeModel && (
            <button type="button" className="active-chip" onClick={() => withParam("model", null)}>
              模型 <b>{activeModel.name}</b>
              <XIcon />
            </button>
          )}
          {activeChars.map((c) => (
            <button
              key={c!.id}
              type="button"
              className="active-chip"
              onClick={() => withParam("chars", c!.id, "toggle")}
            >
              角色 <b>{c!.name}</b>
              <XIcon />
            </button>
          ))}
          {activeTags.map((t) => (
            <button
              key={t!.id}
              type="button"
              className="active-chip"
              onClick={() => withParam("tags", t!.id, "toggle")}
            >
              # <b>{t!.name}</b>
              <XIcon />
            </button>
          ))}
          {activeColor && (
            <button type="button" className="active-chip" onClick={() => withParam("color", null)}>
              色调 <b>{activeColor.name}</b>
              <XIcon />
            </button>
          )}
          <button type="button" className="active-clear" onClick={clearAll}>
            清除全部
          </button>
        </div>
      )}
    </div>
  );
}

function Popover({
  label,
  meta,
  active,
  align = "left",
  className,
  children,
}: {
  label: string;
  meta: string;
  active?: boolean;
  align?: "left" | "right";
  className?: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="pop-wrap" ref={ref}>
      <button
        type="button"
        className={`${className || "filter-tab"}${active ? " has-value" : ""}${open ? " is-open" : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <span className="mono">{meta}</span>
        <ChevronDown />
      </button>
      {open && (
        <>
          <button type="button" className="pop__backdrop" aria-label="关闭" onClick={() => setOpen(false)} />
          <div className={`pop${align === "right" ? " pop--right" : ""}`} role="dialog" aria-label={label}>
            {children(() => setOpen(false))}
          </div>
        </>
      )}
    </div>
  );
}

function CharacterPicker({
  facets,
  query,
  withParam,
  close,
}: {
  facets: Facets;
  query: WorkQuery;
  withParam: (key: string, value: string | null, mode?: "set" | "toggle") => void;
  close: () => void;
}) {
  const [q, setQ] = useState("");
  const list = facets.characters.filter(
    (c) => !q || c.name.includes(q) || c.series.includes(q) || c.id.includes(q.toLowerCase()),
  );
  return (
    <>
      <label className="pop-search">
        <SearchIcon />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜角色 / 作品" />
      </label>
      <div className="pop__body">
        {list.map((c) => {
          const on = query.characters?.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              className={`opt${on ? " is-on" : ""}`}
              onClick={() => withParam("chars", c.id, "toggle")}
            >
              <span className="check">
                <CheckIcon />
              </span>
              <span>
                {c.name}
                <em className="series">{c.series}</em>
              </span>
              <span className="count">{c.count}</span>
            </button>
          );
        })}
        {!list.length && <div className="pop__empty">没有这个角色</div>}
      </div>
      <div className="pop__foot">
        <span className="pop__hint">可多选 · 同时命中任一角色</span>
        <button type="button" className="pop__done" onClick={close}>
          完成
        </button>
      </div>
    </>
  );
}

function TagPicker({
  facets,
  query,
  toggle,
}: {
  facets: Facets;
  query: WorkQuery;
  toggle: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const groups = TAG_GROUPS.map((group) => ({
    group,
    tags: facets.tags.filter((t) => t.group === group && (!q || t.name.includes(q) || t.id.includes(q.toLowerCase()))),
  })).filter((g) => g.tags.length);
  return (
    <>
      <label className="pop-search">
        <SearchIcon />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜标签" />
      </label>
      <div className="pop__body">
        {groups.map((g) => (
          <div key={g.group}>
            <div className="opt-group">{g.group}</div>
            <div className="tag-cloud">
              {g.tags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`tag-pick${query.tags?.includes(t.id) ? " is-on" : ""}`}
                  onClick={() => toggle(t.id)}
                >
                  {t.name}
                  <b>{t.count}</b>
                </button>
              ))}
            </div>
          </div>
        ))}
        {!groups.length && <div className="pop__empty">没有这个标签</div>}
      </div>
      <div className="pop__foot">
        <span className="pop__hint">多选为「同时满足」</span>
      </div>
    </>
  );
}

function ColorPicker({
  facets,
  value,
  onPick,
}: {
  facets: Facets;
  value: string;
  onPick: (id: string | null) => void;
}) {
  return (
    <>
      <div className="pop__head">
        <span>主色调</span>
        <span className="pop__hint">按画面主色聚类</span>
      </div>
      <div className="swatch-grid">
        <button type="button" className={`swatch${!value ? " is-on" : ""}`} onClick={() => onPick(null)}>
          <i style={{ background: "transparent", borderStyle: "dashed" }} />
          不限
        </button>
        {COLOR_FAMILIES.map((c) => {
          const count = facets.colors.find((f) => f.id === c.id)?.count || 0;
          return (
            <button
              key={c.id}
              type="button"
              className={`swatch${value === c.id ? " is-on" : ""}`}
              onClick={() => onPick(c.id)}
              title={`${c.name} · ${count}`}
            >
              <i style={{ background: c.hex }} data-mono={c.id === "mono" ? "" : undefined} />
              {c.name}
            </button>
          );
        })}
      </div>
    </>
  );
}
