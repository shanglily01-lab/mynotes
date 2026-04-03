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

  async function loadSubjects() {
    const r = await fetch("/api/subjects");
    const d = await r.json();
    setSubjects(d.subjects ?? []);
  }

  useEffect(() => {
    loadSubjects().finally(() => setLoading(false));
  }, []);

  async function handleFetchContent() {
    setFetching(true);
    setMessage("正在拉取最新内容...");
    try {
      const res = await fetch("/api/content/fetch", { method: "POST" });
      const data = await res.json();
      const total = Object.values(data.inserted as Record<string, number>).reduce(
        (a, b) => a + b,
        0
      );
      setMessage(`拉取完成，新增 ${total} 篇文章`);
    } catch {
      setMessage("拉取失败，请检查网络");
    } finally {
      setFetching(false);
    }
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
        setMessage("计划生成失败: " + (data.error as string));
      }
    } catch {
      setMessage("计划生成失败");
    } finally {
      setFetching(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学习仪表盘</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFetchContent}
            disabled={fetching}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            拉取内容
          </button>
          <button
            onClick={handleGeneratePlan}
            disabled={fetching}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            生成今日计划
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s) => (
            <SubjectCard key={s.id} {...s} />
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/plan"
          className="block p-5 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-gray-800 mb-1">今日学习计划</h3>
          <p className="text-sm text-gray-500">查看并完成今天的学习任务</p>
        </Link>
        <Link
          href="/exam"
          className="block p-5 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-gray-800 mb-1">本周考试</h3>
          <p className="text-sm text-gray-500">检验本周学习成果</p>
        </Link>
      </div>
    </div>
  );
}
