import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <div className="admin-shell">
      <AdminNav />
      <div className="admin-main">{children}</div>
    </div>
  );
}
