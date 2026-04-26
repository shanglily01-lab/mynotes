"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Props {
  title: string;
  subtitle?: string;
  score?: number;
  round?: { current: number; total: number };
  startedAt?: number;
  onQuit?: () => void;
}

export default function GameHeader({ title, subtitle, score, round, startedAt, onQuit }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="border-b border-[#d8d4ca] pb-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <Link
          href="/games"
          className="text-[11px] tracking-[0.16em] uppercase text-[#9a9590] hover:text-[#5a5550]"
        >
          ← 返回游戏列表
        </Link>
        {onQuit && (
          <button
            onClick={onQuit}
            className="text-[11px] tracking-[0.16em] uppercase text-[#9a9590] hover:text-[#8b1a2a]"
          >
            放弃本局
          </button>
        )}
      </div>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold text-[#1c1a16]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            {title}
          </h1>
          {subtitle && <p className="text-[12px] text-[#5a5550] mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-5 text-right">
          {round && (
            <div>
              <p className="text-[10px] tracking-[0.16em] uppercase text-[#9a9590]">第几题</p>
              <p className="text-[18px] font-semibold text-[#1c1a16] tabular-nums">
                {round.current}<span className="text-[#9a9590]"> / {round.total}</span>
              </p>
            </div>
          )}
          {typeof score === "number" && (
            <div>
              <p className="text-[10px] tracking-[0.16em] uppercase text-[#9a9590]">得分</p>
              <p className="text-[18px] font-semibold text-[#003087] tabular-nums">{score}</p>
            </div>
          )}
          {startedAt && (
            <div>
              <p className="text-[10px] tracking-[0.16em] uppercase text-[#9a9590]">用时</p>
              <p className="text-[18px] font-semibold text-[#1c1a16] tabular-nums">
                {mm}:{ss}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
