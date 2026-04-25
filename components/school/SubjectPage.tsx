"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ImageViewer from "@/components/ui/ImageViewer";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { HSAnalysisResult } from "@/lib/claude";

type Tab = "knowledge" | "analyze" | "history";

interface HistoryItem {
  id: string;
  createdAt: string;
  chapter: string;
  questionSummary: string;
  weakPoints: string[];
  analysis: HSAnalysisResult | null;
  imageUrl?: string;
}

interface SubjectConfig {
  id: string;
  name: string;
  color: string;
}

// ---- Sub-components ----

function KnowledgeSection({
  title, subtitle, content, loading, error, color, subjectName, generateLabel, onGenerate, accent = false, enableMath = false,
}: {
  title: string; subtitle: string; content: string | null; loading: boolean; error: string | null;
  color: string; subjectName: string; generateLabel: string; onGenerate: () => void; accent?: boolean; enableMath?: boolean;
}) {
  return (
    <div className="border border-[#d8d4ca]" style={{ backgroundColor: accent ? "#faf8f5" : "white" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#e4e0d8]" style={{ borderLeftWidth: 3, borderLeftColor: color }}>
        <div>
          <h2 className="text-[14px] font-bold text-[#1c1a16]" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>{title}</h2>
          <p className="text-[11px] text-[#9a9590] mt-0.5">{subtitle}</p>
        </div>
        {content && !loading && (
          <button onClick={onGenerate} className="text-[11px] text-[#9a9590] hover:text-[#5a5550] border border-[#d8d4ca] px-2.5 py-1 flex-shrink-0 ml-4">重新生成</button>
        )}
      </div>
      <div className="px-5 py-4">
        {loading && <div className="py-10 text-center text-[#9a9590] text-[13px]">AI 正在生成{subjectName}{title}，请稍候（约40-90秒）...</div>}
        {!loading && !content && (
          <div className="py-10 text-center">
            {error && <p className="text-[#8b1a2a] text-[12px] mb-3">{error}</p>}
            {!error && <p className="text-[#9a9590] text-[13px] mb-4">尚未生成，点击按钮让 AI 生成</p>}
            <button
              onClick={onGenerate}
              className="px-5 py-2 text-[13px] font-medium border transition-colors active:opacity-70"
              style={{ borderColor: color, color, backgroundColor: "transparent" }}
            >
              {generateLabel}
            </button>
          </div>
        )}
        {!loading && content && (
          <div className="hs-markdown">
            <ReactMarkdown
              remarkPlugins={enableMath ? [remarkGfm, remarkMath] : [remarkGfm]}
              rehypePlugins={enableMath ? [rehypeKatex] : []}
            >{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = { 核心: "#8b1a2a", 重点: "#1a3870", 基础: "#5a5550" };
  return (
    <span className="inline-block text-[10px] px-1.5 py-0.5 border mr-2" style={{ borderColor: colors[level] ?? "#d8d4ca", color: colors[level] ?? "#5a5550" }}>
      {level}
    </span>
  );
}

function AnalysisCard({ analysis, subjectColor }: { analysis: HSAnalysisResult; subjectColor: string }) {
  return (
    <div className="space-y-5">
      <div className="border-l-2 pl-4 py-1" style={{ borderColor: subjectColor }}>
        <p className="text-[11px] text-[#9a9590] uppercase tracking-wide mb-1">题目概述</p>
        <p className="text-[15px] text-[#1c1a16] font-medium">{analysis.questionSummary}</p>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-[12px] text-[#5a5550]">章节：{analysis.chapter}</p>
          {analysis.correctAnswer && (
            <span className="text-[12px] font-bold px-2 py-0.5 border" style={{ color: subjectColor, borderColor: subjectColor }}>
              正确答案：{analysis.correctAnswer}
            </span>
          )}
        </div>
        {analysis.answerExplanation && (
          <div className="mt-3 p-3 bg-[#f5f2eb] border border-[#e4e0d8]">
            <p className="text-[10px] text-[#9a9590] uppercase tracking-wide mb-1">答案解析</p>
            <p className="text-[13px] text-[#1c1a16] leading-relaxed">{analysis.answerExplanation}</p>
          </div>
        )}
      </div>
      <div>
        <p className="text-[11px] text-[#9a9590] uppercase tracking-wide mb-2">薄弱知识点</p>
        <div className="space-y-2">
          {analysis.knowledgePoints.map((kp, i) => (
            <div key={i} className="border border-[#d8d4ca] p-3 bg-white">
              <div className="flex items-center gap-2 mb-1">
                <LevelBadge level={kp.level} />
                <span className="text-[13px] font-semibold text-[#1c1a16]">{kp.name}</span>
              </div>
              <p className="text-[12px] text-[#5a5550]">{kp.weakness}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] text-[#9a9590] uppercase tracking-wide mb-2">根因分析</p>
        <p className="text-[13px] text-[#1c1a16] leading-relaxed bg-[#f5f2eb] px-4 py-3 border border-[#e4e0d8]">{analysis.rootCause}</p>
      </div>
      <div>
        <p className="text-[11px] text-[#9a9590] uppercase tracking-wide mb-2">相关原理</p>
        <ol className="space-y-1.5">
          {analysis.principles.map((p, i) => (
            <li key={i} className="flex gap-3 text-[13px] text-[#1c1a16]">
              <span className="flex-shrink-0 w-5 h-5 text-[11px] flex items-center justify-center border font-bold" style={{ borderColor: subjectColor, color: subjectColor }}>{i + 1}</span>
              <span className="leading-relaxed">{p}</span>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <p className="text-[11px] text-[#9a9590] uppercase tracking-wide mb-2">重要结论</p>
        <ul className="space-y-1.5">
          {analysis.conclusions.map((c, i) => (
            <li key={i} className="flex gap-2 text-[13px] text-[#1c1a16]">
              <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subjectColor }} />
              <span className="leading-relaxed">{c}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="border px-4 py-3" style={{ borderColor: subjectColor, borderLeftWidth: 3 }}>
        <p className="text-[11px] text-[#9a9590] uppercase tracking-wide mb-1">学习建议</p>
        <p className="text-[13px] text-[#1c1a16] leading-relaxed">{analysis.studyPlan}</p>
      </div>
    </div>
  );
}

// ---- Main component ----

export default function SchoolSubjectPage({
  level,
  subject,
  config,
  backHref,
  backLabel,
}: {
  level: "primary" | "middle";
  subject: string;
  config: SubjectConfig;
  backHref: string;
  backLabel: string;
}) {
  const router = useRouter();
  const { name, color } = config;
  const enableMath = !["chinese", "english", "ethics"].includes(subject);

  const [tab, setTab] = useState<Tab>("knowledge");
  const [basicContent, setBasicContent] = useState<string | null>(null);
  const [basicLoading, setBasicLoading] = useState(false);
  const [basicError, setBasicError]     = useState<string | null>(null);
  const [advContent, setAdvContent]     = useState<string | null>(null);
  const [advLoading, setAdvLoading]     = useState(false);
  const [advError, setAdvError]         = useState<string | null>(null);
  const [loaded, setLoaded]             = useState(false);
  const [loadError, setLoadError]       = useState<string | null>(null);

  const [imageFile, setImageFile]           = useState<File | null>(null);
  const [imagePreview, setImagePreview]     = useState<string | null>(null);
  const [analyzing, setAnalyzing]           = useState(false);
  const [analysisResult, setAnalysisResult] = useState<HSAnalysisResult | null>(null);
  const [analyzeError, setAnalyzeError]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory]           = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded]   = useState(false);
  const [expandedId, setExpandedId]         = useState<string | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);

  const apiBase = `/api/school/${level}/${subject}`;

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const url = `${apiBase}/material`;
    fetch(url, { signal: ctrl.signal, cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
        return r.json() as Promise<{ basic: string | null; advanced: string | null }>;
      })
      .then((data) => { setBasicContent(data.basic); setAdvContent(data.advanced); })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        setLoadError(`加载失败 (${url}): ${msg}`);
      })
      .finally(() => { clearTimeout(timer); setLoaded(true); });
    return () => { clearTimeout(timer); ctrl.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  if (!config) { router.replace(backHref); return null; }

  async function generatePhase(phase: "basic" | "advanced") {
    const setLoading = phase === "basic" ? setBasicLoading : setAdvLoading;
    const setError   = phase === "basic" ? setBasicError   : setAdvError;
    const setContent = phase === "basic" ? setBasicContent : setAdvContent;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${apiBase}/material`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase }),
      });
      const data = await res.json() as { content?: string; error?: string };
      if (data.error) throw new Error(data.error);
      setContent(data.content ?? null);
    } catch (err) {
      console.error(err);
      setError("生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = useCallback((file: File | null) => {
    if (!file) return;
    setImageFile(file); setAnalysisResult(null); setAnalyzeError(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }

  async function handleAnalyze() {
    if (!imageFile) return;
    setAnalyzing(true); setAnalyzeError(null); setAnalysisResult(null);
    const form = new FormData();
    form.append("file", imageFile);
    try {
      const res = await fetch(`${apiBase}/analyze`, { method: "POST", body: form });
      const data = await res.json() as { analysis?: HSAnalysisResult; error?: string };
      if (!res.ok || data.error) { setAnalyzeError(data.error ?? "分析失败，请重试"); }
      else { setAnalysisResult(data.analysis ?? null); setHistoryLoaded(false); }
    } catch { setAnalyzeError("网络错误，请重试"); }
    finally { setAnalyzing(false); }
  }

  async function loadHistory() {
    if (historyLoaded) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`${apiBase}/history`);
      const data = await res.json() as { items: HistoryItem[] };
      setHistory(data.items ?? []);
    } finally { setHistoryLoading(false); setHistoryLoaded(true); }
  }

  async function deleteRecord(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/school/analyze/${id}`, { method: "DELETE" });
      setHistory((h) => h.filter((item) => item.id !== id));
      if (expandedId === id) setExpandedId(null);
    } finally { setDeletingId(null); }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "knowledge", label: "知识体系" },
    { id: "analyze",   label: "错题分析" },
    { id: "history",   label: "历史记录" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href={backHref} className="text-[#9a9590] hover:text-[#5a5550] text-[13px]">{backLabel}</Link>
        <span className="text-[#d8d4ca]">/</span>
        <span className="text-[15px] font-bold" style={{ color, fontFamily: "var(--font-playfair, Georgia, serif)" }}>{name}</span>
      </div>

      <div className="flex border-b border-[#d8d4ca] mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { if (t.id === "history") { setTab("history"); void loadHistory(); } else setTab(t.id); }}
            className={`px-4 py-2.5 text-[13px] border-b-2 transition-colors ${tab === t.id ? "font-semibold border-b-2" : "border-transparent text-[#5a5550] hover:text-[#1c1a16]"}`}
            style={tab === t.id ? { borderBottomColor: color, color } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Knowledge */}
      {tab === "knowledge" && (
        <div className="space-y-8">
          <style>{`
            .hs-markdown h2 { font-size:1.05rem;font-weight:700;margin-top:1.75rem;margin-bottom:0.6rem;color:${color};border-bottom:1px solid #e4e0d8;padding-bottom:0.35rem;font-family:var(--font-playfair,Georgia,serif); }
            .hs-markdown h3 { font-size:0.93rem;font-weight:700;margin-top:1.4rem;margin-bottom:0.45rem;color:#1c1a16;font-family:var(--font-playfair,Georgia,serif); }
            .hs-markdown p  { font-size:0.875rem;line-height:1.7;color:#1c1a16;margin-bottom:0.65rem; }
            .hs-markdown ul,ol { font-size:0.875rem;padding-left:1.25rem;color:#1c1a16; }
            .hs-markdown li { margin-bottom:0.3rem;line-height:1.6; }
            .hs-markdown strong { font-weight:700;color:#1c1a16; }
            .hs-markdown hr { border-color:#e4e0d8;margin:1.25rem 0; }
          `}</style>
          {!loaded && !loadError && <div className="py-10 text-center text-[#9a9590] text-[13px]">加载中...（15秒超时）</div>}
          {loadError && (
            <div className="px-4 py-3 border border-[#8b1a2a] bg-[#fdf6f7] text-[#8b1a2a] text-[12px] break-all">
              <p className="font-bold mb-1">⚠ 网络/API 错误</p>
              <p className="font-mono text-[11px]">{loadError}</p>
              <p className="mt-2 text-[#5a5550]">UA: {typeof navigator !== "undefined" ? navigator.userAgent : "?"}</p>
              <p className="mt-1 text-[#5a5550]">Origin: {typeof location !== "undefined" ? location.origin : "?"}</p>
            </div>
          )}
          {loaded && !loadError && (
            <>
              <KnowledgeSection
                title="基础知识体系" subtitle="全章节考点 · 规则方法 · 考试重点 · 易错辨析"
                content={basicContent} loading={basicLoading} error={basicError}
                color={color} subjectName={name} generateLabel="生成基础知识体系"
                onGenerate={() => void generatePhase("basic")} enableMath={enableMath}
              />
              <KnowledgeSection
                title="进阶深度拓展" subtitle="深层理解 · 解题技巧 · 考试命题规律 · 高分策略"
                content={advContent} loading={advLoading} error={advError}
                color={color} subjectName={name} generateLabel="生成进阶深度拓展"
                onGenerate={() => void generatePhase("advanced")} accent enableMath={enableMath}
              />
            </>
          )}
        </div>
      )}

      {/* Tab 2: Analyze */}
      {tab === "analyze" && (
        <div className="space-y-5">
          <div>
            <p className="text-[12px] text-[#9a9590] mb-3">上传错题图片（支持 jpg/png/webp，最大 10MB）</p>
            <div
              className="border-2 border-dashed border-[#d8d4ca] hover:border-[#003087] transition-colors cursor-pointer relative"
              style={{ minHeight: 140 }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
              {!imagePreview && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#9a9590]">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                  </svg>
                  <p className="text-[13px]">点击或拖拽上传错题图片</p>
                </div>
              )}
              {imagePreview && (
                <div className="p-3 flex justify-center">
                  <ImageViewer src={imagePreview} alt="wrong answer" className="max-h-64 object-contain" />
                </div>
              )}
            </div>
            {imagePreview && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => void handleAnalyze()} disabled={analyzing}
                  className="px-5 py-2 text-[13px] font-medium text-white transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: color }}>
                  {analyzing ? "AI 正在分析..." : "开始 AI 诊断"}
                </button>
                <button onClick={() => { setImageFile(null); setImagePreview(null); setAnalysisResult(null); setAnalyzeError(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="px-4 py-2 text-[13px] border border-[#d8d4ca] text-[#5a5550] hover:border-[#9a9590]">
                  重新选图
                </button>
              </div>
            )}
          </div>
          {analyzing && <div className="py-8 text-center text-[#9a9590] text-[13px] border border-[#e4e0d8]">AI 正在识别题目并诊断薄弱知识点，请稍候（约15-30秒）...</div>}
          {analyzeError && <div className="px-4 py-3 border border-[#8b1a2a] text-[#8b1a2a] text-[13px]">{analyzeError}</div>}
          {analysisResult && !analyzing && (
            <div>
              <div className="border-t border-[#e4e0d8] pt-5">
                <p className="text-[11px] uppercase tracking-wide mb-4" style={{ color, fontFamily: "var(--font-playfair, Georgia, serif)" }}>诊断结果</p>
                <AnalysisCard analysis={analysisResult} subjectColor={color} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: History */}
      {tab === "history" && (
        <div>
          {historyLoading && <div className="py-12 text-center text-[#9a9590] text-[13px]">加载中...</div>}
          {!historyLoading && history.length === 0 && (
            <div className="py-16 text-center text-[#9a9590] text-[13px]">暂无历史记录，前往「错题分析」上传错题</div>
          )}
          {!historyLoading && history.length > 0 && (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="border border-[#d8d4ca] bg-white">
                  <div className="flex items-start justify-between px-4 py-3 cursor-pointer hover:bg-[#f5f2eb] transition-colors"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] px-2 py-0.5 border" style={{ borderColor: color, color }}>{item.chapter || "未知章节"}</span>
                        <span className="text-[11px] text-[#9a9590]">{new Date(item.createdAt).toLocaleDateString("zh-CN")}</span>
                      </div>
                      <p className="text-[13px] text-[#1c1a16] truncate">{item.questionSummary || "无摘要"}</p>
                      {item.weakPoints.length > 0 && (
                        <p className="text-[11px] text-[#9a9590] mt-0.5">薄弱点：{item.weakPoints.join("、")}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); void deleteRecord(item.id); }}
                        disabled={deletingId === item.id}
                        className="text-[11px] text-[#9a9590] hover:text-[#8b1a2a] transition-colors disabled:opacity-40">
                        {deletingId === item.id ? "删除中" : "删除"}
                      </button>
                      <span className="text-[#d8d4ca]">{expandedId === item.id ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  {expandedId === item.id && item.analysis && (
                    <div className="px-4 pb-5 border-t border-[#e4e0d8] pt-4 space-y-4">
                      {item.imageUrl && (
                        <div>
                          <p className="text-[10px] text-[#9a9590] uppercase tracking-wide mb-2">原题图片</p>
                          <ImageViewer src={item.imageUrl} alt="原题" className="max-h-64 object-contain mx-auto border border-[#e4e0d8]" />
                        </div>
                      )}
                      <AnalysisCard analysis={item.analysis} subjectColor={color} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
