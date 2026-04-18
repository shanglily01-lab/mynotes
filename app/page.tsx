"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const HIGH_SCHOOL = [
  { href: "/highschool/chinese",   label: "语文", color: "#8b1a2a" },
  { href: "/highschool/math",      label: "数学", color: "#1a3870" },
  { href: "/highschool/english",   label: "英语", color: "#1a5c3a" },
  { href: "/highschool/physics",   label: "物理", color: "#2d1a70" },
  { href: "/highschool/chemistry", label: "化学", color: "#7a4a00" },
  { href: "/highschool/biology",   label: "生物", color: "#1a5c20" },
];

const MIDDLE_SCHOOL = [
  { href: "/middle/chinese",   label: "语文",       color: "#8b1a2a" },
  { href: "/middle/math",      label: "数学",       color: "#1a3870" },
  { href: "/middle/english",   label: "英语",       color: "#1a5c3a" },
  { href: "/middle/physics",   label: "物理",       color: "#2d1a70" },
  { href: "/middle/chemistry", label: "化学",       color: "#7a4a00" },
  { href: "/middle/biology",   label: "生物",       color: "#1a5c20" },
  { href: "/middle/history",   label: "历史",       color: "#5a3a1a" },
  { href: "/middle/geography", label: "地理",       color: "#1a4a5c" },
  { href: "/middle/ethics",    label: "道德与法治", color: "#5a2d70" },
];

const PRIMARY_SCHOOL = [
  { href: "/primary/chinese",  label: "语文",       color: "#8b1a2a" },
  { href: "/primary/math",     label: "数学",       color: "#1a3870" },
  { href: "/primary/english",  label: "英语",       color: "#1a5c3a" },
  { href: "/primary/science",  label: "科学",       color: "#2d5a1a" },
  { href: "/primary/ethics",   label: "道德与法治", color: "#5a2d70" },
];

const SUBJECTS = [
  { href: "/subjects/psychology", label: "心理学",      color: "#6b2d6e" },
  { href: "/subjects/biology",    label: "生物学",      color: "#1a5c34" },
  { href: "/subjects/physics",    label: "物理学",      color: "#003087" },
  { href: "/subjects/sociology",  label: "社会学",      color: "#7a4018" },
  { href: "/subjects/ai-theory",  label: "AI 理论基础", color: "#1a4a5c" },
  { href: "/subjects/google-ai",  label: "GoogleAI 动态", color: "#1a5c3a" },
  { href: "/subjects/anthropic",  label: "Anthropic 动态", color: "#3a1a5c" },
  { href: "/subjects/philosophy", label: "哲学",        color: "#3a2870" },
  { href: "/subjects/theology",   label: "神学",        color: "#7a1c30" },
  { href: "/subjects/medicine",   label: "现代医学",    color: "#1a5c4a" },
];

const QUICK_LINKS = [
  { href: "/plan",           label: "今日学习计划", desc: "查看并完成今天的学习任务" },
  { href: "/exam",           label: "本周考试",     desc: "检验本周各学科学习成果" },
  { href: "/english",        label: "每日英语",     desc: "短文朗读与词汇练习" },
  { href: "/subjects/news",  label: "每日新闻",     desc: "今日热点资讯" },
  { href: "/health",         label: "糖尿病管理",   desc: "健康数据记录与管理" },
];

