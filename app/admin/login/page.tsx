import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "管理员入口",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="login-page">
      <div className="login-page__poster">
        <span className="mono login-page__tag">RESTRICTED / 04</span>
        <h1>
          控制台
          <br />
          <span>仅限站长</span>
        </h1>
        <p>作品入库、参数读取、标签与精选管理。</p>
        <div className="login-page__barcode" aria-hidden="true" />
      </div>
      <div className="login-page__panel">
        <div className="login-page__inner">
          <span className="eyebrow">ADMIN ACCESS</span>
          <h2>验证身份</h2>
          <p className="login-page__desc">输入管理员密码后进入。此页面不会出现在站内导航里。</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
