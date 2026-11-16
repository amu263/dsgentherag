import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://127.0.0.1:3210"),
  title: {
    default: "幻绘 PHANTOM ARCHIVE · 图和提示词，一起收好",
    template: "%s · 幻绘",
  },
  description:
    "AI 生图作品与提示词档案。按模型、角色、标签、主色调筛选，查看完整生成参数，复制提示词。",
  keywords: ["AI 生图", "提示词", "AI 绘画", "模型", "角色", "提示词分享", "幻绘"],
  openGraph: {
    title: "幻绘 PHANTOM ARCHIVE",
    description: "图和提示词，一起收好。",
    type: "website",
    locale: "zh_CN",
    siteName: "幻绘 PHANTOM ARCHIVE",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
