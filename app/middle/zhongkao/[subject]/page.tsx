"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { getMiddleSubject } from "@/lib/middle-subjects";

type Mode = "real" | "predict";

interface ParsedPaper {
  intro: string;
  questions: { header: string; question: string; answer: string }[];
}

const ENABLE_MATH_SUBJECTS = new Set(["math", "physics", "chemistry", "biology"]);
const QUESTION_HEADER = /^## 第\s*\d+\s*题.*$/gm;
const ANSWER_MARKER = /^【答案与解析】$/m;

function parsePaper(md: string): ParsedPaper {
  if (!md) return { intro: "", questions: [] };
  const matches = [...md.matchAll(QUESTION_HEADER)];
  if (matches.length === 0) {
    return { intro: md.trim(), questions: [] };
  }
  const introEnd = matches[0]!.index!;
  const intro = md.slice(0, introEnd).trim();
  const questions: ParsedPaper["questions"] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i]!.index!;
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : md.length;
    const block = md.slice(start, end).trim();
    const headerLineMatch = block.match(/^##\s*(.+)$/m);
    const header = headerLineMatch?.[1]?.trim() ?? `第 ${i + 1} 题`;
    const body = block.replace(/^##.*$/m, "").trim();
    const parts = body.split(ANSWER_MARKER);
    const question = (parts[0] ?? "").replace(/---\s*$/, "").trim();
    const answer = (parts[1] ?? "").replace(/---\s*$/, "").trim();
    questions.push({ header, question, answer });
  }
  return { intro, questions };
}

