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

const SUBJECT_COLOR: Record<string, string> = {
  psychology: "#6b2d6e",
  biology:    "#1a5c34",
  physics:    "#003087",
  sociology:  "#7a4018",
  "ai-news":  "#1a5060",
  philosophy: "#3a2870",
  theology:   "#7a1c30",
};

export default function SubjectCard({ id, name, todayDone, todayTotal, weekScore, weekTotal }: SubjectCardProps) {
  const color = SUBJECT_COLOR[id] ?? "#003087";
  const progress = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;
  const weekPct = weekScore !== null && weekTotal ? Math.round((weekScore / weekTotal) * 100) : null;

  return (
    <Link
      href={`/subjects/${id}`}
      className="block bg-white border border-[#d8d4ca] hover:border-[#003087] transition-colors p-4 group"
    >
      {/* Subject name */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span
          className="text-[15px] font-semibold text-[#1c1a16] group-hover:text-[#003087] transition-colors"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          {name}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-2.5">
        <div className="flex justify-between text-[11px] text-[#9a9590] mb-1">
          <span className="uppercase tracking-wide">今日任务</span>
          <span>{todayDone} / {todayTotal}</span>
        </div>
        <div className="h-0.5 bg-[#e4e0d8] w-full">
          <div
            className="h-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: color }}
          />
        </div>
      </div>

      {/* Week score */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#9a9590] uppercase tracking-wide">本周得分</span>
        {weekPct !== null ? (
          <span className="font-medium text-[#5a5550]">{weekScore}/{weekTotal} ({weekPct}%)</span>
        ) : (
          <span className="text-[#9a9590] italic">暂无</span>
        )}
      </div>
    </Link>
  );
}
