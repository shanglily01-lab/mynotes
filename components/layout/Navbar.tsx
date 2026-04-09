"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MAIN_NAV = [
  { href: "/",         label: "仪表盘" },
  { href: "/plan",     label: "今日计划" },
  { href: "/exam",     label: "每周考试" },
  { href: "/progress", label: "学习进度" },
  { href: "/monthly",  label: "月度回顾" },
];

const SUBJECTS = [
  { href: "/subjects/psychology", label: "心理学",    color: "#6b2d6e" },
  { href: "/subjects/biology",    label: "生物学",    color: "#1a5c34" },
  { href: "/subjects/physics",    label: "物理学",    color: "#003087" },
  { href: "/subjects/sociology",  label: "社会学",    color: "#7a4018" },
  { href: "/subjects/philosophy", label: "哲学",      color: "#3a2870" },
  { href: "/subjects/theology",   label: "神学",      color: "#7a1c30" },
  { href: "/subjects/medicine",   label: "现代医学",  color: "#1a5c4a" },
  { href: "/subjects/diabetes",   label: "糖尿病管理", color: "#8b1a1a" },
];

const TOOLS = [
  { href: "/english",          label: "每日英语" },
  { href: "/subjects/news",    label: "每日新闻" },
  { href: "/books",            label: "书籍笔记" },
  { href: "/chat",             label: "AI 助手" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] tracking-[0.18em] uppercase text-[#9a9590] font-medium mb-1 px-2 mt-0.5">
      {children}
    </p>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`block text-[13px] px-2 py-1 mb-0.5 border-l-2 transition-colors ${
        active
          ? "border-[#003087] text-[#003087] font-semibold"
          : "border-transparent text-[#5a5550] hover:text-[#1c1a16] hover:border-[#d8d4ca]"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{ display: "flex", position: "fixed", left: 0, top: 0, height: "100vh", width: 220, zIndex: 40, flexDirection: "column", backgroundColor: "#f5f2eb", borderRight: "1px solid #d8d4ca" }}>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-[#d8d4ca]">
        <Link href="/" className="block">
          <span
            className="block text-[18px] font-bold leading-tight text-[#1c1a16]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            自我成长
          </span>
          <span className="block text-[9px] tracking-[0.2em] uppercase text-[#9a9590] mt-0.5">
            Scholar Notes
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        <div>
          <SectionLabel>导航</SectionLabel>
          {MAIN_NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
            />
          ))}
        </div>

        <div>
          <SectionLabel>学科</SectionLabel>
          {SUBJECTS.map((s) => {
            const active = pathname === s.href || pathname.startsWith(s.href + "/");
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`flex items-center gap-2 text-[13px] px-2 py-1 mb-0.5 border-l-2 transition-colors ${
                  active
                    ? "text-[#1c1a16] font-semibold"
                    : "border-transparent text-[#5a5550] hover:text-[#1c1a16] hover:border-[#d8d4ca]"
                }`}
                style={active ? { borderColor: s.color } : undefined}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.color, opacity: active ? 1 : 0.6 }}
                />
                {s.label}
              </Link>
            );
          })}
        </div>

        <div>
          <SectionLabel>工具</SectionLabel>
          {TOOLS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </div>
      </nav>

      <div className="px-5 py-3 border-t border-[#d8d4ca]">
        <p className="text-[10px] text-[#9a9590] italic">每日学习 · 每周考试</p>
      </div>
    </aside>
  );
}
