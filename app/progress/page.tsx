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

export default function ProgressPage() {
  const [data, setData] = useState<SubjectProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => setData(d.progress ?? []))
      .finally(() => setLoading(false));
  }, []);

  function formatWeek(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年第${getWeekNumber(d)}周`;
  }

  function getWeekNumber(d: Date) {
    const start = new Date(d.getFullYear(), 0, 1);
    const diff = d.getTime() - start.getTime();
    return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">学习进度</h1>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : (
        <div className="space-y-6">
          {data.map((subject) => (
            <div key={subject.subjectId} className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="font-bold text-lg text-gray-800 mb-4">
                {subject.subjectName}
              </h2>

              {subject.history.length === 0 ? (
                <p className="text-sm text-gray-400">暂无考试记录</p>
              ) : (
                <div className="space-y-3">
                  {subject.history.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-start gap-4 p-3 bg-gray-50 rounded"
                    >
                      <div className="min-w-24 text-sm text-gray-500">
                        {formatWeek(record.weekStart)}
                      </div>
                      <div className="flex-1">
                        {record.score !== null && record.totalQ !== null && (
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-blue-700">
                              {record.score}/{record.totalQ} 分
                            </span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{
                                  width: `${Math.round((record.score / record.totalQ) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-500">
                              {Math.round((record.score / record.totalQ) * 100)}%
                            </span>
                          </div>
                        )}
                        {record.evaluation && (
                          <p className="text-sm text-gray-600">{record.evaluation}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
