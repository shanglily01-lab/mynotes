"use client";

interface QuestionCardProps {
  index: number;
  subject: string;
  question: string;
  options: string[];
  selectedAnswer: string | null;
  correctAnswer?: string;
  explain?: string;
  submitted: boolean;
  onSelect: (answer: string) => void;
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

export default function QuestionCard({
  index, subject, question, options, selectedAnswer, correctAnswer, explain, submitted, onSelect,
}: QuestionCardProps) {
  const color = SUBJECT_COLOR[subject] ?? "#003087";

  return (
    <div className="bg-white border border-[#d8d4ca]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#e4e0d8]">
        <span className="text-[11px] text-[#9a9590] tabular-nums">第 {index + 1} 题</span>
        <span className="w-px h-3 bg-[#d8d4ca]" />
        <span className="text-[11px] tracking-[0.1em] uppercase font-medium" style={{ color }}>
          {subject}
        </span>
      </div>

      {/* Question */}
      <div className="px-5 py-4">
        <p
          className="text-[14px] font-semibold text-[#1c1a16] leading-relaxed mb-4"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          {question}
        </p>

        {/* Options */}
        <div className="space-y-1.5">
          {options.map((opt) => {
            const letter = opt[0] ?? "";
            const isSelected = selectedAnswer === letter;
            const isCorrect = correctAnswer === letter;

            let cls = "flex items-start gap-3 px-3 py-2.5 border text-[13px] cursor-pointer transition-colors";

            if (submitted) {
              if (isCorrect) {
                cls += " border-[#1a5c34] bg-[#f0f7f2] text-[#1a5c34]";
              } else if (isSelected && !isCorrect) {
                cls += " border-[#7a1c30] bg-[#fdf2f4] text-[#7a1c30]";
              } else {
                cls += " border-[#e4e0d8] text-[#9a9590]";
              }
            } else {
              cls += isSelected
                ? " border-[#003087] bg-[#eef1f8] text-[#003087]"
                : " border-[#e4e0d8] text-[#5a5550] hover:border-[#003087] hover:text-[#1c1a16]";
            }

            return (
              <div key={letter} className={cls} onClick={() => !submitted && onSelect(letter)}>
                <span className="font-mono text-[12px] font-bold w-4 flex-shrink-0 mt-0.5">{letter}</span>
                <span className="leading-relaxed">{opt.slice(3)}</span>
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        {submitted && explain && (
          <div className="mt-4 pt-4 border-t border-[#e4e0d8] text-[13px] text-[#5a5550] leading-relaxed">
            <span className="font-semibold text-[#1c1a16]">解析：</span>{explain}
          </div>
        )}
      </div>
    </div>
  );
}
