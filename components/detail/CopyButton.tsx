"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "../Icons";

export default function CopyButton({
  text,
  label = "复制",
  className = "copy-btn",
  compact = false,
}: {
  text: string;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const [ok, setOk] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setOk(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOk(false), 1600);
  }

  return (
    <button type="button" className={className} onClick={copy} aria-label={label}>
      {ok ? <CheckIcon /> : <CopyIcon />}
      {!compact && <span>{ok ? "已复制" : label}</span>}
    </button>
  );
}
