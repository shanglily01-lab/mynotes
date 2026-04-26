"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GAME_LABELS, type GameType } from "@/lib/games/shared";

interface GameStat {
  totalSessions: number;
  bestScore: number;
  avgScore: number;
}

const GAME_ORDER: GameType[] = ["game24", "sudoku", "words", "idiom"];

export default function GamesIndexPage() {
  const [stats, setStats] = useState<Record<string, GameStat>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/games/stats")
      .then((r) => r.json())
      .then((data) => setStats(data as Record<string, GameStat>))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-7">
      <div className="border-b border-[#d8d4ca] pb-5">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">
          自我成长 / Games
        </p>
        <h1
          className="text-3xl font-bold text-[#1c1a16]"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          益智游戏
        </h1>
        <p className="text-[13px] text-[#5a5550] mt-1">
          为 4-6 年级设计的学习益智游戏，每局结束自动记分
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GAME_ORDER.map((gameType) => {
          const meta = GAME_LABELS[gameType];
          const stat = stats[gameType];
          const href = `/games/${gameType}`;
          return (
            <Link
              key={gameType}
              href={href}
              className="group block bg-white border border-[#d8d4ca] hover:border-[#003087] transition-colors"
            >
              <div className="px-5 py-4 border-b border-[#e4e0d8]">
                <p className="text-[10px] tracking-[0.18em] uppercase text-[#9a9590]">
                  {meta.en}
                </p>
                <h2
                  className="text-xl font-bold text-[#1c1a16] mt-0.5 group-hover:text-[#003087]"
                  style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                >
                  {meta.zh}
                </h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                <p className="text-[13px] text-[#5a5550] leading-relaxed min-h-[2.4em]">
                  {meta.tagline}
                </p>
                <div className="flex items-center justify-between text-[12px] pt-2 border-t border-[#e4e0d8]">
                  <span className="text-[#9a9590]">
                    {loading ? "..." : `已完成 ${stat?.totalSessions ?? 0} 局`}
                  </span>
                  <span className="text-[#003087] font-semibold tabular-nums">
                    {loading ? "" : stat?.bestScore ? `最高 ${stat.bestScore}` : "尚未游玩"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="text-center pt-4">
        <p className="text-[11px] text-[#9a9590] italic">
          所有游戏成绩自动同步到月度回顾
        </p>
      </div>
    </div>
  );
}
