import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { isAdmin } from "@/lib/auth";
import { loadDB } from "@/lib/store";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  const db = loadDB();
  return (
    <>
      <a className="skip" href="#main">
        跳到内容
      </a>
      <SiteHeader admin={admin} />
      <main id="main">{children}</main>
      <SiteFooter works={db.works.length} />
    </>
  );
}