function SchoolSection({ title, subtitle, subjects }: {
  title: string;
  subtitle: string;
  subjects: { href: string; label: string; color: string }[];
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3">
        <p className="text-[13px] font-semibold text-[#1c1a16]"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>
          {title}
        </p>
        <p className="text-[10px] text-[#9a9590]">{subtitle}</p>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {subjects.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#e4e0d8] bg-white text-[12px] text-[#5a5550] hover:border-current transition-colors"
            style={{ ["--hover-color" as string]: s.color } as React.CSSProperties}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = s.color;
              (e.currentTarget as HTMLElement).style.borderColor = s.color;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "";
              (e.currentTarget as HTMLElement).style.borderColor = "";
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="truncate">{s.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState("");
  const [fetchLogs, setFetchLogs] = useState<string[]>([]);

  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(new Date().toLocaleDateString("zh-CN", {
      year: "numeric", month: "long", day: "numeric", weekday: "long",
    }));
  }, []);

  async function handleFetchContent() {
    setFetching(true);
    setFetchLogs([]);
    setMessage("正在拉取最新内容...");
    try {
      const res = await fetch("/api/content/fetch", { method: "POST" });
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = JSON.parse(line.slice(6)) as { msg?: string; done?: boolean; inserted?: Record<string, number>; error?: string };
          if (json.msg) setFetchLogs((p) => [...p, json.msg!]);
          if (json.done) {
            const total = Object.values(json.inserted ?? {}).reduce((a, b) => a + b, 0);
            setMessage(`拉取完成，新增 ${total} 篇`);
          }
          if (json.error) setMessage(`拉取出错: ${json.error}`);
        }
      }
    } catch { setMessage("拉取失败"); }
    finally { setFetching(false); }
  }

  async function handleGeneratePlan() {
    setFetching(true);
    setMessage("正在生成今日计划...");
    try {
      const res = await fetch("/api/plan/generate", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setMessage(data.cached ? "今日计划已存在" : "今日计划生成成功");
      } else {
        setMessage("生成失败: " + (data.error as string));
      }
    } catch { setMessage("生成失败"); }
    finally { setFetching(false); }
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="border-b border-[#d8d4ca] pb-5 mb-6">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">{today}</p>
        <h1
          className="text-3xl font-bold text-[#1c1a16]"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          自我成长
        </h1>
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleFetchContent}
            disabled={fetching}
            className="px-4 py-1.5 text-[13px] border border-[#d8d4ca] text-[#5a5550] hover:border-[#003087] hover:text-[#003087] transition-colors disabled:opacity-40"
          >
            {fetching ? "拉取中..." : "拉取内容"}
          </button>
          <button
            onClick={handleGeneratePlan}
            disabled={fetching}
            className="px-4 py-1.5 text-[13px] bg-[#003087] text-white hover:bg-[#00256a] transition-colors disabled:opacity-40"
          >
            生成今日计划
          </button>
        </div>
      </div>

      {/* Log */}
      {(message || fetchLogs.length > 0) && (
        <div className="border border-[#d8d4ca] mb-6">
          {message && (
            <div className="px-4 py-2 text-[13px] text-[#003087] border-b border-[#e4e0d8] bg-[#eef1f8]">
              {message}
            </div>
          )}
          {fetchLogs.length > 0 && (
            <div className="bg-[#1c1a16] text-[#d8d4ca] text-[11px] font-mono p-4 max-h-36 overflow-y-auto">
              {fetchLogs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
          )}
        </div>
      )}

      {/* School stages */}
      <div className="space-y-0">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-4">基础学习</p>

        <SchoolSection title="高中学习" subtitle="高中课程" subjects={HIGH_SCHOOL} />

        <div className="border-t border-[#e4e0d8] my-5" />

        <SchoolSection title="初中学习" subtitle="初中课程" subjects={MIDDLE_SCHOOL} />

        <div className="border-t border-[#e4e0d8] my-5" />

        <SchoolSection title="小学学习" subtitle="小学课程" subjects={PRIMARY_SCHOOL} />
      </div>

      {/* Extended subjects */}
      <div className="border-t border-[#d8d4ca] pt-6 mt-6">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-4">学科学习</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {SUBJECTS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-2 px-3 py-2.5 border border-[#e4e0d8] bg-white text-[12px] text-[#5a5550] hover:bg-[#f5f2eb] transition-colors"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="truncate">{s.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick access */}
      <div className="border-t border-[#d8d4ca] pt-6 mt-6">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-3">快捷访问</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0 border border-[#d8d4ca] divide-y sm:divide-y-0 sm:divide-x divide-[#d8d4ca]">
          {QUICK_LINKS.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block bg-white px-5 py-4 hover:bg-[#eef1f8] transition-colors group"
            >
              <h3
                className="text-[14px] font-semibold text-[#1c1a16] group-hover:text-[#003087] transition-colors mb-1"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
              >
                {item.label}
              </h3>
              <p className="text-[12px] text-[#9a9590]">{item.desc}</p>
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-t-0 border-[#d8d4ca] divide-y sm:divide-y-0 sm:divide-x divide-[#d8d4ca]">
          {QUICK_LINKS.slice(3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block bg-white px-5 py-4 hover:bg-[#eef1f8] transition-colors group"
            >
              <h3
                className="text-[14px] font-semibold text-[#1c1a16] group-hover:text-[#003087] transition-colors mb-1"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
              >
                {item.label}
              </h3>
              <p className="text-[12px] text-[#9a9590]">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
