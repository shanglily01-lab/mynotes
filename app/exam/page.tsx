"use client";

import { useEffect, useState } from "react";
import QuestionCard from "@/components/exam/QuestionCard";

interface ExamQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  answer: string;
  explain: string;
  userAns: { answer: string; correct: boolean } | null;
}

interface Exam {
  id: string;
  weekStart: string;
  questions: ExamQuestion[];
}

function getWeekLabel(dateStr: string) {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${d.getFullYear()} 年第 ${week} 周`;
}

export default function ExamPage() {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [scores, setScores] = useState<Record<string, { correct: number; total: number }>>({});
  const [evaluations, setEvaluations] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function loadExam() {
    const r = await fetch("/api/exam/current");
    const d = await r.json();
    if (d.exam) {
      setExam(d.exam);
      const existing: Record<string, string> = {};
      let allAnswered = true;
      for (const q of d.exam.questions as ExamQuestion[]) {
        if (q.userAns) existing[q.id] = q.userAns.answer;
        else allAnswered = false;
      }
      setAnswers(existing);
      if (allAnswered && d.exam.questions.length > 0) setSubmitted(true);
    }
  }

  useEffect(() => { loadExam().finally(() => setLoading(false)); }, []);

  async function handleGenerate() {
    setGenerating(true);
    setMessage("正在生成考试题...");
    try {
      const res = await fetch("/api/exam/generate", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setMessage(data.cached ? "本周考试已存在" : "生成成功");
        await loadExam();
      } else { setMessage("生成失败: " + (data.error as string)); }
    } catch { setMessage("生成失败"); }
    finally { setGenerating(false); }
  }

  async function handleSubmit() {
    if (!exam) return;
    setMessage("提交中...");
    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: exam.id,
          answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setScores(data.scores as Record<string, { correct: number; total: number }>);
        setEvaluations(data.evaluations as Record<string, string>);
        setSubmitted(true);
        setMessage("");
        await loadExam();
      } else { setMessage("提交失败"); }
    } catch { setMessage("提交失败"); }
  }

  const answeredCount = Object.keys(answers).length;
  const totalCount = exam?.questions.length ?? 0;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="border-b border-[#d8d4ca] pb-5">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">
          {exam ? getWeekLabel(exam.weekStart) : "本周"}
        </p>
        <div className="flex items-end justify-between">
          <h1
            className="text-3xl font-bold text-[#1c1a16]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            每周考试
          </h1>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-1.5 text-[13px] border border-[#d8d4ca] text-[#5a5550] hover:border-[#003087] hover:text-[#003087] transition-colors disabled:opacity-40"
          >
            {generating ? "生成中..." : "生成/刷新"}
          </button>
        </div>
        {exam && !submitted && (
          <p className="text-[12px] text-[#9a9590] mt-2">已答 {answeredCount} / {totalCount} 题</p>
        )}
      </div>

      {message && (
        <p className="text-[13px] text-[#003087] border-l-2 border-[#003087] pl-3">{message}</p>
      )}

      {/* Results */}
      {submitted && Object.keys(scores).length > 0 && (
        <div className="border border-[#d8d4ca] bg-white">
          <div className="px-5 py-3 border-b border-[#e4e0d8]">
            <h2
              className="text-[16px] font-bold text-[#1c1a16]"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              考试结果
            </h2>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-4">
              {Object.entries(scores).map(([subject, s]) => {
                const pct = Math.round((s.correct / s.total) * 100);
                return (
                  <div key={subject} className="text-center border border-[#e4e0d8] py-3">
                    <p className="text-[10px] tracking-wide uppercase text-[#9a9590] mb-1">{subject}</p>
                    <p
                      className="text-xl font-bold text-[#1c1a16]"
                      style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                    >
                      {pct}<span className="text-sm font-normal text-[#9a9590]">%</span>
                    </p>
                    <p className="text-[11px] text-[#9a9590]">{s.correct}/{s.total}</p>
                  </div>
                );
              })}
            </div>
            {Object.keys(evaluations).length > 0 && (
              <div className="border-t border-[#e4e0d8] pt-4 space-y-2">
                <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-2">AI 学习建议</p>
                {Object.entries(evaluations).map(([subject, eval_]) => (
                  <div key={subject} className="text-[13px] text-[#5a5550] border-l-2 border-[#d8d4ca] pl-3 py-0.5">
                    <span className="font-semibold text-[#1c1a16]">{subject}：</span>{eval_}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-[13px] text-[#9a9590] italic py-10 text-center">加载中...</p>
      ) : !exam ? (
        <div className="text-center py-16 border border-dashed border-[#d8d4ca]">
          <p className="text-[14px] text-[#9a9590] italic mb-4">本周尚无考试题</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-2 text-[13px] bg-[#003087] text-white hover:bg-[#00256a] disabled:opacity-40"
          >
            立即生成
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {exam.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              index={i}
              subject={q.subject}
              question={q.question}
              options={typeof q.options === "string" ? JSON.parse(q.options) : q.options}
              selectedAnswer={answers[q.id] ?? null}
              correctAnswer={submitted ? q.answer : undefined}
              explain={submitted ? q.explain : undefined}
              submitted={submitted}
              onSelect={(ans) => setAnswers((prev) => ({ ...prev, [q.id]: ans }))}
            />
          ))}

          {!submitted && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmit}
                disabled={answeredCount < totalCount}
                className="px-6 py-2 text-[13px] bg-[#003087] text-white hover:bg-[#00256a] disabled:opacity-40"
              >
                提交答案（{answeredCount}/{totalCount}）
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
