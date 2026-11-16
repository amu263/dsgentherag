"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, GridIcon, ImageIcon, LogOutIcon, UploadIcon } from "../Icons";

const links = [
  { href: "/admin", label: "总览", en: "OVERVIEW", icon: GridIcon },
  { href: "/admin/upload", label: "批量入库", en: "INGEST", icon: UploadIcon },
  { href: "/admin/works", label: "作品管理", en: "WORKS", icon: ImageIcon },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <aside className="admin-side">
      <Link href="/admin" className="admin-brand">
        <span className="brand__mark">幻</span>
        <span>
          <b>幻绘</b>
          <i>CONTROL ROOM</i>
        </span>
      </Link>

      <nav className="admin-nav">
        {links.map((l, i) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          const Icon = l.icon;
          return (
            <Link key={l.href} href={l.href} className={`admin-nav__link${active ? " is-active" : ""}`}>
              <span className="admin-nav__no">0{i + 1}</span>
              <Icon />
              <b>{l.label}</b>
              <em>{l.en}</em>
            </Link>
          );
        })}
      </nav>

      <div className="admin-side__foot">
        <Link href="/" target="_blank" className="admin-side__link">
          打开前台 <ArrowUpRight />
        </Link>
        <button type="button" className="admin-side__link" onClick={logout}>
          退出登录 <LogOutIcon />
        </button>
        <span className="admin-side__ver mono">PHANTOM / LOCAL BUILD</span>
      </div>
    </aside>
  );
}
