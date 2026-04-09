"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ExamSubject {
  subjectId: string;
  pct: number;
}

interface MonthData {
  month: string;
  label: string;
  english: { days: number; topics: string[] };
  plans: { done: number; total: number };
  exams: { avgPct: number | null; subjects: ExamSubject[] };
  articles: number;
}

const SUBJECT_NAMES: Record<string, string> = {
  psychology: "心理学",
  biology:    "生物学",
  physics:    "物理学",
  sociology:  "社会学",
  philosophy: "哲学",
  theology:   "神学",
  medicine:   "现代医学",
  diabetes:   "糖尿病管理",
  "ai-news":  "AI 日报",
};

const SUBJECT_COLOR: Record<string, string> = {
  psychology: "#6b2d6e",
  biology:    "#1a5c34",
  physics:    "#003087",
  sociology:  "#7a4018",
  philosophy: "#3a2870",
  theology:   "#7a1c30",
  medicine:   "#1a5c4a",
  diabetes:   "#8b1a1a",
  "ai-news":  "#1a5060",
};

function StatBox({
  label, value, sub, href,
}: {
  label: string; value: string | number; sub?: string; href?: string;
}) {
  const inner = (
    <div className={`bg-[#f5f2eb] px-4 py-3 ${href ? "hover:bg-[#ece8df] transition-colors cursor-pointer" : ""}`}>
      <p className="text-[10px] tracking-[0.15em] uppercase text-[#9a9590] mb-1">{label}</p>
      <p
        className="text-[22px] font-bold text-[#1c1a16] leading-none"
        style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-[#9a9590] mt-1">{sub}</p>}
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function MonthCard({ data, defaultOpen }: { data: MonthData; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const planPct = data.plans.total > 0
    ? Math.round((data.plans.done / data.plans.total) * 100)
    : null;

  return (
    <div className="bg-white border border-[#d8d4ca]">
      {/* Month header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f5f2eb] transition-colors"
      >
        <div className="flex items-baseline gap-3">
          <span
            className="text-[18px] font-bold text-[#1c1a16]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            {data.label}
          </span>
          <span className="text-[12px] text-[#9a9590]">
            {[
              data.english.days > 0 && `英语 ${data.english.days} 天`,
              data.plans.total > 0 && `完成 ${data.plans.done}/${data.plans.total} 项`,
              data.exams.avgPct !== null && `均分 ${data.exams.avgPct}%`,
            ].filter(Boolean).join(" · ")}
          </span>
        </div>
        <span className="text-[#9a9590] text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-[#e4e0d8] px-5 py-5 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatBox
              label="英语学习"
              value={data.english.days}
              sub={data.english.days > 0 ? "天" : "暂无"}
              href="/english"
            />
            <StatBox
              label="计划完成"
              value={planPct !== null ? `${planPct}%` : "—"}
              sub={data.plans.total > 0 ? `${data.plans.done} / ${data.plans.total} 项` : "暂无"}
              href="/plan"
            />
            <StatBox
              label="考试均分"
              value={data.exams.avgPct !== null ? `${data.exams.avgPct}%` : "—"}
              sub={data.exams.subjects.length > 0 ? `${data.exams.subjects.length} 科` : "暂无"}
              href="/exam"
            />
            <StatBox
              label="文章收录"
              value={data.articles}
              sub={data.articles > 0 ? "篇" : "暂无"}
              href="/subjects/news"
            />
          </div>

          {/* English topics */}
          {data.english.topics.length > 0 && (
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#9a9590] mb-2">英语话题</p>
              <div className="flex flex-wrap gap-1.5">
                {data.english.topics.map((t, i) => (
                  <Link
                    key={i}
                    href="/english"
                    className="text-[11px] px-2 py-0.5 border border-[#d8d4ca] text-[#5a5550] capitalize hover:border-[#003087] hover:text-[#003087] transition-colors"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Exam scores by subject */}
          {data.exams.subjects.length > 0 && (
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#9a9590] mb-2">各科成绩</p>
              <div className="space-y-2">
                {data.exams.subjects.map((s) => {
                  const color = SUBJECT_COLOR[s.subjectId] ?? "#003087";
                  return (
                    <Link
                      key={s.subjectId}
                      href={`/subjects/${s.subjectId}`}
                      className="flex items-center gap-3 group"
                    >
                      <span className="text-[12px] text-[#5a5550] w-16 flex-shrink-0 group-hover:text-[#1c1a16] transition-colors">
                        {SUBJECT_NAMES[s.subjectId] ?? s.subjectId}
                      </span>
                      <div className="flex-1 h-0.5 bg-[#e4e0d8]">
                        <div
                          className="h-full transition-all"
                          style={{ width: `${s.pct}%`, backgroundColor: color }}
                        />
                      </div>
                      <span
                        className="text-[13px] font-semibold w-10 text-right flex-shrink-0"
                        style={{ color, fontFamily: "var(--font-playfair, Georgia, serif)" }}
                      >
                        {s.pct}%
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MonthlyPage() {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/monthly")
      .then((r) => r.json())
      .then((d) => setMonths(d.months ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-7">
      <div className="border-b border-[#d8d4ca] pb-5">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">学习档案</p>
        <h1
          className="text-3xl font-bold text-[#1c1a16]"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          月度回顾
        </h1>
        <p className="text-[13px] text-[#9a9590] mt-1">按月汇总英语、学科计划、考试记录</p>
      </div>

      {loading ? (
        <p className="text-center py-16 text-[13px] text-[#9a9590] italic">加载中...</p>
      ) : months.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#d8d4ca]">
          <p className="text-[14px] text-[#9a9590] italic">暂无学习记录</p>
          <p className="text-[12px] text-[#9a9590] mt-1">完成今日计划、英语练习或每周考试后会在这里显示</p>
        </div>
      ) : (
        <div className="space-y-2">
          {months.map((m, i) => (
            <MonthCard key={m.month} data={m} defaultOpen={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
