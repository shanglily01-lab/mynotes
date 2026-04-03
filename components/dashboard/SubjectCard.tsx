"use client";

import Link from "next/link";

interface SubjectCardProps {
  id: string;
  name: string;
  todayDone: number;
  todayTotal: number;
  weekScore: number | null;
  weekTotal: number | null;
}

const SUBJECT_COLORS: Record<string, string> = {
  psychology: "bg-purple-50 border-purple-200",
  biology: "bg-green-50 border-green-200",
  physics: "bg-blue-50 border-blue-200",
  sociology: "bg-orange-50 border-orange-200",
  "ai-news": "bg-cyan-50 border-cyan-200",
};

const SUBJECT_ACCENT: Record<string, string> = {
  psychology: "text-purple-700",
  biology: "text-green-700",
  physics: "text-blue-700",
  sociology: "text-orange-700",
  "ai-news": "text-cyan-700",
};

export default function SubjectCard({
  id,
  name,
  todayDone,
  todayTotal,
  weekScore,
  weekTotal,
}: SubjectCardProps) {
  const progress = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;
  const colorClass = SUBJECT_COLORS[id] ?? "bg-gray-50 border-gray-200";
  const accentClass = SUBJECT_ACCENT[id] ?? "text-gray-700";

  return (
    <Link
      href={`/subjects/${id}`}
      className={`block rounded-lg border p-5 hover:shadow-md transition-shadow ${colorClass}`}
    >
      <h3 className={`font-bold text-lg mb-3 ${accentClass}`}>{name}</h3>

      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>今日进度</span>
          <span>
            {todayDone}/{todayTotal}
          </span>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-200">
          <div
            className="h-full bg-current rounded-full transition-all"
            style={{ width: `${progress}%`, color: "inherit" }}
          />
        </div>
      </div>

      {weekScore !== null && weekTotal !== null && (
        <div className="text-sm text-gray-600">
          本周得分：
          <span className={`font-semibold ${accentClass}`}>
            {weekScore}/{weekTotal}
          </span>
        </div>
      )}
    </Link>
  );
}
