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

export default function QuestionCard({
  index,
  subject,
  question,
  options,
  selectedAnswer,
  correctAnswer,
  explain,
  submitted,
  onSelect,
}: QuestionCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
          {subject}
        </span>
        <span className="text-xs text-gray-400">第 {index + 1} 题</span>
      </div>

      <p className="font-medium text-gray-800 mb-4">{question}</p>

      <div className="space-y-2">
        {options.map((opt) => {
          const letter = opt[0];
          const isSelected = selectedAnswer === letter;
          const isCorrect = correctAnswer === letter;

          let optClass =
            "flex items-start gap-2 p-3 rounded border cursor-pointer transition-colors";
          if (submitted) {
            if (isCorrect) {
              optClass += " bg-green-50 border-green-400 text-green-800";
            } else if (isSelected && !isCorrect) {
              optClass += " bg-red-50 border-red-400 text-red-700";
            } else {
              optClass += " border-gray-200 text-gray-500";
            }
          } else {
            optClass += isSelected
              ? " bg-blue-50 border-blue-400 text-blue-800"
              : " border-gray-200 hover:bg-gray-50";
          }

          return (
            <div
              key={letter}
              className={optClass}
              onClick={() => !submitted && onSelect(letter)}
            >
              <span className="font-mono font-bold text-sm">{letter}</span>
              <span className="text-sm">{opt.slice(3)}</span>
            </div>
          );
        })}
      </div>

      {submitted && explain && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          <span className="font-semibold">解析：</span>
          {explain}
        </div>
      )}
    </div>
  );
}
