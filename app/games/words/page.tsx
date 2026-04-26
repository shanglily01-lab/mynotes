"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GameHeader from "@/components/games/GameHeader";
import ScorePanel from "@/components/games/ScorePanel";
import { GAME_LABELS } from "@/lib/games/shared";

interface Card {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  distractors: string[];
}

type Mode = "choice" | "spell";
type Phase = "setup" | "loading" | "playing" | "finished" | "empty";

export default function WordsPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("choice");
  const [deck, setDeck] = useState<Card[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<string>("");
  const [picked, setPicked] = useState<string | null>(null);
  const [spellInput, setSpellInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [bestScore, setBestScore] = useState(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    fetch("/api/games/stats?gameType=words")
      .then((r) => r.json())
      .then((d: { bestScore?: number }) => setBestScore(d.bestScore ?? 0))
      .catch(() => {});
  }, []);

  async function startGame() {
    setPhase("loading");
    const [deckRes, sessionRes] = await Promise.all([
      fetch("/api/games/words/deck"),
      fetch("/api/games/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType: "words", difficulty: mode === "spell" ? "hard" : "easy" }),
      }),
    ]);
    const deckData = (await deckRes.json()) as { items?: Card[]; message?: string };
    const sessionData = (await sessionRes.json()) as { id: string };
    if (!deckData.items || deckData.items.length === 0) {
      setPhase("empty");
      return;
    }
    setSessionId(sessionData.id);
    setDeck(deckData.items);
    setCurrent(0);
    setScore(0);
    setCorrect(0);
    setFeedback("");
    setPicked(null);
    setSpellInput("");
    setStartedAt(Date.now());
    setPhase("playing");
  }

  const card = deck[current];

  const optionsForChoice = useRef<string[]>([]);
  useEffect(() => {
    if (!card) return;
    const opts = [card.meaning, ...card.distractors].slice(0, 4);
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j]!, opts[i]!];
    }
    optionsForChoice.current = opts;
    setPicked(null);
    setSpellInput("");
    setFeedback("");
  }, [current, card]);

  function pickChoice(choice: string) {
    if (!card || picked !== null) return;
    setPicked(choice);
    if (choice === card.meaning) {
      setScore((s) => s + 3);
      setCorrect((n) => n + 1);
      setFeedback("正确！+3");
    } else {
      setFeedback(`错了，正确答案：${card.meaning}`);
    }
  }

  function submitSpell() {
    if (!card || picked !== null) return;
    const guess = spellInput.trim().toLowerCase();
    if (!guess) return;
    if (guess === card.word.toLowerCase()) {
      setScore((s) => s + 5);
      setCorrect((n) => n + 1);
      setFeedback("正确！+5");
    } else {
      setFeedback(`错了，正确拼写：${card.word}`);
    }
    setPicked("done");
  }

  function skip() {
    if (picked !== null) return;
    setScore((s) => Math.max(0, s - 1));
    setFeedback(`跳过 -1，正确答案：${mode === "spell" ? card?.word : card?.meaning}`);
    setPicked("done");
  }

  function next() {
    if (current + 1 >= deck.length) {
      void finishGame();
      return;
    }
    setCurrent((c) => c + 1);
  }

  async function finishGame() {
    if (submittingRef.current || !sessionId) return;
    submittingRef.current = true;
    const durationMs = Date.now() - startedAt;
    try {
      await fetch(`/api/games/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          totalRounds: deck.length,
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
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590]">{GAME_LABELS.words.en}</p>
          <h1
            className="text-3xl font-bold text-[#1c1a16]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            单词记忆卡
          </h1>
          <p className="text-[13px] text-[#5a5550] mt-1">复习近 30 天每日英语词汇</p>
        </div>

        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-2">游戏模式</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("choice")}
              className={`py-3 text-[13px] border transition-colors ${
                mode === "choice"
                  ? "border-[#003087] bg-[#eef1f8] text-[#003087] font-semibold"
                  : "border-[#d8d4ca] text-[#5a5550] hover:border-[#003087]"
              }`}
            >
              英→中 选择
              <span className="block text-[10px] mt-1 text-[#9a9590]">+3 分 / 题</span>
            </button>
            <button
              onClick={() => setMode("spell")}
              className={`py-3 text-[13px] border transition-colors ${
                mode === "spell"
                  ? "border-[#003087] bg-[#eef1f8] text-[#003087] font-semibold"
                  : "border-[#d8d4ca] text-[#5a5550] hover:border-[#003087]"
              }`}
            >
              中→英 拼写
              <span className="block text-[10px] mt-1 text-[#9a9590]">+5 分 / 题</span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#d8d4ca] p-4 text-[12px] text-[#5a5550] space-y-2">
          <p className="font-semibold text-[#1c1a16]">规则</p>
          <ul className="space-y-1 list-disc pl-4">
            <li>词汇来自近 30 天的『每日英语』内容</li>
            <li>每局最多 20 题；选错不扣分，跳过 -1</li>
            <li>拼写需完全正确（不区分大小写）</li>
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

  if (phase === "loading") {
    return (
      <div className="text-center py-16">
        <p className="text-[13px] text-[#9a9590] italic">准备牌堆中...</p>
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <div className="space-y-4 max-w-md mx-auto text-center py-12">
        <p className="text-[14px] text-[#5a5550]">
          近 30 天词汇不足，请先到『每日英语』生成几天内容再来玩。
        </p>
        <button
          onClick={() => router.push("/english")}
          className="px-4 py-2 bg-[#003087] text-white text-[13px] hover:bg-[#00256a]"
        >
          前往每日英语
        </button>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <GameHeader
        title="单词记忆卡"
        subtitle={mode === "choice" ? "英→中选择" : "中→英拼写"}
        score={score}
        round={{ current: current + 1, total: deck.length }}
        startedAt={startedAt}
        onQuit={quit}
      />

      <div className="bg-white border border-[#d8d4ca]">
        <div className="px-5 py-6 border-b border-[#e4e0d8] text-center">
          {mode === "choice" ? (
            <>
              <p className="text-[10px] tracking-[0.18em] uppercase text-[#9a9590] mb-2">English</p>
              <p
                className="text-4xl font-bold text-[#1c1a16]"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
              >
                {card.word}
              </p>
              <p className="text-[13px] text-[#9a9590] mt-2">{card.phonetic}</p>
            </>
          ) : (
            <>
              <p className="text-[10px] tracking-[0.18em] uppercase text-[#9a9590] mb-2">中文释义</p>
              <p className="text-3xl font-semibold text-[#1c1a16]">{card.meaning}</p>
              <p className="text-[13px] text-[#9a9590] mt-2">{card.phonetic}</p>
            </>
          )}
        </div>

        {mode === "choice" ? (
          <div className="px-4 py-4 space-y-2">
            {optionsForChoice.current.map((opt) => {
              const isPicked = picked === opt;
              const isCorrect = picked !== null && opt === card.meaning;
              const isWrong = isPicked && opt !== card.meaning;
              return (
                <button
                  key={opt}
                  onClick={() => pickChoice(opt)}
                  disabled={picked !== null}
                  className={`w-full py-3 px-4 text-[14px] text-left border transition-colors ${
                    isCorrect
                      ? "border-[#1a5c34] bg-[#e8f1ea] text-[#1a5c34] font-semibold"
                      : isWrong
                        ? "border-[#8b1a2a] bg-[#f5e8ea] text-[#8b1a2a]"
                        : "border-[#d8d4ca] text-[#1c1a16] hover:border-[#003087] disabled:opacity-60"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-4 space-y-3">
            <input
              type="text"
              value={spellInput}
              onChange={(e) => setSpellInput(e.target.value)}
              disabled={picked !== null}
              placeholder="请输入英文单词"
              className="w-full px-4 py-3 border border-[#d8d4ca] bg-white text-[16px] text-[#1c1a16] focus:border-[#003087] focus:outline-none disabled:opacity-60"
              autoFocus
            />
            <button
              onClick={submitSpell}
              disabled={picked !== null}
              className="w-full py-3 bg-[#003087] text-white text-[13px] font-semibold hover:bg-[#00256a] disabled:opacity-40"
            >
              提交
            </button>
          </div>
        )}

        {feedback && (
          <div className="px-5 py-3 border-t border-[#e4e0d8]">
            <p
              className={`text-[13px] ${
                feedback.startsWith("正确") ? "text-[#1a5c34] font-semibold" : "text-[#5a5550]"
              }`}
            >
              {feedback}
            </p>
            {picked !== null && card.example && (
              <p className="text-[12px] text-[#9a9590] italic mt-1">{card.example}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {picked === null ? (
          <button
            onClick={skip}
            className="col-span-2 py-3 border border-[#d8d4ca] text-[13px] text-[#5a5550] hover:border-[#8b1a2a] hover:text-[#8b1a2a]"
          >
            跳过 -1
          </button>
        ) : (
          <button
            onClick={next}
            className="col-span-2 py-3 bg-[#003087] text-white text-[13px] font-semibold hover:bg-[#00256a]"
          >
            {current + 1 >= deck.length ? "查看本局成绩" : "下一题"}
          </button>
        )}
      </div>

      <ScorePanel
        open={phase === "finished"}
        title="单词记忆卡"
        score={score}
        totalRounds={deck.length}
        correct={correct}
        durationMs={Date.now() - startedAt}
        bestScore={bestScore}
        details={[
          { label: "模式", value: mode === "choice" ? "英→中" : "中→英" },
          { label: "用词数", value: String(deck.length) },
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
