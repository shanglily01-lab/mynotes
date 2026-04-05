"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface VocabItem {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
}

interface PhraseItem {
  phrase: string;
  meaning: string;
  example: string;
  exampleZh: string;
}

interface DailyContent {
  topic: string;
  articleEn: string;
  articleZh: string;
  vocabulary: VocabItem[];
  phrases: PhraseItem[];
  date: string;
}

type Tab = "article" | "vocabulary" | "phrases";

function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
  }, []);

  const speak = useCallback((text: string, rate = 0.85) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = rate;
    u.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))
    ) ?? voices.find((v) => v.lang.startsWith("en-US"));
    if (preferred) u.voice = preferred;

    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);

    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported };
}

function SpeakButton({ text, rate, label }: { text: string; rate?: number; label?: string }) {
  const { speak, stop, speaking, supported } = useTTS();
  if (!supported) return null;

  return (
    <button
      onClick={() => (speaking ? stop() : speak(text, rate))}
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] tracking-[0.1em] uppercase border transition-colors ${
        speaking
          ? "border-[#003087] bg-[#003087] text-white"
          : "border-[#d8d4ca] text-[#5a5550] hover:border-[#003087] hover:text-[#003087]"
      }`}
    >
      {speaking ? "停止" : (label ?? "朗读")}
    </button>
  );
}

export default function EnglishPage() {
  const [content, setContent] = useState<DailyContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [tab, setTab] = useState<Tab>("article");
  const [showZh, setShowZh] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/english");
      const data = (await res.json()) as DailyContent;
      setContent(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/english", { method: "POST" });
      const data = (await res.json()) as DailyContent;
      setContent(data);
    } finally {
      setRegenerating(false);
    }
  }

  const tabLabels: Record<Tab, string> = {
    article: "今日短文",
    vocabulary: "词汇",
    phrases: "常用表达",
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="border-b border-[#d8d4ca] pb-5">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">
          {content
            ? new Date(content.date).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
            : "每日练习"}
        </p>
        <div className="flex items-end justify-between">
          <div>
            <h1
              className="text-3xl font-bold text-[#1c1a16]"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              每日英语
            </h1>
            {content && (
              <p className="text-[13px] text-[#5a5550] mt-1">
                今日话题：<span className="font-semibold capitalize">{content.topic}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-4 py-1.5 text-[13px] border border-[#d8d4ca] text-[#5a5550] hover:border-[#003087] hover:text-[#003087] transition-colors disabled:opacity-40"
          >
            {regenerating ? "生成中..." : "换一篇"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <p className="text-[13px] text-[#9a9590] italic">加载今日英语内容...</p>
          <p className="text-[11px] text-[#9a9590] mt-1">首次加载需 AI 生成，约 10 秒</p>
        </div>
      ) : !content ? (
        <div className="text-center py-16 border border-dashed border-[#d8d4ca]">
          <p className="text-[14px] text-[#9a9590] italic">加载失败，请刷新</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b border-[#d8d4ca]">
            {(["article", "vocabulary", "phrases"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2.5 text-[13px] border-b-2 -mb-px transition-colors ${
                  tab === t
                    ? "border-[#003087] text-[#003087] font-semibold"
                    : "border-transparent text-[#9a9590] hover:text-[#5a5550]"
                }`}
              >
                {tabLabels[t]}
              </button>
            ))}
          </div>

          {/* Article Tab */}
          {tab === "article" && (
            <div className="space-y-4">
              <div className="bg-white border border-[#d8d4ca]">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#e4e0d8]">
                  <span className="text-[10px] tracking-[0.18em] uppercase text-[#9a9590]">English</span>
                  <div className="flex gap-2">
                    <SpeakButton text={content.articleEn} rate={0.8} label="慢速" />
                    <SpeakButton text={content.articleEn} rate={1.0} label="正常" />
                  </div>
                </div>
                <div className="px-5 py-5">
                  <p
                    className="text-[15px] text-[#1c1a16] leading-loose whitespace-pre-line"
                    style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                  >
                    {content.articleEn}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#d8d4ca]">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#e4e0d8]">
                  <span className="text-[10px] tracking-[0.18em] uppercase text-[#9a9590]">中文翻译</span>
                  <button
                    onClick={() => setShowZh((v) => !v)}
                    className="text-[11px] text-[#003087] hover:text-[#00256a]"
                  >
                    {showZh ? "隐藏翻译" : "显示翻译"}
                  </button>
                </div>
                <div className="px-5 py-5">
                  {showZh ? (
                    <p className="text-[15px] text-[#5a5550] leading-loose whitespace-pre-line">
                      {content.articleZh}
                    </p>
                  ) : (
                    <p className="text-[13px] text-[#9a9590] italic">点击「显示翻译」查看中文对照</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Vocabulary Tab */}
          {tab === "vocabulary" && (
            <div className="space-y-2">
              {content.vocabulary.map((v, i) => (
                <div key={i} className="bg-white border border-[#d8d4ca]">
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3 mb-2">
                          <span
                            className="text-[18px] font-bold text-[#1c1a16]"
                            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                          >
                            {v.word}
                          </span>
                          <span className="text-[12px] text-[#9a9590] font-mono">{v.phonetic}</span>
                          <span className="text-[13px] text-[#003087] font-medium">{v.meaning}</span>
                        </div>
                        <p className="text-[13px] text-[#5a5550] italic leading-relaxed">{v.example}</p>
                      </div>
                      <SpeakButton text={`${v.word}. ${v.example}`} rate={0.85} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Phrases Tab */}
          {tab === "phrases" && (
            <div className="space-y-2">
              {content.phrases.map((p, i) => (
                <div key={i} className="bg-white border border-[#d8d4ca]">
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span
                          className="font-bold text-[#1c1a16] text-[15px]"
                          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                        >
                          {p.phrase}
                        </span>
                        <span className="ml-3 text-[13px] text-[#003087] font-medium">{p.meaning}</span>
                      </div>
                      <SpeakButton text={`${p.phrase}. ${p.example}`} rate={0.85} />
                    </div>
                    <p className="text-[13px] text-[#1c1a16] italic mb-1">{p.example}</p>
                    <p className="text-[12px] text-[#9a9590]">{p.exampleZh}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
