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

  useEffect(() => {
    loadPlan().finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setMessage("正在生成计划...");
    try {
      const res = await fetch("/api/plan/generate", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setMessage(data.cached ? "今日计划已存在" : "生成成功");
        await loadPlan();
      } else {
        setMessage("生成失败: " + (data.error as string));
      }
    } catch {
      setMessage("生成失败");
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggle(itemId: string, done: boolean) {
    await fetch("/api/plan/toggle", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, done }),
    });
    setPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((i) => (i.id === itemId ? { ...i, done } : i)),
      };
    });
  }

  const doneCount = plan?.items.filter((i) => i.done).length ?? 0;
  const totalCount = plan?.items.length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">今日学习计划</h1>
          {plan && (
            <p className="text-sm text-gray-500 mt-1">
              已完成 {doneCount}/{totalCount} 项
            </p>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? "生成中..." : "生成/刷新计划"}
        </button>
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : !plan ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">今日还没有学习计划</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            立即生成
          </button>
        </div>
      ) : (
        <div className="space-y-3">
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
