"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const BOTTOM_TABS = [
  { href: "/",     label: "首页" },
  { href: "/plan", label: "计划" },
  { href: "/chat", label: "AI", center: true },
];

const MY_ITEMS = [
  { href: "/exam",           label: "每周考试" },
  { href: "/progress",       label: "学习进度" },
  { href: "/monthly",        label: "阅读回顾" },
  { href: "/books",          label: "书籍笔记" },
  { href: "/health",         label: "疾病管理" },
  { href: "/story",          label: "英雄传说" },
  { href: "/english",        label: "每日英语" },
  { href: "/subjects/news",  label: "每日新闻" },
  { href: "/games",          label: "益智游戏" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const myActive = MY_ITEMS.some((i) => pathname.startsWith(i.href));

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* "我的" drawer */}
      <div
        className={`fixed left-0 right-0 bottom-[56px] bg-[#f5f2eb] border-t border-[#d8d4ca] z-50 md:hidden transition-transform duration-250 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "60vh", overflowY: "auto" }}
      >
        <div className="px-4 pt-3 pb-6">
          <div className="w-8 h-0.5 bg-[#d8d4ca] mx-auto mb-4" />
          <p className="text-[9px] tracking-[0.18em] uppercase text-[#9a9590] mb-2">我的</p>
          <div className="grid grid-cols-4 gap-2">
            {MY_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block text-center py-2.5 border text-[12px] transition-colors ${
                    active
                      ? "border-[#003087] text-[#003087] font-semibold bg-[#eef1f8]"
                      : "border-[#d8d4ca] text-[#5a5550]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-[#f5f2eb] border-t border-[#d8d4ca] flex items-center z-50 md:hidden safe-area-pb">
        {BOTTOM_TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          if (tab.center) {
            return (
              <div key={tab.href} className="flex-1 flex justify-center">
                <Link
                  href={tab.href}
                  className={`w-10 h-10 border flex items-center justify-center text-[11px] font-semibold tracking-wide -mt-3 ${
                    active
                      ? "bg-[#003087] border-[#003087] text-white"
                      : "bg-[#f5f2eb] border-[#d8d4ca] text-[#003087]"
                  }`}
                  style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                >
                  {tab.label}
                </Link>
              </div>
            );
          }
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[11px] tracking-wide transition-colors ${
                active ? "text-[#003087] font-semibold" : "text-[#9a9590]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}

        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[11px] tracking-wide transition-colors ${
            myActive || open ? "text-[#003087] font-semibold" : "text-[#9a9590]"
          }`}
        >
          我的
        </button>
      </nav>
    </>
  );
}
