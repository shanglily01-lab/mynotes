"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GameHeader from "@/components/games/GameHeader";
import ScorePanel from "@/components/games/ScorePanel";
import { GAME_LABELS } from "@/lib/games/shared";

type Mode = "idiom" | "poem";
type Phase = "setup" | "loading" | "playing" | "finished";

const IDIOM_ROUNDS = 10;
const POEM_ROUNDS = 5;

const STARTERS = ["一心一意", "百花齐放", "千山万水", "万事如意", "青出于蓝", "天高地厚", "海纳百川", "井底之蛙"];

interface IdiomEntry {
  word: string;
  meaning: string | null;
  by: "user" | "ai-start";
}

interface PoemBlank {
  lineIdx: number;
  charIdx: number;
  answer: string;
  user: string;
  correct?: boolean;
}

interface PoemRound {
  title: string;
  author: string;
  dynasty: string;
  lines: string[];
  blanks: PoemBlank[];
  status: "pending" | "submitted" | "skipped";
}

export default function IdiomPoemPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idiom");
  const [phase, setPhase] = useState<Phase>("setup");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [bestIdiom, setBestIdiom] = useState(0);
  const [bestPoem, setBestPoem] = useState(0);

  // idiom state
  const [idiomChain, setIdiomChain] = useState<IdiomEntry[]>([]);
  const [idiomInput, setIdiomInput] = useState("");
  const [idiomFeedback, setIdiomFeedback] = useState("");
  const [idiomChecking, setIdiomChecking] = useState(false);
  const [idiomRound, setIdiomRound] = useState(0);

  // poem state
  const [poemRounds, setPoemRounds] = useState<PoemRound[]>([]);
  const [poemIdx, setPoemIdx] = useState(0);
  const [poemLoading, setPoemLoading] = useState(false);

  const submittingRef = useRef(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/games/stats?gameType=idiom").then((r) => r.json()),
      fetch("/api/games/stats?gameType=poem").then((r) => r.json()),
    ])
      .then(([i, p]: [{ bestScore?: number }, { bestScore?: number }]) => {
        setBestIdiom(i.bestScore ?? 0);
        setBestPoem(p.bestScore ?? 0);
      })
      .catch(() => {});
  }, []);

  async function startGame() {
    setPhase("loading");
    const res = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameType: mode, difficulty: "medium" }),
    });
    const data = (await res.json()) as { id: string };
    setSessionId(data.id);
    setScore(0);
    setCorrect(0);
    setStartedAt(Date.now());

    if (mode === "idiom") {
      const starter = STARTERS[Math.floor(Math.random() * STARTERS.length)]!;
      setIdiomChain([{ word: starter, meaning: null, by: "ai-start" }]);
      setIdiomInput("");
      setIdiomFeedback(`接龙开始！上一个成语是 \"${starter}\"，请用 \"${starter[starter.length - 1]}\" 起头`);
      setIdiomRound(0);
    } else {
      setPoemRounds([]);
      setPoemIdx(0);
      await loadNextPoem();
    }
    setPhase("playing");
  }

  async function loadNextPoem() {
    setPoemLoading(true);
    try {
      const res = await fetch("/api/games/poem/next", { method: "POST" });
      const data = (await res.json()) as {
        title: string;
        author: string;
        dynasty: string;
        lines: string[];
        blanks: { lineIdx: number; charIdx: number; answer: string }[];
      };
      setPoemRounds((rs) => [
        ...rs,
        {
          title: data.title,
          author: data.author,
          dynasty: data.dynasty,
          lines: data.lines,
          blanks: data.blanks.map((b) => ({ ...b, user: "" })),
          status: "pending",
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setPoemLoading(false);
    }
  }

  async function submitIdiom() {
    if (!idiomInput.trim() || idiomChecking) return;
    const last = idiomChain[idiomChain.length - 1]!;
    const must = last.word[last.word.length - 1]!;
    setIdiomChecking(true);
    try {
      const res = await fetch("/api/games/idiom/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", candidate: idiomInput.trim(), mustStartWith: must }),
      });
      const data = (await res.json()) as {
        valid: boolean;
        meaning: string | null;
        reason: string | null;
      };
      const cand = idiomInput.trim();
      if (data.valid && !idiomChain.some((e) => e.word === cand)) {
        setScore((s) => s + 10);
        setCorrect((n) => n + 1);
        setIdiomChain((c) => [...c, { word: cand, meaning: data.meaning, by: "user" }]);
        setIdiomFeedback(data.meaning ? `+10 分。\"${cand}\"：${data.meaning}` : "+10 分");
        setIdiomInput("");
        const next = idiomRound + 1;
        setIdiomRound(next);
        if (next >= IDIOM_ROUNDS) {
          await finishGame(score + 10);
          return;
        }
      } else if (idiomChain.some((e) => e.word === cand)) {
        setIdiomFeedback(`\"${cand}\" 本局已用过，请换一个`);
      } else {
        setIdiomFeedback(data.reason ?? "AI 判定为不是成语");
      }
    } catch (err) {
      console.error(err);
      setIdiomFeedback("校验失败，请重试");
    } finally {
      setIdiomChecking(false);
    }
  }

  async function idiomHint() {
    const last = idiomChain[idiomChain.length - 1]!;
    const must = last.word[last.word.length - 1]!;
    setIdiomChecking(true);
    try {
      const res = await fetch("/api/games/idiom/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "hint", mustStartWith: must }),
      });
      const data = (await res.json()) as { hint: string | null };
      if (data.hint) {
        setScore((s) => Math.max(0, s - 3));
        setIdiomFeedback(`提示（-3 分）：${data.hint}`);
      } else {
        setIdiomFeedback("AI 暂时想不出，请自己试试");
      }
    } finally {
      setIdiomChecking(false);
    }
  }

  function idiomGiveUp() {
    if (!confirm("放弃当前轮？-5 分并跳过")) return;
    setScore((s) => Math.max(0, s - 5));
    const next = idiomRound + 1;
    setIdiomRound(next);
    setIdiomInput("");
    if (next >= IDIOM_ROUNDS) {
      void finishGame(Math.max(0, score - 5));
    } else {
      const starter = STARTERS[Math.floor(Math.random() * STARTERS.length)]!;
      setIdiomChain([{ word: starter, meaning: null, by: "ai-start" }]);
      setIdiomFeedback(`-5 分，开启新链：从 \"${starter[starter.length - 1]}\" 起头`);
    }
  }

  function setBlank(blankIdx: number, value: string) {
    setPoemRounds((rs) =>
      rs.map((r, idx) =>
        idx === poemIdx
          ? {
              ...r,
              blanks: r.blanks.map((b, bi) => (bi === blankIdx ? { ...b, user: value } : b)),
            }
          : r,
      ),
    );
  }

  function submitPoem() {
    setPoemRounds((rs) =>
      rs.map((r, idx) => {
        if (idx !== poemIdx) return r;
        const blanks = r.blanks.map((b) => ({ ...b, correct: b.user.trim() === b.answer }));
        return { ...r, blanks, status: "submitted" };
      }),
    );
    const round = poemRounds[poemIdx]!;
    const correctCount = round.blanks.filter((b) => b.user.trim() === b.answer).length;
    const total = round.blanks.length;
    const gain = correctCount * 8;
    setScore((s) => s + gain);
    if (correctCount === total) setCorrect((n) => n + 1);
  }

  async function poemNext() {
    if (poemIdx + 1 >= POEM_ROUNDS) {
      await finishGame(score);
      return;
    }
    setPoemIdx((i) => i + 1);
    if (poemIdx + 1 >= poemRounds.length) {
      await loadNextPoem();
    }
  }

  async function finishGame(finalScore: number) {
    if (submittingRef.current || !sessionId) return;
    submittingRef.current = true;
    const durationMs = Date.now() - startedAt;
    const total = mode === "idiom" ? IDIOM_ROUNDS : POEM_ROUNDS;
    try {
      await fetch(`/api/games/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: finalScore,
          totalRounds: total,
          correct,
          durationMs,
          endedAt: new Date().toISOString(),
          metadata: { mode },
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
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590]">
            {mode === "idiom" ? GAME_LABELS.idiom.en : GAME_LABELS.poem.en}
          </p>
          <h1
            className="text-3xl font-bold text-[#1c1a16]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            语文益智
          </h1>
          <p className="text-[13px] text-[#5a5550] mt-1">成语接龙与古诗填空</p>
        </div>

        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-2">选择模式</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("idiom")}
              className={`py-3 text-[13px] border transition-colors ${
                mode === "idiom"
                  ? "border-[#003087] bg-[#eef1f8] text-[#003087] font-semibold"
                  : "border-[#d8d4ca] text-[#5a5550] hover:border-[#003087]"
              }`}
            >
              成语接龙
              <span className="block text-[10px] mt-1 text-[#9a9590]">10 轮 · AI 判定</span>
            </button>
            <button
              onClick={() => setMode("poem")}
              className={`py-3 text-[13px] border transition-colors ${
                mode === "poem"
                  ? "border-[#003087] bg-[#eef1f8] text-[#003087] font-semibold"
                  : "border-[#d8d4ca] text-[#5a5550] hover:border-[#003087]"
              }`}
            >
              古诗填空
              <span className="block text-[10px] mt-1 text-[#9a9590]">5 首 · 关键字补全</span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#d8d4ca] p-4 text-[12px] text-[#5a5550] space-y-2">
          <p className="font-semibold text-[#1c1a16]">规则</p>
          {mode === "idiom" ? (
            <ul className="space-y-1 list-disc pl-4">
              <li>每轮 AI 给出一个起头成语，你要接首字相同的成语</li>
              <li>AI 自动判定是否合法（每对 +10 分，提示 -3，放弃 -5）</li>
              <li>同一局不能重复使用同个成语</li>
            </ul>
          ) : (
            <ul className="space-y-1 list-disc pl-4">
              <li>AI 抽取一首唐诗或宋词，挖掉 1-2 个关键字</li>
              <li>每填对一个空 +8 分</li>
              <li>共 5 首，全部完成结束</li>
            </ul>
          )}
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

  if (phase === "loading") {
    return (
      <div className="text-center py-16">
        <p className="text-[13px] text-[#9a9590] italic">AI 准备中...</p>
      </div>
    );
  }

  if (mode === "idiom") {
    const last = idiomChain[idiomChain.length - 1];
    const must = last ? last.word[last.word.length - 1] : "";
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <GameHeader
          title="成语接龙"
          score={score}
          round={{ current: idiomRound + 1, total: IDIOM_ROUNDS }}
          startedAt={startedAt}
          onQuit={quit}
        />

        <div className="bg-white border border-[#d8d4ca]">
          <div className="px-5 py-3 border-b border-[#e4e0d8]">
            <p className="text-[10px] tracking-[0.18em] uppercase text-[#9a9590]">本局接龙</p>
          </div>
          <div className="px-5 py-4 space-y-2 max-h-64 overflow-y-auto">
            {idiomChain.map((entry, i) => (
              <div key={i} className="flex items-baseline gap-3">
                <span className="text-[10px] text-[#9a9590] tabular-nums w-6">{i + 1}.</span>
                <div>
                  <span
                    className="text-[18px] font-semibold text-[#1c1a16]"
                    style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                  >
                    {entry.word}
                  </span>
                  {entry.meaning && (
                    <p className="text-[12px] text-[#5a5550] mt-0.5">{entry.meaning}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#d8d4ca] p-4 space-y-3">
          <p className="text-[13px] text-[#5a5550]">
            请输入以 <span className="text-[#003087] font-bold text-[18px]">{must}</span> 起头的成语
          </p>
          <input
            type="text"
            value={idiomInput}
            onChange={(e) => setIdiomInput(e.target.value)}
            disabled={idiomChecking}
            className="w-full px-4 py-3 border border-[#d8d4ca] bg-white text-[16px] focus:border-[#003087] focus:outline-none disabled:opacity-60"
            placeholder="输入 4 字成语"
            autoFocus
          />
          {idiomFeedback && (
            <p className="text-[12px] text-[#5a5550]">{idiomFeedback}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={submitIdiom}
            disabled={idiomChecking || !idiomInput.trim()}
            className="py-3 bg-[#003087] text-white text-[13px] font-semibold hover:bg-[#00256a] disabled:opacity-40"
          >
            {idiomChecking ? "校验中..." : "提交"}
          </button>
          <button
            onClick={idiomHint}
            disabled={idiomChecking}
            className="py-3 border border-[#d8d4ca] text-[13px] text-[#5a5550] hover:border-[#7a4018] hover:text-[#7a4018] disabled:opacity-40"
          >
            提示 -3
          </button>
          <button
            onClick={idiomGiveUp}
            disabled={idiomChecking}
            className="py-3 border border-[#d8d4ca] text-[13px] text-[#5a5550] hover:border-[#8b1a2a] hover:text-[#8b1a2a] disabled:opacity-40"
          >
            放弃 -5
          </button>
        </div>

        <ScorePanel
          open={phase === "finished"}
          title="成语接龙"
          score={score}
          totalRounds={IDIOM_ROUNDS}
          correct={correct}
          durationMs={Date.now() - startedAt}
          bestScore={bestIdiom}
          onPlayAgain={() => {
            setPhase("setup");
            setSessionId(null);
          }}
          onBackToList={() => router.push("/games")}
        />
      </div>
    );
  }

  // poem mode
  const poem = poemRounds[poemIdx];
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <GameHeader
        title="古诗填空"
        score={score}
        round={{ current: poemIdx + 1, total: POEM_ROUNDS }}
        startedAt={startedAt}
        onQuit={quit}
      />

      {poemLoading || !poem ? (
        <div className="text-center py-16 text-[13px] text-[#9a9590] italic">AI 抽诗中...</div>
      ) : (
        <>
          <div className="bg-white border border-[#d8d4ca]">
            <div className="px-5 py-3 border-b border-[#e4e0d8] flex items-baseline justify-between">
              <span className="text-[10px] tracking-[0.18em] uppercase text-[#9a9590]">{poem.dynasty}</span>
              <span className="text-[12px] text-[#5a5550]">{poem.author}</span>
            </div>
            <div className="px-5 py-5 space-y-3 text-center">
              <h2
                className="text-2xl font-bold text-[#1c1a16]"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
              >
                {poem.title}
              </h2>
              <div className="space-y-2 text-[18px] text-[#1c1a16]" style={{ lineHeight: "2.2" }}>
                {poem.lines.map((line, lineIdx) => (
                  <PoemLine
                    key={lineIdx}
                    line={line}
                    lineIdx={lineIdx}
                    blanks={poem.blanks}
                    submitted={poem.status === "submitted"}
                    onChange={setBlank}
                  />
                ))}
              </div>
            </div>
          </div>

          {poem.status === "submitted" && (
            <div className="bg-[#eef1f8] border border-[#d8d4ca] px-5 py-3 text-[13px] text-[#003087]">
              {poem.blanks.every((b) => b.correct)
                ? "全部正确！"
                : `本首得分：${poem.blanks.filter((b) => b.correct).length * 8}（共 ${poem.blanks.length * 8}）`}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {poem.status === "pending" ? (
              <button
                onClick={submitPoem}
                disabled={poem.blanks.some((b) => !b.user.trim())}
                className="col-span-2 py-3 bg-[#003087] text-white text-[13px] font-semibold hover:bg-[#00256a] disabled:opacity-40"
              >
                提交本首
              </button>
            ) : (
              <button
                onClick={poemNext}
                className="col-span-2 py-3 bg-[#003087] text-white text-[13px] font-semibold hover:bg-[#00256a]"
              >
                {poemIdx + 1 >= POEM_ROUNDS ? "查看本局成绩" : "下一首"}
              </button>
            )}
          </div>
        </>
      )}

      <ScorePanel
        open={phase === "finished"}
        title="古诗填空"
        score={score}
        totalRounds={POEM_ROUNDS}
        correct={correct}
        durationMs={Date.now() - startedAt}
        bestScore={bestPoem}
        onPlayAgain={() => {
          setPhase("setup");
          setSessionId(null);
        }}
        onBackToList={() => router.push("/games")}
      />
    </div>
  );
}

function PoemLine({
  line,
  lineIdx,
  blanks,
  submitted,
  onChange,
}: {
  line: string;
  lineIdx: number;
  blanks: PoemBlank[];
  submitted: boolean;
  onChange: (blankIdx: number, value: string) => void;
}) {
  // Build rendered chars with blanks substituted by inputs
  const punctRe = /[，。！？、；：""''《》「」（）]/;
  const elements: React.ReactNode[] = [];
  let charIdx = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (punctRe.test(ch)) {
      elements.push(
        <span key={`p-${i}`} className="text-[#9a9590]">
          {ch}
        </span>,
      );
      continue;
    }
    const blankIdx = blanks.findIndex((b) => b.lineIdx === lineIdx && b.charIdx === charIdx);
    if (blankIdx >= 0) {
      const b = blanks[blankIdx]!;
      const correct = submitted ? b.user.trim() === b.answer : null;
      elements.push(
        <input
          key={`b-${i}`}
          type="text"
          maxLength={1}
          value={b.user}
          onChange={(e) => onChange(blankIdx, e.target.value)}
          disabled={submitted}
          className={`inline-block w-9 h-9 text-center mx-0.5 border-b-2 bg-transparent text-[18px] focus:outline-none ${
            submitted
              ? correct
                ? "border-[#1a5c34] text-[#1a5c34] font-bold"
                : "border-[#8b1a2a] text-[#8b1a2a] font-bold"
              : "border-[#003087] text-[#003087]"
          }`}
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        />,
      );
      if (submitted && correct === false) {
        elements.push(
          <sup key={`a-${i}`} className="text-[10px] text-[#1a5c34] ml-0.5">
            ({b.answer})
          </sup>,
        );
      }
    } else {
      elements.push(<span key={`c-${i}`}>{ch}</span>);
    }
    charIdx++;
  }
  return <p>{elements}</p>;
}
