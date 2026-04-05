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

const SUBJECT_COLOR: Record<string, string> = {
  心理学: "#6b2d6e",
  生物学: "#1a5c34",
  物理学: "#003087",
  社会学: "#7a4018",
  "AI 日报": "#1a5060",
  哲学:   "#3a2870",
  神学:   "#7a1c30",
};

export default function PlanCard({ id, title, content, subjectName, done, onToggle }: PlanCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const color = SUBJECT_COLOR[subjectName] ?? "#003087";

  async function handleToggle() {
    setLoading(true);
    await onToggle(id, !done);
    setLoading(false);
  }

  return (
    <div
      className={`bg-white border border-[#d8d4ca] border-l-[3px] transition-opacity ${done ? "opacity-55" : ""}`}
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`mt-0.5 w-4 h-4 border flex-shrink-0 flex items-center justify-center transition-colors ${
            done ? "border-[#003087] bg-[#003087]" : "border-[#9a9590] hover:border-[#003087]"
          }`}
        >
          {done && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Subject label */}
          <span
            className="text-[10px] tracking-[0.12em] uppercase font-medium"
            style={{ color }}
          >
            {subjectName}
          </span>

          {/* Title */}
          <h4
            className={`text-[14px] font-semibold leading-snug mt-0.5 cursor-pointer ${
              done ? "text-[#9a9590] line-through" : "text-[#1c1a16]"
            }`}
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            onClick={() => setExpanded(!expanded)}
          >
            {title}
          </h4>

          {expanded && (
            <p className="mt-2 text-[13px] text-[#5a5550] leading-relaxed whitespace-pre-wrap border-t border-[#e4e0d8] pt-2">
              {content}
            </p>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-[#003087] mt-1 hover:underline"
          >
            {expanded ? "收起" : "展开"}
          </button>
        </div>
      </div>
    </div>
  );
}
