"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const BOTTOM_TABS = [
  { href: "/",       label: "首页" },
  { href: "/plan",   label: "计划" },
  { href: "/chat",   label: "AI",  center: true },
  { href: "/english", label: "英语" },
];

const DRAWER_NAV = [
  { href: "/exam",          label: "每周考试" },
  { href: "/progress",      label: "学习进度" },
  { href: "/monthly",       label: "月度回顾" },
  { href: "/books",         label: "书籍笔记" },
  { href: "/subjects/news", label: "每日新闻" },
  { href: "/health",        label: "疾病管理" },
  { href: "/primary",       label: "小学学习" },
  { href: "/middle",        label: "初中学习" },
  { href: "/highschool",    label: "高中学习" },
];

const DRAWER_SUBJECTS = [
  { href: "/subjects/psychology", label: "心理学",    color: "#6b2d6e" },
  { href: "/subjects/biology",    label: "生物学",    color: "#1a5c34" },
  { href: "/subjects/physics",    label: "物理学",    color: "#003087" },
  { href: "/subjects/sociology",  label: "社会学",    color: "#7a4018" },
  { href: "/subjects/philosophy", label: "哲学",      color: "#3a2870" },
  { href: "/subjects/theology",   label: "神学",      color: "#7a1c30" },
  { href: "/subjects/medicine",   label: "现代医学",  color: "#1a5c4a" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  const moreActive = DRAWER_NAV.some((i) => pathname.startsWith(i.href)) ||
    DRAWER_SUBJECTS.some((i) => pathname.startsWith(i.href));

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Bottom drawer */}
      <div className={`fixed bottom-[56px] left-0 right-0 bg-[#f5f2eb] border-t border-[#d8d4ca] z-50 md:hidden transition-transform duration-250 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}>
        <div className="px-5 pt-3 pb-5">
          <div className="w-8 h-0.5 bg-[#d8d4ca] mx-auto mb-4" />

          <div className="grid grid-cols-3 gap-2 mb-4">
            {DRAWER_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-center py-2.5 border border-[#d8d4ca] text-[13px] text-[#5a5550] hover:text-[#1c1a16] hover:border-[#003087]"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <p className="text-[9px] tracking-[0.18em] uppercase text-[#9a9590] mb-2">学科</p>
          <div className="grid grid-cols-4 gap-1.5">
            {DRAWER_SUBJECTS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="flex items-center gap-1 py-2 px-2 border border-[#d8d4ca] text-[12px] text-[#5a5550] hover:text-[#1c1a16]"
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="truncate">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
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
            moreActive || open ? "text-[#003087] font-semibold" : "text-[#9a9590]"
          }`}
        >
          更多
        </button>
      </nav>
    </>
  );
}
