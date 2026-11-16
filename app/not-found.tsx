import Link from "next/link";

export default function NotFound() {
  return (
    <div className="notfound">
      <span className="notfound__mark mono">404 / LOST IN ARCHIVE</span>
      <h1>
        这页没留下
        <br />
        任何底片。
      </h1>
      <p>链接可能已经失效，或者这件作品被移出了档案。</p>
      <Link className="btn btn--accent btn--lg" href="/">
        回到发现页
      </Link>
    </div>
  );
}
