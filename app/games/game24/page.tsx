"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GameHeader from "@/components/games/GameHeader";
import ScorePanel from "@/components/games/ScorePanel";
import { GAME_LABELS, type Difficulty } from "@/lib/games/shared";
import { generatePuzzle, evaluateExpression, findOneSolution } from "@/lib/games/game24";

const ROUNDS_PER_GAME = 10;

type Phase = "setup" | "playing" | "finished";

interface Round {
  cards: number[];
  expr: string;
  status: "pending" | "correct" | "skipped" | "shown";
  feedback?: string;
}

export default function Game24Page() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [bestScore, setBestScore] = useState(0);
  const submittingRef = useRef(false);
  const roundStartedRef = useRef<number>(0);

  useEffect(() => {
    fetch("/api/games/stats?gameType=game24")
      .then((r) => r.json())
      .then((d: { bestScore?: number }) => setBestScore(d.bestScore ?? 0))
      .catch(() => {});
  }, []);

  const currentRound = rounds[current];

  async function startGame() {
    const res = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameType: "game24", difficulty }),
    });
    const data = (await res.json()) as { id: string };
    setSessionId(data.id);

    const newRounds: Round[] = Array.from({ length: ROUNDS_PER_GAME }, () => ({
      cards: generatePuzzle(difficulty),
      expr: "",
      status: "pending",
    }));
    setRounds(newRounds);
    setCurrent(0);
    setScore(0);
    setStartedAt(Date.now());
    roundStartedRef.current = Date.now();
    setPhase("playing");
  }

  function appendToken(tok: string) {
    if (!currentRound || currentRound.status !== "pending") return;
    setRounds((r) =>
      r.map((round, i) => (i === current ? { ...round, expr: round.expr + tok, feedback: undefined } : round)),
    );
  }

  function backspace() {
    if (!currentRound || currentRound.status !== "pending") return;
    setRounds((r) =>
      r.map((round, i) => (i === current ? { ...round, expr: round.expr.slice(0, -1), feedback: undefined } : round)),
    );
  }

  function clearExpr() {
    if (!currentRound || currentRound.status !== "pending") return;
    setRounds((r) =>
      r.map((round, i) => (i === current ? { ...round, expr: "", feedback: undefined } : round)),
    );
  }

  function submit() {
    if (!currentRound || currentRound.status !== "pending") return;
    const res = evaluateExpression(currentRound.expr, currentRound.cards);
    if (res.ok) {
      const elapsedMs = Date.now() - roundStartedRef.current;
      const speedBonus = elapsedMs < 30_000 ? 3 : 0;
      const gain = 10 + speedBonus;
      setScore((s) => s + gain);
      setRounds((r) =>
        r.map((round, i) =>
          i === current
            ? {
                ...round,
                status: "correct",
                feedback: speedBonus ? `正确！+${gain}（含 30 秒速度奖励）` : `正确！+${gain}`,
              }
            : round,
        ),
      );
    } else {
      setRounds((r) =>
        r.map((round, i) => (i === current ? { ...round, feedback: res.error } : round)),
      );
    }
  }

  function skip() {
    if (!currentRound || currentRound.status !== "pending") return;
    setScore((s) => Math.max(0, s - 2));
    setRounds((r) =>
      r.map((round, i) =>
        i === current ? { ...round, status: "skipped", feedback: "已跳过 -2" } : round,
      ),
    );
  }

  function showAnswer() {
    if (!currentRound || currentRound.status !== "pending") return;
    const sol = findOneSolution(currentRound.cards);
    setScore((s) => Math.max(0, s - 5));
    setRounds((r) =>
      r.map((round, i) =>
        i === current
          ? {
              ...round,
              status: "shown",
              feedback: sol ? `参考答案：${sol} = 24（-5 分）` : "未找到答案（-5 分）",
            }
          : round,
      ),
    );
  }

  function nextRound() {
    if (current + 1 >= ROUNDS_PER_GAME) {
      finishGame();
      return;
    }
    setCurrent((c) => c + 1);
    roundStartedRef.current = Date.now();
  }

  async function finishGame() {
    if (submittingRef.current || !sessionId) return;
    submittingRef.current = true;
    const correct = rounds.filter((r) => r.status === "correct").length;
    const durationMs = Date.now() - startedAt;
    try {
      await fetch(`/api/games/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          totalRounds: ROUNDS_PER_GAME,
          correct,
          durationMs,
          endedAt: new Date().toISOString(),
          metadata: { difficulty },
        }),
      });
    } catch (err) {
      console.error(err);
    }
    setPhase("finished");
  }

  function quit() {
    if (!confirm("确定放弃本局？已得分数将不会保存。")) return;
    router.push("/games");
  }

  if (phase === "setup") {
    return (
      <div className="space-y-6 max-w-md mx-auto">
        <div className="border-b border-[#d8d4ca] pb-4">
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590]">{GAME_LABELS.game24.en}</p>
          <h1
            className="text-3xl font-bold text-[#1c1a16]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            算 24 点
          </h1>
          <p className="text-[13px] text-[#5a5550] mt-1">用 4 张牌和加减乘除算出 24，共 10 题</p>
        </div>

        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-2">选择难度</p>
          <div className="grid grid-cols-3 gap-2">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
              const labelMap = { easy: "简单 (1-9)", medium: "中等 (1-12)", hard: "困难 (1-13)" };
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`py-3 text-[13px] border transition-colors ${
                    difficulty === d
                      ? "border-[#003087] bg-[#eef1f8] text-[#003087] font-semibold"
                      : "border-[#d8d4ca] text-[#5a5550] hover:border-[#003087]"
                  }`}
                >
                  {labelMap[d]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-[#d8d4ca] p-4 text-[12px] text-[#5a5550] space-y-2">
          <p className="font-semibold text-[#1c1a16]">规则</p>
          <ul className="space-y-1 list-disc pl-4">
            <li>用题目给出的 4 个数字（每个用一次）拼出运算式，结果等于 24</li>
            <li>每题答对 +10 分；30 秒内完成额外 +3 分</li>
            <li>跳过本题 -2 分；查看答案 -5 分</li>
            <li>共 10 题，越快越准得分越高</li>
          </ul>
        </div>

        <button
          onClick={startGame}
          className="w-full py-3 bg-[#003087] text-white text-[14px] font-semibold hover:bg-[#00256a] transition-colors"
        >
          开始游戏
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <GameHeader
        title="算 24 点"
        subtitle={`难度：${difficulty === "easy" ? "简单" : difficulty === "medium" ? "中等" : "困难"}`}
        score={score}
        round={{ current: current + 1, total: ROUNDS_PER_GAME }}
        startedAt={startedAt}
        onQuit={quit}
      />

      {currentRound && (
        <>
          <Cards cards={currentRound.cards} />

          <div className="bg-white border border-[#d8d4ca] px-4 py-3">
            <p className="text-[10px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">表达式</p>
            <p
              className="text-2xl font-semibold text-[#1c1a16] tabular-nums min-h-[1.5em] break-all"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              {currentRound.expr || <span className="text-[#9a9590] italic text-base">点击下方按钮输入...</span>}
            </p>
            {currentRound.feedback && (
              <p
                className={`text-[12px] mt-2 ${
                  currentRound.status === "correct"
                    ? "text-[#1a5c34] font-semibold"
                    : currentRound.status === "pending"
                      ? "text-[#8b1a2a]"
                      : "text-[#5a5550]"
                }`}
              >
                {currentRound.feedback}
              </p>
            )}
          </div>

          <Keypad
            cards={currentRound.cards}
            disabled={currentRound.status !== "pending"}
            onAppend={appendToken}
            onBackspace={backspace}
            onClear={clearExpr}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {currentRound.status === "pending" ? (
              <>
                <button
                  onClick={submit}
                  className="col-span-2 sm:col-span-2 py-3 bg-[#003087] text-white text-[13px] font-semibold hover:bg-[#00256a]"
                >
                  提交
                </button>
                <button
                  onClick={skip}
                  className="py-3 border border-[#d8d4ca] text-[13px] text-[#5a5550] hover:border-[#8b1a2a] hover:text-[#8b1a2a]"
                >
                  跳过 -2
                </button>
                <button
                  onClick={showAnswer}
                  className="py-3 border border-[#d8d4ca] text-[13px] text-[#5a5550] hover:border-[#7a4018] hover:text-[#7a4018]"
                >
                  查看答案 -5
                </button>
              </>
            ) : (
              <button
                onClick={nextRound}
                className="col-span-2 sm:col-span-4 py-3 bg-[#003087] text-white text-[13px] font-semibold hover:bg-[#00256a]"
              >
                {current + 1 >= ROUNDS_PER_GAME ? "查看本局成绩" : "下一题"}
              </button>
            )}
          </div>
        </>
      )}

      <ScorePanel
        open={phase === "finished"}
        title="算 24 点"
        score={score}
        totalRounds={ROUNDS_PER_GAME}
        correct={rounds.filter((r) => r.status === "correct").length}
        durationMs={Date.now() - startedAt}
        bestScore={bestScore}
        details={[
          { label: "难度", value: difficulty === "easy" ? "简单" : difficulty === "medium" ? "中等" : "困难" },
          { label: "跳过", value: String(rounds.filter((r) => r.status === "skipped").length) },
          { label: "查看答案", value: String(rounds.filter((r) => r.status === "shown").length) },
        ]}
        onPlayAgain={() => {
          setPhase("setup");
          setSessionId(null);
        }}
        onBackToList={() => router.push("/games")}
      />
    </div>
  );
}

function Cards({ cards }: { cards: number[] }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((n, i) => (
        <div
          key={i}
          className="aspect-[3/4] bg-white border border-[#d8d4ca] flex items-center justify-center"
        >
          <span
            className="text-5xl font-bold text-[#003087] tabular-nums"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            {n}
          </span>
        </div>
      ))}
    </div>
  );
}

function Keypad({
  cards,
  disabled,
  onAppend,
  onBackspace,
  onClear,
}: {
  cards: number[];
  disabled: boolean;
  onAppend: (s: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}) {
  const uniqueCardTokens = useMemo(() => {
    // Show all four (allow duplicates so user clicks once per use)
    return cards.map((n) => String(n));
  }, [cards]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {uniqueCardTokens.map((tok, i) => (
          <button
            key={i}
            onClick={() => onAppend(tok)}
            disabled={disabled}
            className="py-3 border border-[#d8d4ca] bg-white text-[18px] font-semibold text-[#003087] hover:border-[#003087] disabled:opacity-40"
          >
            {tok}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-2">
        {(["+", "-", "*", "/", "(", ")"] as const).map((op) => (
          <button
            key={op}
            onClick={() => onAppend(op)}
            disabled={disabled}
            className="py-3 border border-[#d8d4ca] bg-white text-[18px] font-semibold text-[#1c1a16] hover:border-[#003087] disabled:opacity-40"
          >
            {op === "*" ? "x" : op}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onBackspace}
          disabled={disabled}
          className="py-2.5 border border-[#d8d4ca] bg-white text-[13px] text-[#5a5550] hover:border-[#003087] disabled:opacity-40"
        >
          删除一个
        </button>
        <button
          onClick={onClear}
          disabled={disabled}
          className="py-2.5 border border-[#d8d4ca] bg-white text-[13px] text-[#5a5550] hover:border-[#8b1a2a] disabled:opacity-40"
        >
          全部清除
        </button>
      </div>
    </div>
  );
}
