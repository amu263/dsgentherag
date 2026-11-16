"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockIcon } from "../Icons";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || "登录失败");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("网络错误，再试一次");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <label className="login-field">
        <span>管理员密码</span>
        <div>
          <LockIcon />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码"
            autoFocus
            autoComplete="current-password"
          />
        </div>
      </label>
      {error && <p className="login-error">{error}</p>}
      <button className="btn btn--paper btn--lg login-submit" type="submit" disabled={busy}>
        {busy ? "验证中…" : "进入控制台"}
      </button>
      <p className="login-hint">仅站长可见 · 会话保留 7 天</p>
    </form>
  );
}
