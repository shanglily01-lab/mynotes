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
];

const MORE_SECTIONS: { key: string; label: string; subjects: { href: string; label: string; color: string }[] }[] = [
  {
    key: "high",
    label: "高中",
    subjects: [
      { href: "/highschool/chinese",   label: "语文", color: "#8b1a2a" },
      { href: "/highschool/math",      label: "数学", color: "#1a3870" },
      { href: "/highschool/english",   label: "英语", color: "#1a5c3a" },
      { href: "/highschool/physics",   label: "物理", color: "#2d1a70" },
      { href: "/highschool/chemistry", label: "化学", color: "#7a4a00" },
      { href: "/highschool/biology",   label: "生物", color: "#1a5c20" },
    ],
  },
  {
    key: "middle",
    label: "初中",
    subjects: [
      { href: "/middle/chinese",   label: "语文",       color: "#8b1a2a" },
      { href: "/middle/math",      label: "数学",       color: "#1a3870" },
      { href: "/middle/english",   label: "英语",       color: "#1a5c3a" },
      { href: "/middle/physics",   label: "物理",       color: "#2d1a70" },
      { href: "/middle/chemistry", label: "化学",       color: "#7a4a00" },
      { href: "/middle/biology",   label: "生物",       color: "#1a5c20" },
      { href: "/middle/history",   label: "历史",       color: "#5a3a1a" },
      { href: "/middle/geography", label: "地理",       color: "#1a4a5c" },
      { href: "/middle/ethics",    label: "道德与法治", color: "#5a2d70" },
    ],
  },
  {
    key: "primary",
    label: "小学",
    subjects: [
      { href: "/primary/chinese",  label: "语文",       color: "#8b1a2a" },
      { href: "/primary/math",     label: "数学",       color: "#1a3870" },
      { href: "/primary/english",  label: "英语",       color: "#1a5c3a" },
      { href: "/primary/science",  label: "科学",       color: "#2d5a1a" },
      { href: "/primary/ethics",   label: "道德与法治", color: "#5a2d70" },
    ],
  },
  {
    key: "subjects",
    label: "学科",
    subjects: [
      { href: "/subjects/psychology", label: "心理学",        color: "#6b2d6e" },
      { href: "/subjects/biology",    label: "生物学",        color: "#1a5c34" },
      { href: "/subjects/physics",    label: "物理学",        color: "#003087" },
      { href: "/subjects/sociology",  label: "社会学",        color: "#7a4018" },
      { href: "/subjects/ai-theory",  label: "AI 理论基础",  color: "#1a4a5c" },
      { href: "/subjects/google-ai",  label: "GoogleAI 动态", color: "#1a5c3a" },
      { href: "/subjects/anthropic",  label: "Anthropic 动态", color: "#3a1a5c" },
      { href: "/subjects/philosophy", label: "哲学",          color: "#3a2870" },
      { href: "/subjects/theology",   label: "神学",          color: "#7a1c30" },
      { href: "/subjects/medicine",   label: "现代医学",      color: "#1a5c4a" },
    ],
  },
];

function getDefaultExpanded(pathname: string): string | null {
  if (pathname.startsWith("/primary"))    return "primary";
  if (pathname.startsWith("/middle"))     return "middle";
  if (pathname.startsWith("/highschool")) return "high";
  if (pathname.startsWith("/subjects"))   return "subjects";
  return null;
}

export default function MobileNav() {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState<"my" | "more" | null>(null);
  const [expanded, setExpanded] = useState<string | null>(() => getDefaultExpanded(pathname));

  useEffect(() => {
    setDrawer(null);
    setExpanded(getDefaultExpanded(pathname));
  }, [pathname]);

  const myActive = MY_ITEMS.some((i) => pathname.startsWith(i.href));
  const moreActive = MORE_SECTIONS.some((s) => s.subjects.some((sub) => pathname.startsWith(sub.href)));

  function toggleSection(key: string) {
    setExpanded((prev) => (prev === key ? null : key));
  }

  function toggleDrawer(d: "my" | "more") {
    setDrawer((prev) => (prev === d ? null : d));
  }

  return (
    <>
      {drawer && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setDrawer(null)} />
      )}

      {/* "我的" drawer */}
      <div
        className={`fixed left-0 right-0 bottom-[56px] bg-[#f5f2eb] border-t border-[#d8d4ca] z-50 md:hidden transition-transform duration-250 ease-out ${
          drawer === "my" ? "translate-y-0" : "translate-y-full"
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

      {/* "更多" drawer */}
      <div
        className={`fixed left-0 right-0 bottom-[56px] bg-[#f5f2eb] border-t border-[#d8d4ca] z-50 md:hidden transition-transform duration-250 ease-out ${
          drawer === "more" ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "72vh", overflowY: "auto" }}
      >
        <div className="px-4 pt-3 pb-6">
          <div className="w-8 h-0.5 bg-[#d8d4ca] mx-auto mb-4" />
          <div className="space-y-1">
            {MORE_SECTIONS.map((section) => {
              const isExpanded = expanded === section.key;
              const sectionActive = section.subjects.some((s) => pathname.startsWith(s.href));
              return (
                <div key={section.key} className="border border-[#d8d4ca]" style={{ backgroundColor: isExpanded ? "#fff" : "#f5f2eb" }}>
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="w-full flex items-center justify-between px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[13px] font-semibold ${sectionActive ? "text-[#003087]" : "text-[#1c1a16]"}`}>
                        {section.label}
                      </span>
                      <span className="text-[10px] text-[#9a9590]">{section.subjects.length} 科</span>
                    </div>
                    <span className={`text-[10px] text-[#9a9590] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 grid grid-cols-3 gap-1.5 border-t border-[#e4e0d8] pt-2.5">
                      {section.subjects.map((s) => {
                        const active = pathname.startsWith(s.href);
                        return (
                          <Link
                            key={s.href}
                            href={s.href}
                            className={`flex items-center gap-1.5 py-2 px-2 border text-[12px] transition-colors ${
                              active ? "bg-white font-semibold" : "border-[#e4e0d8] text-[#5a5550]"
                            }`}
                            style={active ? { borderColor: s.color, color: s.color } : undefined}
                          >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="truncate">{s.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
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
          onClick={() => toggleDrawer("my")}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[11px] tracking-wide transition-colors ${
            myActive || drawer === "my" ? "text-[#003087] font-semibold" : "text-[#9a9590]"
          }`}
        >
          我的
        </button>

        <button
          onClick={() => toggleDrawer("more")}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[11px] tracking-wide transition-colors ${
            moreActive || drawer === "more" ? "text-[#003087] font-semibold" : "text-[#9a9590]"
          }`}
        >
          更多
        </button>
      </nav>
    </>
  );
}
