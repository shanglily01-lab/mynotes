import type { Metadata, Viewport } from "next";
import { Playfair_Display, Lora } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
});

const lora = Lora({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "自我成长 — 学术笔记",
  description: "心理学、生物学、物理学、社会学、AI、哲学、神学 — 每日学习，每周考试",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "自我成长" },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#f5f2eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${playfair.variable} ${lora.variable} h-full`}>
      <body className="min-h-screen flex bg-[#f5f2eb]">
        <Sidebar />
        <main className="flex-1 min-h-screen md:ml-[220px]">
          <div className="max-w-3xl mx-auto px-5 md:px-10 py-8 md:py-10 pb-24 md:pb-10">
            {children}
          </div>
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
