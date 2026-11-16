"use client";

import { useState } from "react";
import { CheckIcon, LinkIcon } from "../Icons";

export default function ShareRow({ url, title }: { url: string; title: string }) {
  const [ok, setOk] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setOk(true);
      setTimeout(() => setOk(false), 1600);
    } catch {
      /* ignore */
    }
  }
  const weibo = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  return (
    <div className="share-row">
      <button type="button" className="share-btn" onClick={copy}>
        {ok ? <CheckIcon /> : <LinkIcon />}
        {ok ? "链接已复制" : "复制链接"}
      </button>
      <a className="share-btn" href={weibo} target="_blank" rel="noreferrer">
        分享到微博
      </a>
    </div>
  );
}
