"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GameHeader from "@/components/games/GameHeader";
import ScorePanel from "@/components/games/ScorePanel";
import { GAME_LABELS, type Difficulty } from "@/lib/games/shared";
import { generatePuzzle, findConflicts, isComplete, type Puzzle, type Size } from "@/lib/games/sudoku";

type Phase = "setup" | "playing" | "finished";

export default function SudokuPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("setup");
  const [size, setSize] = useState<Size>(4);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [board, setBoard] = useState<number[][]>([]);
  const [history, setHistory] = useState<number[][][]>([]);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [bestScore, setBestScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [finalDuration, setFinalDuration] = useState(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    fetch("/api/games/stats?gameType=sudoku")
      .then((r) => r.json())
      .then((d: { bestScore?: number }) => setBestScore(d.bestScore ?? 0))
      .catch(() => {});
  }, []);

  const conflicts = useMemo(() => {
    if (!puzzle) return [] as boolean[][];
    return findConflicts(board, puzzle.size);
  }, [board, puzzle]);

  useEffect(() => {
    if (!puzzle || phase !== "playing") return;
    if (isComplete(board, conflicts)) {
      const durationMs = Date.now() - startedAt;
      const minutes = durationMs / 60000;
      const overtimePenalty = minutes > 5 ? Math.floor(minutes - 5) : 0;
      const score = Math.max(0, 100 - hintsUsed * 10 - mistakes * 2 - overtimePenalty);
      setFinalScore(score);
      setFinalDuration(durationMs);
      void finishGame(score, durationMs);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, conflicts]);

  function startGame() {
    const p = generatePuzzle(size, difficulty);
    setPuzzle(p);
    setBoard(p.given.map((r) => [...r]));
    setHistory([]);
    setSelected(null);
    setHintsUsed(0);
    setMistakes(0);
    setStartedAt(Date.now());
    void createSession();
  }

  async function createSession() {
    const res = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameType: "sudoku", difficulty }),
    });
    const data = (await res.json()) as { id: string };
    setSessionId(data.id);
    setPhase("playing");
  }

  function setCell(value: number) {
    if (!puzzle || !selected) return;
    const { r, c } = selected;
    if (puzzle.given[r]![c] !== 0) return;
    if (board[r]![c] === value) return;
    setHistory((h) => [...h, board.map((row) => [...row])]);
    if (value !== 0 && puzzle.solution[r]![c] !== value) {
      setMistakes((m) => m + 1);
    }
    setBoard((b) => {
      const nb = b.map((row) => [...row]);
      nb[r]![c] = value;
      return nb;
    });
  }

  function undo() {
    if (history.length === 0) return;
    setBoard(history[history.length - 1]!);
    setHistory((h) => h.slice(0, -1));
  }

  function showHint() {
    if (!puzzle || !selected) return;
    const { r, c } = selected;
    if (puzzle.given[r]![c] !== 0 || board[r]![c] === puzzle.solution[r]![c]) return;
    setHistory((h) => [...h, board.map((row) => [...row])]);
    setHintsUsed((n) => n + 1);
    setBoard((b) => {
      const nb = b.map((row) => [...row]);
      nb[r]![c] = puzzle.solution[r]![c]!;
      return nb;
    });
  }

  function resetBoard() {
    if (!puzzle) return;
    if (!confirm("重置当前盘面？")) return;
    setBoard(puzzle.given.map((r) => [...r]));
    setHistory([]);
  }

  async function finishGame(score: number, durationMs: number) {
    if (submittingRef.current || !sessionId) return;
    submittingRef.current = true;
    try {
      await fetch(`/api/games/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          totalRounds: 1,
          correct: 1,
          durationMs,
          endedAt: new Date().toISOString(),
          metadata: { size, difficulty, hintsUsed, mistakes },
        }),
      });
    } catch (err) {
      console.error(err);
    }
    setPhase("finished");
  }

  function quit() {
    if (!confirm("确定放弃本局？")) return;
    router.push("/games");
  }

  if (phase === "setup") {
    return (
      <div className="space-y-6 max-w-md mx-auto">
        <div className="border-b border-[#d8d4ca] pb-4">
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590]">{GAME_LABELS.sudoku.en}</p>
          <h1
            className="text-3xl font-bold text-[#1c1a16]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            数独
          </h1>
          <p className="text-[13px] text-[#5a5550] mt-1">每行、每列、每宫填满 1 到 N，不重复</p>
        </div>

        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-2">网格大小</p>
          <div className="grid grid-cols-2 gap-2">
            {([4, 6] as Size[]).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`py-3 text-[13px] border transition-colors ${
                  size === s
                    ? "border-[#003087] bg-[#eef1f8] text-[#003087] font-semibold"
                    : "border-[#d8d4ca] text-[#5a5550] hover:border-[#003087]"
                }`}
              >
                {s}×{s}（{s === 4 ? "入门" : "进阶"}）
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-2">难度</p>
          <div className="grid grid-cols-3 gap-2">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
              const labelMap = { easy: "简单", medium: "中等", hard: "困难" };
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
            <li>每行、每列、每宫填入 1 到 {size}，不重复</li>
            <li>初始数字不可改动；冲突格子会标红</li>
            <li>每次提示 -10 分，每次填错 -2 分，超过 5 分钟每分钟 -1 分</li>
            <li>完成即胜利，基础分 100</li>
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

  if (!puzzle) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <GameHeader
        title="数独"
        subtitle={`${puzzle.size}×${puzzle.size} · ${difficulty === "easy" ? "简单" : difficulty === "medium" ? "中等" : "困难"}`}
        startedAt={startedAt}
        onQuit={quit}
      />

      <Board
        puzzle={puzzle}
        board={board}
        conflicts={conflicts}
        selected={selected}
        onSelect={(r, c) => setSelected({ r, c })}
      />

      <NumberPalette
        size={puzzle.size}
        disabled={!selected || (selected && puzzle.given[selected.r]![selected.c] !== 0) || false}
        onPick={setCell}
      />

      <div className="grid grid-cols-4 gap-2">
        <ToolButton onClick={() => setCell(0)} disabled={!selected}>
          擦除
        </ToolButton>
        <ToolButton onClick={undo} disabled={history.length === 0}>
          撤销
        </ToolButton>
        <ToolButton onClick={showHint} disabled={!selected}>
          提示 -10
        </ToolButton>
        <ToolButton onClick={resetBoard}>重置</ToolButton>
      </div>

      <div className="text-center text-[11px] text-[#9a9590]">
        提示用了 {hintsUsed} 次 · 错误 {mistakes} 次
      </div>

      <ScorePanel
        open={phase === "finished"}
        title="数独"
        score={finalScore}
        totalRounds={1}
        correct={1}
        durationMs={finalDuration}
        bestScore={bestScore}
        details={[
          { label: "网格", value: `${puzzle.size}×${puzzle.size}` },
          { label: "提示", value: String(hintsUsed) },
          { label: "错误", value: String(mistakes) },
        ]}
        onPlayAgain={() => {
          setPhase("setup");
          setSessionId(null);
          setPuzzle(null);
        }}
        onBackToList={() => router.push("/games")}
      />
    </div>
  );
}

function Board({
  puzzle,
  board,
  conflicts,
  selected,
  onSelect,
}: {
  puzzle: Puzzle;
  board: number[][];
  conflicts: boolean[][];
  selected: { r: number; c: number } | null;
  onSelect: (r: number, c: number) => void;
}) {
  const { size, boxRows, boxCols } = puzzle;
  return (
    <div
      className="grid mx-auto bg-[#1c1a16] border-2 border-[#1c1a16]"
      style={{
        gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        gap: 1,
        maxWidth: size === 4 ? 320 : 480,
      }}
    >
      {board.map((row, r) =>
        row.map((v, c) => {
          const isGiven = puzzle.given[r]![c] !== 0;
          const conflict = conflicts[r]![c];
          const isSelected = selected?.r === r && selected?.c === c;
          const isPeer =
            selected !== null &&
            (selected.r === r ||
              selected.c === c ||
              (Math.floor(selected.r / boxRows) === Math.floor(r / boxRows) &&
                Math.floor(selected.c / boxCols) === Math.floor(c / boxCols)));

          const borderRight = (c + 1) % boxCols === 0 && c + 1 < size ? "2px solid #1c1a16" : undefined;
          const borderBottom = (r + 1) % boxRows === 0 && r + 1 < size ? "2px solid #1c1a16" : undefined;

          return (
            <button
              key={`${r}-${c}`}
              onClick={() => onSelect(r, c)}
              className={`aspect-square flex items-center justify-center transition-colors text-[20px] sm:text-[24px] font-semibold tabular-nums ${
                isSelected
                  ? "bg-[#eef1f8]"
                  : isPeer
                    ? "bg-[#f5f2eb]"
                    : "bg-white"
              } ${conflict ? "text-[#8b1a2a]" : isGiven ? "text-[#1c1a16]" : "text-[#003087]"}`}
              style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                borderRight,
                borderBottom,
                outline: conflict ? "2px solid #8b1a2a" : undefined,
                outlineOffset: -2,
              }}
            >
              {v === 0 ? "" : v}
            </button>
          );
        }),
      )}
    </div>
  );
}

function NumberPalette({
  size,
  disabled,
  onPick,
}: {
  size: Size;
  disabled: boolean;
  onPick: (n: number) => void;
}) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
      {Array.from({ length: size }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onPick(n)}
          disabled={disabled}
          className="py-3 border border-[#d8d4ca] bg-white text-[20px] font-semibold text-[#003087] hover:border-[#003087] disabled:opacity-40"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function ToolButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="py-2.5 border border-[#d8d4ca] bg-white text-[12px] text-[#5a5550] hover:border-[#003087] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
