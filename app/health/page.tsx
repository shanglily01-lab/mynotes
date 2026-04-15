"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MedicalRecord {
  id: string;
  type: string;
  title: string;
  recordDate: string;
  fileExt: string | null;
  mimeType: string | null;
  notes: string | null;
  aiSummary: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  checkup:      "体检报告",
  lab:          "化验单",
  imaging:      "影像报告",
  prescription: "处方单",
  other:        "其他病历",
};

const TYPE_COLORS: Record<string, string> = {
  checkup:      "#1a5c34",
  lab:          "#003087",
  imaging:      "#6b2d6e",
  prescription: "#7a4018",
  other:        "#5a5550",
};

const SUPPORTED_PREVIEW = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const SUPPORTED_ANALYZE = [...SUPPORTED_PREVIEW, "application/pdf"];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// ── 弹窗：图片预览 ───────────────────────────────────────────
function PreviewModal({ title, src, onClose }: { title: string; src: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="relative max-w-[92vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-8 right-0 text-white/70 hover:text-white text-lg leading-none"
        >
          ✕
        </button>
        <p className="text-white/60 text-[11px] mb-2 self-start truncate max-w-full">{title}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={title}
          className="max-w-full max-h-[82vh] object-contain"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
        />
      </div>
    </div>
  );
}

