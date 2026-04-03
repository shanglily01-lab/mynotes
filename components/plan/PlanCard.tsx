"use client";

import { useState } from "react";

interface PlanCardProps {
  id: string;
  title: string;
  content: string;
  subjectName: string;
  done: boolean;
  onToggle: (id: string, done: boolean) => void;
}

export default function PlanCard({
  id,
  title,
  content,
  subjectName,
  done,
  onToggle,
}: PlanCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await onToggle(id, !done);
    setLoading(false);
  }

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        done ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            done
              ? "bg-green-500 border-green-500 text-white"
              : "border-gray-400 hover:border-green-500"
          }`}
        >
          {done && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              {subjectName}
            </span>
          </div>
          <h4
            className={`font-medium cursor-pointer ${done ? "text-gray-400 line-through" : "text-gray-800"}`}
            onClick={() => setExpanded(!expanded)}
          >
            {title}
          </h4>
          {expanded && (
            <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-500 mt-1 hover:underline"
          >
            {expanded ? "收起" : "展开详情"}
          </button>
        </div>
      </div>
    </div>
  );
}
