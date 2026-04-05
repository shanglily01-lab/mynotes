"use client";

import { useEffect, useState } from "react";

interface ProgressRecord {
  id: string;
  weekStart: string;
  score: number | null;
  totalQ: number | null;
  evaluation: string | null;
}

interface SubjectProgress {
  subjectId: string;
  subjectName: string;
  history: ProgressRecord[];
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

function getWeekLabel(dateStr: string) {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${d.getFullYear()} W${week}`;
}

export default function ProgressPage() {
  const [data, setData] = useState<SubjectProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => setData(d.progress ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-7">
      <div className="border-b border-[#d8d4ca] pb-5">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">历史记录</p>
        <h1
          className="text-3xl font-bold text-[#1c1a16]"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          学习进度
        </h1>
      </div>

      {loading ? (
        <p className="text-[13px] text-[#9a9590] italic py-10 text-center">加载中...</p>
      ) : data.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#d8d4ca]">
          <p className="text-[14px] text-[#9a9590] italic">暂无考试记录</p>
          <p className="text-[12px] text-[#9a9590] mt-1">完成每周考试后会在这里显示历史成绩</p>
        </div>
      ) : (
        <div className="space-y-5">
          {data.map((subject) => {
            const color = SUBJECT_COLOR[subject.subjectId] ?? "#003087";
            return (
              <div key={subject.subjectId} className="bg-white border border-[#d8d4ca]">
                {/* Subject header */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-[#e4e0d8]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span
                    className="text-[15px] font-semibold text-[#1c1a16]"
                    style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                  >
                    {subject.subjectName}
                  </span>
                </div>

                {subject.history.length === 0 ? (
                  <p className="px-5 py-4 text-[13px] text-[#9a9590] italic">暂无考试记录</p>
                ) : (
                  <div className="divide-y divide-[#e4e0d8]">
                    {subject.history.map((record) => {
                      const pct = record.score !== null && record.totalQ
                        ? Math.round((record.score / record.totalQ) * 100)
                        : null;
                      return (
                        <div key={record.id} className="flex items-start gap-4 px-5 py-3">
                          <span className="text-[11px] text-[#9a9590] tabular-nums pt-0.5 w-16 flex-shrink-0">
                            {getWeekLabel(record.weekStart)}
                          </span>
                          <div className="flex-1">
                            {pct !== null && record.score !== null && record.totalQ !== null && (
                              <div className="flex items-center gap-3 mb-1.5">
                                <span
                                  className="text-[15px] font-bold"
                                  style={{ color, fontFamily: "var(--font-playfair, Georgia, serif)" }}
                                >
                                  {pct}%
                                </span>
                                <div className="flex-1 h-0.5 bg-[#e4e0d8]">
                                  <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                                </div>
                                <span className="text-[11px] text-[#9a9590]">{record.score}/{record.totalQ}</span>
                              </div>
                            )}
                            {record.evaluation && (
                              <p className="text-[12px] text-[#5a5550] leading-relaxed italic">{record.evaluation}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