// ── 弹窗：AI 分析报告 ──────────────────────────────────────
function AnalysisModal({
  title,
  summary,
  analyzing,
  error,
  onClose,
  onReanalyze,
}: {
  title: string;
  summary: string;
  analyzing: boolean;
  error: string;
  onClose: () => void;
  onReanalyze: () => void;
}) {
  // 关闭：点遮罩或按 ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full md:max-w-2xl md:mx-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e0d8] flex-shrink-0">
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#9a9590]">AI 分析报告</p>
            <p className="text-[14px] font-semibold text-[#1c1a16] mt-0.5">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9a9590] hover:text-[#1c1a16] text-lg leading-none px-2"
          >
            ✕
          </button>
        </div>

        {/* Modal body — scrollable */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {analyzing && (
            <div className="py-12 text-center">
              <p className="text-[13px] text-[#9a9590] italic">AI 正在识别和分析医疗文件，请稍候...</p>
              <p className="text-[11px] text-[#c0bab2] mt-1">通常需要 10~30 秒</p>
            </div>
          )}
          {error && !analyzing && (
            <p className="text-[12px] text-red-500 border-l-2 border-red-400 pl-3 py-2">{error}</p>
          )}
          {summary && !analyzing && (
            <div className="prose prose-sm max-w-none
              prose-headings:text-[#1c1a16] prose-headings:font-semibold
              prose-p:text-[#5a5550] prose-p:leading-relaxed prose-p:text-[13px]
              prose-li:text-[#5a5550] prose-li:text-[13px]
              prose-strong:text-[#1c1a16]
              prose-hr:border-[#e4e0d8]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="px-5 py-3 border-t border-[#e4e0d8] flex items-center justify-between flex-shrink-0">
          <p className="text-[11px] text-[#c0bab2]">仅供参考，不构成医疗诊断</p>
          {summary && (
            <button
              onClick={onReanalyze}
              disabled={analyzing}
              className="text-[12px] text-[#5a5550] hover:text-[#003087] transition-colors disabled:opacity-40"
            >
              重新分析
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 单条记录卡片 ──────────────────────────────────────────
function RecordCard({
  record,
  autoAnalyze = false,
  onDelete,
}: {
  record: MedicalRecord;
  autoAnalyze?: boolean;
  onDelete: (id: string) => void;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [summary, setSummary] = useState(record.aiSummary ?? "");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const analyzed = useRef(false);

  const color = TYPE_COLORS[record.type] ?? "#5a5550";
  const canAnalyze = record.mimeType && SUPPORTED_ANALYZE.includes(record.mimeType);
  const canPreview = record.mimeType && SUPPORTED_PREVIEW.includes(record.mimeType);

  useEffect(() => {
    if (autoAnalyze && canAnalyze && !summary && !analyzed.current) {
      analyzed.current = true;
      setShowModal(true);
      void handleAnalyze();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAnalyze]);

  async function handleAnalyze(force = false) {
    setAnalyzing(true);
    setError("");
    try {
      const res = await fetch(`/api/medical/${record.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await res.json() as { summary?: string; error?: string };
      if (data.error) { setError(data.error); return; }
      setSummary(data.summary ?? "");
    } catch (e) {
      setError(String(e));
    } finally {
      setAnalyzing(false);
    }
  }

  function openAnalysis() {
    setShowModal(true);
    if (canAnalyze && !summary && !analyzing) {
      void handleAnalyze();
    }
  }

  async function handleDelete() {
    if (!confirm(`确认删除「${record.title}」？`)) return;
    await fetch(`/api/medical/${record.id}`, { method: "DELETE" });
    onDelete(record.id);
  }

  return (
    <>
      <div className="bg-white border border-[#d8d4ca] px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="text-[10px] tracking-[0.12em] uppercase px-2 py-0.5 flex-shrink-0"
            style={{ color, border: `1px solid ${color}`, opacity: 0.85 }}
          >
            {TYPE_LABELS[record.type] ?? record.type}
          </span>
          <div className="min-w-0">
            <p className="text-[14px] text-[#1c1a16] font-medium truncate">{record.title}</p>
            <p className="text-[11px] text-[#9a9590]">{formatDate(record.recordDate)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {canPreview && record.fileExt && (
            <button
              onClick={() => setShowPreview(true)}
              className="text-[12px] text-[#5a5550] hover:text-[#003087] transition-colors"
            >
              查看
            </button>
          )}
          {canAnalyze && (
            <button
              onClick={openAnalysis}
              className="px-3 py-1 text-[12px] bg-[#003087] text-white hover:bg-[#00256a] transition-colors"
            >
              {analyzing ? "分析中..." : summary ? "查看分析" : "AI 分析"}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-[12px] text-[#c0bab2] hover:text-red-500 transition-colors"
          >
            删除
          </button>
        </div>
      </div>

      {showPreview && (
        <PreviewModal
          title={record.title}
          src={`/api/medical/${record.id}/file`}
          onClose={() => setShowPreview(false)}
        />
      )}
      {showModal && (
        <AnalysisModal
          title={record.title}
          summary={summary}
          analyzing={analyzing}
          error={error}
          onClose={() => setShowModal(false)}
          onReanalyze={() => void handleAnalyze(true)}
        />
      )}
    </>
  );
}

// ── 上传表单 ─────────────────────────────────────────────
function UploadForm({ onUploaded }: { onUploaded: (r: MedicalRecord, hasFile: boolean) => void }) {
  const [type, setType] = useState("checkup");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalTitle = title.trim() || (file ? file.name.replace(/\.[^/.]+$/, "") : "");
    if (!finalTitle) { setError("请填写标题或选择文件"); return; }
    setUploading(true);
    setError("");

    const form = new FormData();
    form.append("type", type);
    form.append("title", finalTitle);
    form.append("date", date);
    form.append("notes", notes.trim());
    if (file) form.append("file", file);

    try {
      const res = await fetch("/api/medical", { method: "POST", body: form });
      const data = await res.json() as { record?: MedicalRecord; error?: string };
      if (data.error) { setError(data.error); return; }
      if (data.record) {
        onUploaded(data.record, !!file);
        setTitle(""); setNotes(""); setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setUploading(false);
    }
  }

  const inputClass = "w-full px-3 py-2 text-[13px] bg-white border border-[#d8d4ca] text-[#1c1a16] outline-none focus:border-[#003087] transition-colors";
  const labelClass = "block text-[10px] tracking-[0.15em] uppercase text-[#9a9590] mb-1";

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#d8d4ca] px-6 py-5 space-y-4">
      <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590]">上传新记录</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>文件类型</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>日期</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>上传文件（JPG / PNG / PDF）</label>
        <input
          ref={fileRef} type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            if (f) {
              const nameWithoutExt = f.name.replace(/\.[^/.]+$/, "");
              setTitle(nameWithoutExt);
            }
          }}
          className="w-full text-[13px] text-[#5a5550] file:mr-3 file:px-3 file:py-1.5 file:border file:border-[#d8d4ca] file:bg-[#f5f2eb] file:text-[12px] file:text-[#5a5550] file:cursor-pointer hover:file:border-[#003087]"
        />
      </div>

      <div>
        <label className={labelClass}>标题</label>
        <input
          type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="如：2024年度体检报告、血糖化验单..."
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>备注（可选）</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          placeholder="记录就诊情况、医生建议等..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {error && <p className="text-[12px] text-red-500">{error}</p>}

      <button type="submit" disabled={uploading}
        className="px-5 py-2 bg-[#003087] text-white text-[13px] hover:bg-[#00256a] transition-colors disabled:opacity-40">
        {uploading ? "上传中..." : "保存并分析"}
      </button>
    </form>
  );
}

// ── 主页面 ────────────────────────────────────────────────
export default function HealthPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRecordId, setNewRecordId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/medical")
      .then((r) => r.json())
      .then((d) => setRecords(d.records ?? []))
      .finally(() => setLoading(false));
  }, []);

  function handleUploaded(record: MedicalRecord, hasFile: boolean) {
    setRecords((prev) => [record, ...prev]);
    setShowForm(false);
    if (hasFile) setNewRecordId(record.id);
  }

  function handleDelete(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (newRecordId === id) setNewRecordId(null);
  }

  const grouped = records.reduce<Record<string, MedicalRecord[]>>((acc, r) => {
    const d = new Date(r.recordDate);
    const key = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    (acc[key] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-7">
      <div className="border-b border-[#d8d4ca] pb-5">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">个人健康</p>
        <div className="flex items-end justify-between">
          <h1 className="text-3xl font-bold text-[#1c1a16]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>
            疾病管理
          </h1>
          <button onClick={() => setShowForm((v) => !v)}
            className={`px-4 py-1.5 text-[13px] border transition-colors ${
              showForm ? "border-[#003087] text-[#003087]"
                       : "border-[#d8d4ca] text-[#5a5550] hover:border-[#003087] hover:text-[#003087]"
            }`}>
            {showForm ? "收起" : "+ 上传记录"}
          </button>
        </div>
        <p className="text-[13px] text-[#9a9590] mt-1">存储体检报告、病例单，上传后自动 AI 识别分析</p>
      </div>

      {showForm && <UploadForm onUploaded={handleUploaded} />}

      {loading ? (
        <p className="text-center py-16 text-[13px] text-[#9a9590] italic">加载中...</p>
      ) : records.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#d8d4ca]">
          <p className="text-[14px] text-[#9a9590] italic">暂无记录</p>
          <p className="text-[12px] text-[#9a9590] mt-1">上传体检报告或病例单开始管理健康档案</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, recs]) => (
            <div key={month}>
              <p className="text-[11px] tracking-[0.15em] uppercase text-[#9a9590] mb-2">{month}</p>
              <div className="space-y-2">
                {recs.map((r) => (
                  <RecordCard
                    key={r.id}
                    record={r}
                    autoAnalyze={r.id === newRecordId}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
