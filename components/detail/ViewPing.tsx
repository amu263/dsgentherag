"use client";

import { useEffect } from "react";

export default function ViewPing({ id }: { id: string }) {
  useEffect(() => {
    const key = `phantom:view:${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    fetch(`/api/works/${id}/view`, { method: "POST" }).catch(() => {});
  }, [id]);
  return null;
}