export default function ZhongkaoSubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = use(params);
  const router = useRouter();
  const config = getMiddleSubject(subject);
  const enableMath = ENABLE_MATH_SUBJECTS.has(subject);

  const [mode, setMode] = useState<Mode>("real");
  const [realContent, setRealContent] = useState<string | null>(null);
  const [predictContent, setPredictContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<Mode, boolean>>({ real: false, predict: false });
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!config) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);

    async function loadOne(type: Mode) {
      const res = await fetch(`/api/middle/zhongkao/${subject}?type=${type}`, {
        signal: ctrl.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { content: string | null };
      return data.content;
    }

    Promise.all([loadOne("real"), loadOne("predict")])
      .then(([real, predict]) => {
        setRealContent(real);
        setPredictContent(predict);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        setError(`加载失败：${msg}`);
      })
      .finally(() => { clearTimeout(timer); setLoaded(true); });

    return () => { clearTimeout(timer); ctrl.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  if (!config) { router.replace("/middle/zhongkao"); return null; }
  const { name, color } = config;

  async function generate(type: Mode) {
    setLoading((s) => ({ ...s, [type]: true }));
    setError(null);
    try {
      const res = await fetch(`/api/middle/zhongkao/${subject}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json() as { content?: string; error?: string };
      if (data.error) throw new Error(data.error);
      if (type === "real") setRealContent(data.content ?? null);
      else setPredictContent(data.content ?? null);
      setOpenMap({});
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`生成失败：${msg}`);
    } finally {
      setLoading((s) => ({ ...s, [type]: false }));
    }
  }

  const currentContent = mode === "real" ? realContent : predictContent;
  const currentLoading = loading[mode];
  const parsed = useMemo(() => parsePaper(currentContent ?? ""), [currentContent]);

  const TABS: { id: Mode; label: string; sub: string }[] = [
    { id: "real",    label: "真题仿真",   sub: "2023-2025 命题风格" },
    { id: "predict", label: "2026 预测", sub: "命题趋势 + 预测卷" },
  ];

  const accent = mode === "predict" ? "#8b1a2a" : color;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/middle" className="text-[#9a9590] hover:text-[#5a5550] text-[13px]">初中学习</Link>
        <span className="text-[#d8d4ca]">/</span>
        <Link href="/middle/zhongkao" className="text-[#9a9590] hover:text-[#5a5550] text-[13px]">中考专题</Link>
        <span className="text-[#d8d4ca]">/</span>
        <span className="text-[15px] font-bold" style={{ color, fontFamily: "var(--font-playfair, Georgia, serif)" }}>
          {name}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#d8d4ca] mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setMode(t.id); setOpenMap({}); }}
            className={`flex-1 px-4 py-3 text-left border-b-2 transition-colors ${
              mode === t.id
                ? "font-semibold"
                : "border-transparent text-[#5a5550] hover:text-[#1c1a16]"
            }`}
            style={mode === t.id ? { borderBottomColor: t.id === "predict" ? "#8b1a2a" : color, color: t.id === "predict" ? "#8b1a2a" : color } : undefined}
          >
            <p className="text-[14px]">{t.label}</p>
            <p className="text-[11px] text-[#9a9590] mt-0.5">{t.sub}</p>
          </button>
        ))}
      </div>

      {/* Page-level loading / error */}
      {!loaded && !error && (
        <div className="py-10 text-center text-[#9a9590] text-[13px]">加载中...（15 秒超时）</div>
      )}
      {error && (
        <div className="px-4 py-3 border border-[#8b1a2a] bg-[#fdf6f7] text-[#8b1a2a] text-[12px] break-all mb-4">
          <p className="font-bold mb-1">⚠ 错误</p>
          <p className="font-mono text-[11px]">{error}</p>
        </div>
      )}

      {loaded && (
        <>
          {/* Generate / regenerate header */}
          <div className="flex items-center justify-between mb-5 px-4 py-3 border border-[#e4e0d8] bg-white" style={{ borderLeftWidth: 3, borderLeftColor: accent }}>
            <div>
              <p className="text-[13px] font-bold text-[#1c1a16]" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>
                {mode === "real" ? `${name}中考真题仿真练习` : `${name} 2026 中考预测卷`}
              </p>
              <p className="text-[11px] text-[#9a9590] mt-0.5">
                {currentContent ? "AI 已生成，可重新生成换一套" : "尚未生成，点击按钮让 AI 生成"}
              </p>
            </div>
            <button
              onClick={() => void generate(mode)}
              disabled={currentLoading}
              className="px-4 py-1.5 text-[12px] font-medium text-white active:opacity-70 disabled:opacity-50 transition-opacity flex-shrink-0 ml-3"
              style={{ backgroundColor: accent }}
            >
              {currentLoading ? "AI 生成中..." : currentContent ? "重新生成" : "生成"}
            </button>
          </div>

          {currentLoading && (
            <div className="py-10 text-center text-[#9a9590] text-[13px] border border-[#e4e0d8]">
              AI 正在生成{mode === "real" ? "仿真练习卷" : "2026 预测卷"}，请稍候（约 60-120 秒）...
            </div>
          )}

          {!currentLoading && !currentContent && (
            <div className="py-12 text-center text-[#9a9590] text-[13px] border border-dashed border-[#d8d4ca]">
              点击上方「生成」按钮开始
            </div>
          )}

          {!currentLoading && currentContent && (
            <div className="space-y-4">
              <style>{`
                .zk-md h2 { font-size:1rem;font-weight:700;margin-top:0.6rem;margin-bottom:0.5rem;color:${accent};font-family:var(--font-playfair,Georgia,serif); }
                .zk-md h1 { font-size:1.15rem;font-weight:700;margin-bottom:0.6rem;color:${accent};font-family:var(--font-playfair,Georgia,serif); }
                .zk-md p { font-size:0.875rem;line-height:1.75;color:#1c1a16;margin-bottom:0.55rem; }
                .zk-md ul,.zk-md ol { font-size:0.875rem;padding-left:1.25rem;color:#1c1a16; }
                .zk-md li { margin-bottom:0.3rem;line-height:1.65; }
                .zk-md strong { font-weight:700;color:#1c1a16; }
                .zk-md blockquote { border-left:3px solid ${accent};padding:0.5rem 0.85rem;background:#faf8f5;color:#5a5550;font-size:0.85rem;margin:0.5rem 0;font-style:italic; }
                .zk-md hr { border-color:#e4e0d8;margin:0.85rem 0; }
                .zk-md code { background:#f5f2eb;padding:0.05rem 0.35rem;border-radius:2px;font-size:0.8rem; }
              `}</style>

              {parsed.intro && (
                <div className="border border-[#e4e0d8] bg-[#faf8f5] px-5 py-4">
                  <div className="zk-md">
                    <ReactMarkdown
                      remarkPlugins={enableMath ? [remarkGfm, remarkMath] : [remarkGfm]}
                      rehypePlugins={enableMath ? [rehypeKatex] : []}
                    >
                      {parsed.intro}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {parsed.questions.length === 0 && parsed.intro && (
                <p className="text-[12px] text-[#9a9590]">未识别到题目结构，仅展示原始内容</p>
              )}

              {parsed.questions.map((q, i) => {
                const key = `${mode}-${i}`;
                const open = openMap[key] ?? false;
                return (
                  <div key={key} className="border border-[#d8d4ca] bg-white">
                    <div className="px-5 py-3 border-b border-[#e4e0d8]" style={{ borderLeftWidth: 3, borderLeftColor: accent }}>
                      <p className="text-[13px] font-bold text-[#1c1a16]" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>
                        {q.header}
                      </p>
                    </div>
                    <div className="px-5 py-4 zk-md">
                      <ReactMarkdown
                        remarkPlugins={enableMath ? [remarkGfm, remarkMath] : [remarkGfm]}
                        rehypePlugins={enableMath ? [rehypeKatex] : []}
                      >
                        {q.question}
                      </ReactMarkdown>
                    </div>
                    {q.answer && (
                      <div className="border-t border-[#e4e0d8]">
                        <button
                          onClick={() => setOpenMap((m) => ({ ...m, [key]: !open }))}
                          className="w-full px-5 py-2.5 text-left text-[12px] font-medium hover:bg-[#f5f2eb] active:bg-[#ede8dd] transition-colors flex items-center justify-between"
                          style={{ color: accent }}
                        >
                          <span>{open ? "收起答案与解析" : "查看答案与解析"}</span>
                          <span>{open ? "▲" : "▼"}</span>
                        </button>
                        {open && (
                          <div className="px-5 pb-4 pt-1 bg-[#faf8f5] zk-md">
                            <ReactMarkdown
                              remarkPlugins={enableMath ? [remarkGfm, remarkMath] : [remarkGfm]}
                              rehypePlugins={enableMath ? [rehypeKatex] : []}
                            >
                              {q.answer}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
