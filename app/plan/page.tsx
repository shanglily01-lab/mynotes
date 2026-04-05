"use client";

import { useEffect, useState } from "react";
import PlanCard from "@/components/plan/PlanCard";

interface PlanItem {
  id: string;
  title: string;
  content: string;
  done: boolean;
  subject: { id: string; name: string };
}

interface DailyPlan {
  id: string;
  date: string;
  items: PlanItem[];
}

export default function PlanPage() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPlan() {
    const r = await fetch("/api/plan/today");
    const d = await r.json();
    setPlan(d.plan ?? null);
  }

  useEffect(() => { loadPlan().finally(() => setLoading(false)); }, []);

  async function handleGenerate() {
    setGenerating(true);
    setMessage("正在生成...");
    try {
      const res = await fetch("/api/plan/generate", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setMessage(data.cached ? "今日计划已存在" : "生成成功");
        await loadPlan();
      } else {
        setMessage("生成失败: " + (data.error as string));
      }
    } catch { setMessage("生成失败"); }
    finally { setGenerating(false); }
  }

  async function handleToggle(itemId: string, done: boolean) {
    await fetch("/api/plan/toggle", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, done }),
    });
    setPlan((prev) => prev ? {
      ...prev,
      items: prev.items.map((i) => i.id === itemId ? { ...i, done } : i),
    } : prev);
  }

  const doneCount = plan?.items.filter((i) => i.done).length ?? 0;
  const totalCount = plan?.items.length ?? 0;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="border-b border-[#d8d4ca] pb-5">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">
          {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
        </p>
        <div className="flex items-end justify-between">
          <h1
            className="text-3xl font-bold text-[#1c1a16]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            今日学习计划
          </h1>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-1.5 text-[13px] bg-[#003087] text-white hover:bg-[#00256a] transition-colors disabled:opacity-40"
          >
            {generating ? "生成中..." : "生成/刷新"}
          </button>
        </div>

        {/* Progress */}
        {plan && totalCount > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-[11px] text-[#9a9590] uppercase tracking-wide mb-1.5">
              <span>完成进度</span>
              <span>{doneCount} / {totalCount} &nbsp;({pct}%)</span>
            </div>
            <div className="h-0.5 bg-[#e4e0d8]">
              <div className="h-full bg-[#003087] transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>

      {message && (
        <p className="text-[13px] text-[#003087] border-l-2 border-[#003087] pl-3">{message}</p>
      )}

      {loading ? (
        <p className="text-[13px] text-[#9a9590] italic py-10 text-center">加载中...</p>
      ) : !plan ? (
        <div className="text-center py-16 border border-dashed border-[#d8d4ca]">
          <p className="text-[14px] text-[#9a9590] italic mb-4">今日尚无学习计划</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-2 text-[13px] bg-[#003087] text-white hover:bg-[#00256a] disabled:opacity-40"
          >
            立即生成
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {plan.items.map((item) => (
            <PlanCard
              key={item.id}
              id={item.id}
              title={item.title}
              content={item.content}
              subjectName={item.subject.name}
              done={item.done}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
