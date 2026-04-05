"use client";

import { useEffect, useState } from "react";
import SubjectCard from "@/components/dashboard/SubjectCard";
import Link from "next/link";

interface SubjectInfo {
  id: string;
  name: string;
  todayDone: number;
  todayTotal: number;
  weekScore: number | null;
  weekTotal: number | null;
}

export default function DashboardPage() {
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState("");
  const [fetchLogs, setFetchLogs] = useState<string[]>([]);

  async function loadSubjects() {
    const r = await fetch("/api/subjects");
    const d = await r.json();
    setSubjects(d.subjects ?? []);
  }

  useEffect(() => { loadSubjects().finally(() => setLoading(false)); }, []);

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
        await loadSubjects();
      } else {
        setMessage("生成失败: " + (data.error as string));
      }
    } catch { setMessage("生成失败"); }
    finally { setFetching(false); }
  }

  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="border-b border-[#d8d4ca] pb-5">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">{today}</p>
        <h1
          className="text-3xl font-bold text-[#1c1a16]"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          学习仪表盘
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
        <div className="border border-[#d8d4ca]">
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

      {/* Subjects */}
      <div>
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-3">学科概览</p>
        {loading ? (
          <p className="text-[13px] text-[#9a9590] italic py-8 text-center">加载中...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {subjects.map((s) => <SubjectCard key={s.id} {...s} />)}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="border-t border-[#d8d4ca] pt-6">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-3">快速访问</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#d8d4ca] divide-y md:divide-y-0 md:divide-x divide-[#d8d4ca]">
          {[
            { href: "/plan",    title: "今日学习计划", desc: "查看并完成今天的学习任务" },
            { href: "/exam",    title: "本周考试",     desc: "检验本周各学科学习成果" },
            { href: "/english", title: "每日英语",     desc: "短文朗读与词汇发音练习" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block bg-white px-5 py-4 hover:bg-[#eef1f8] transition-colors group"
            >
              <h3
                className="text-[14px] font-semibold text-[#1c1a16] group-hover:text-[#003087] transition-colors mb-1"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
              >
                {item.title}
              </h3>
              <p className="text-[12px] text-[#9a9590]">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
