"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/taxonomy";
import { MenuIcon, SearchIcon, XIcon } from "./Icons";
import CommandPalette from "./CommandPalette";

export default function SiteHeader({ admin }: { admin: boolean }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="site-head">
        <div className="site-head__inner">
          <Link href="/" className="brand" aria-label={`${SITE.name} ${SITE.en} 首页`}>
            <span className="brand__mark">幻</span>
            <span className="brand__text">
              <b>幻绘</b>
              <i>PHANTOM</i>
            </span>
          </Link>

          <nav className="main-nav" aria-label="主导航">
            {SITE.nav.map((item, i) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`main-nav__link${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="idx">0{i + 1}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="head-actions">
            <button
              type="button"
              className="search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="打开搜索"
            >
              <SearchIcon />
              <span>搜索提示词、角色、模型</span>
              <kbd>⌘K</kbd>
            </button>
            {admin && (
              <Link href="/admin" className="head-admin">
                控制台
              </Link>
            )}
            {admin && (
              <Link href="/admin/upload" className="btn btn--accent head-cta">
                入库
              </Link>
            )}
            <button
              type="button"
              className="menu-btn"
              aria-label="打开菜单"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mobile-nav" ref={menuRef}>
            {SITE.nav.map((item, i) => (
              <Link key={item.href} href={item.href} className="mobile-nav__link">
                <span>0{i + 1}</span>
                {item.label}
              </Link>
            ))}
            <div className="mobile-nav__foot">
              {admin ? (
                <>
                  <Link href="/admin">控制台</Link>
                  <Link href="/admin/upload">批量入库</Link>
                </>
              ) : (
                <Link href="/tags">全部标签</Link>
              )}
            </div>
          </div>
        )}
      </header>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
