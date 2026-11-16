"use client";

import { useEffect, useState } from "react";
import { formatCount } from "@/lib/format";
import { HeartIcon } from "../Icons";

export default function LikeButton({ id, initial }: { id: string; initial: number }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setLiked(localStorage.getItem(`phantom:like:${id}`) === "1");
    } catch {
      /* ignore */
    }
  }, [id]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !liked;
    try {
      const res = await fetch(`/api/works/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: next ? "like" : "unlike" }),
      });
      if (res.ok) {
        const data = (await res.json()) as { likes: number };
        setCount(data.likes);
        setLiked(next);
        localStorage.setItem(`phantom:like:${id}`, next ? "1" : "0");
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`like-btn${liked ? " is-liked" : ""}`}
      onClick={toggle}
      aria-pressed={liked}
      disabled={busy}
    >
      <HeartIcon />
      <b>{formatCount(count)}</b>
      <span>{liked ? "已喜欢" : "喜欢"}</span>
    </button>
  );
}
