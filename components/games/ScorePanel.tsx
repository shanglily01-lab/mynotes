"use client";

interface Props {
  open: boolean;
  title: string;
  score: number;
  totalRounds: number;
  correct: number;
  durationMs: number;
  bestScore?: number;
  details?: { label: string; value: string }[];
  onPlayAgain: () => void;
  onBackToList: () => void;
}

export default function ScorePanel({
  open,
  title,
  score,
  totalRounds,
  correct,
  durationMs,
  bestScore,
  details,
  onPlayAgain,
  onBackToList,
}: Props) {
  if (!open) return null;

  const seconds = Math.round(durationMs / 1000);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const isNewBest = typeof bestScore === "number" && score >= bestScore && score > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-[#f5f2eb] border border-[#d8d4ca] shadow-xl">
        <div className="px-6 py-5 border-b border-[#d8d4ca] text-center">
          <p className="text-[10px] tracking-[0.18em] uppercase text-[#9a9590]">本局结束</p>
          <h2
            className="text-2xl font-bold text-[#1c1a16] mt-1"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            {title}
          </h2>
          {isNewBest && (
            <p className="text-[12px] text-[#003087] font-semibold mt-2">新纪录</p>
          )}
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="text-center py-3">
            <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590]">得分</p>
            <p
              className="text-5xl font-bold text-[#003087] tabular-nums mt-1"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              {score}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="正确率" value={totalRounds ? `${correct}/${totalRounds}` : "-"} />
            <Stat label="用时" value={`${mm}:${ss}`} />
            <Stat label="最高" value={bestScore ? String(bestScore) : "-"} />
          </div>

          {details && details.length > 0 && (
            <div className="border-t border-[#e4e0d8] pt-3 space-y-1">
              {details.map((d) => (
                <div key={d.label} className="flex justify-between text-[12px]">
                  <span className="text-[#9a9590]">{d.label}</span>
                  <span className="text-[#1c1a16] font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-px bg-[#d8d4ca] border-t border-[#d8d4ca]">
          <button
            onClick={onBackToList}
            className="bg-[#f5f2eb] py-3 text-[13px] text-[#5a5550] hover:bg-[#e4e0d8] transition-colors"
          >
            返回列表
          </button>
          <button
            onClick={onPlayAgain}
            className="bg-[#003087] py-3 text-[13px] text-white font-semibold hover:bg-[#00256a] transition-colors"
          >
            再玩一局
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#d8d4ca] bg-white py-2">
      <p className="text-[9px] tracking-[0.16em] uppercase text-[#9a9590]">{label}</p>
      <p className="text-[14px] font-semibold text-[#1c1a16] tabular-nums mt-0.5">{value}</p>
    </div>
  );
}
