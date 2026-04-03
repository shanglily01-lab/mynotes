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
      // 初始化已有答案
      const existingAnswers: Record<string, string> = {};
      let hasAllAnswers = true;
      for (const q of d.exam.questions as ExamQuestion[]) {
        if (q.userAns) {
          existingAnswers[q.id] = q.userAns.answer;
        } else {
          hasAllAnswers = false;
        }
      }
      setAnswers(existingAnswers);
      if (hasAllAnswers && d.exam.questions.length > 0) {
        setSubmitted(true);
      }
    }
  }

  useEffect(() => {
    loadExam().finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setMessage("正在生成考试题...");
    try {
      const res = await fetch("/api/exam/generate", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setMessage(data.cached ? "本周考试已存在" : "考试生成成功");
        await loadExam();
      } else {
        setMessage("生成失败: " + (data.error as string));
      }
    } catch {
      setMessage("生成失败");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit() {
    if (!exam) return;
    const answerList = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));

    setMessage("提交中...");
    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: exam.id, answers: answerList }),
      });
      const data = await res.json();
      if (data.ok) {
        setScores(data.scores as Record<string, { correct: number; total: number }>);
        setEvaluations(data.evaluations as Record<string, string>);
        setSubmitted(true);
        setMessage("提交成功");
        await loadExam();
      } else {
        setMessage("提交失败");
      }
    } catch {
      setMessage("提交失败");
    }
  }

  const answeredCount = Object.keys(answers).length;
  const totalCount = exam?.questions.length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">本周考试</h1>
          {exam && !submitted && (
            <p className="text-sm text-gray-500 mt-1">
              已答 {answeredCount}/{totalCount} 题
            </p>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {generating ? "生成中..." : "生成/刷新考试"}
        </button>
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          {message}
        </div>
      )}

      {submitted && Object.keys(scores).length > 0 && (
        <div className="mb-6 p-5 bg-white border border-gray-200 rounded-lg">
          <h2 className="font-bold text-lg mb-3">考试结果</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {Object.entries(scores).map(([subject, s]) => (
              <div key={subject} className="text-center p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-500">{subject}</div>
                <div className="text-xl font-bold text-blue-700">
                  {s.correct}/{s.total}
                </div>
              </div>
            ))}
          </div>
          {Object.keys(evaluations).length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-gray-700">AI 评估</h3>
              <div className="space-y-2">
                {Object.entries(evaluations).map(([subject, eval_]) => (
                  <div key={subject} className="p-3 bg-yellow-50 rounded border border-yellow-100">
                    <span className="font-medium text-gray-700">{subject}：</span>
                    <span className="text-sm text-gray-600">{eval_}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : !exam ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">本周还没有考试题</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            立即生成
          </button>
        </div>
      ) : (
        <div>
          <div className="space-y-4">
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
                onSelect={(ans) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: ans }))
                }
              />
            ))}
          </div>

          {!submitted && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={answeredCount < totalCount}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
