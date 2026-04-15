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

function RecordCard({
  record,
  onDelete,
}: {
  record: MedicalRecord;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [summary, setSummary] = useState(record.aiSummary ?? "");
  const [error, setError] = useState("");
  const color = TYPE_COLORS[record.type] ?? "#5a5550";
  const canAnalyze = record.mimeType && SUPPORTED_ANALYZE.includes(record.mimeType);
  const canPreview = record.mimeType && SUPPORTED_PREVIEW.includes(record.mimeType);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError("");
    try {
      const res = await fetch(`/api/medical/${record.id}/analyze`, { method: "POST" });
      const data = await res.json() as { summary?: string; error?: string };
      if (data.error) { setError(data.error); return; }
      setSummary(data.summary ?? "");
    } catch (e) {
      setError(String(e));
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`确认删除「${record.title}」？`)) return;
    await fetch(`/api/medical/${record.id}`, { method: "DELETE" });
    onDelete(record.id);
  }

  return (
    <div className="bg-white border border-[#d8d4ca]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f5f2eb] transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="text-[10px] tracking-[0.12em] uppercase px-2 py-0.5 flex-shrink-0"
            style={{ color, border: `1px solid ${color}`, opacity: 0.85 }}
          >
            {TYPE_LABELS[record.type] ?? record.type}
          </span>
          <span className="text-[14px] text-[#1c1a16] font-medium truncate">{record.title}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <span className="text-[12px] text-[#9a9590]">{formatDate(record.recordDate)}</span>
          <span className="text-[#9a9590] text-sm">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-[#e4e0d8] px-5 py-5 space-y-4">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {record.fileExt && (
              <a
                href={`/api/medical/${record.id}/file`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-[12px] border border-[#d8d4ca] text-[#5a5550] hover:border-[#003087] hover:text-[#003087] transition-colors"
              >
                查看原件 (.{record.fileExt})
              </a>
            )}
            {canAnalyze && !summary && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-3 py-1.5 text-[12px] bg-[#003087] text-white hover:bg-[#00256a] transition-colors disabled:opacity-40"
              >
                {analyzing ? "AI 分析中..." : "AI 智能分析"}
              </button>
            )}
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-[12px] border border-[#d8d4ca] text-[#9a9590] hover:border-red-400 hover:text-red-500 transition-colors ml-auto"
            >
              删除
            </button>
          </div>

          {/* Image preview */}
          {canPreview && record.fileExt && (
            <div className="border border-[#e4e0d8] overflow-hidden">
              <img
                src={`/api/medical/${record.id}/file`}
                alt={record.title}
                className="max-w-full max-h-[400px] object-contain mx-auto block"
              />
            </div>
          )}

          {/* Notes */}
          {record.notes && (
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#9a9590] mb-1">备注</p>
              <p className="text-[13px] text-[#5a5550] leading-relaxed">{record.notes}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-[12px] text-red-500 border-l-2 border-red-400 pl-3">{error}</p>
          )}

          {/* AI Summary */}
          {summary && (
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#9a9590] mb-2">
                AI 分析报告
                <span className="ml-2 normal-case text-[#c0bab2]">仅供参考，不构成医疗诊断</span>
              </p>
              <div className="prose prose-sm max-w-none border border-[#e4e0d8] px-5 py-4 bg-[#fdfcf9]
                prose-headings:text-[#1c1a16] prose-headings:font-semibold
                prose-p:text-[#5a5550] prose-p:leading-relaxed prose-p:text-[13px]
                prose-li:text-[#5a5550] prose-li:text-[13px]
                prose-strong:text-[#1c1a16]
                prose-hr:border-[#e4e0d8]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UploadForm({ onUploaded }: { onUploaded: (r: MedicalRecord) => void }) {
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
    if (!title.trim()) { setError("请填写标题"); return; }
    setUploading(true);
    setError("");

    const form = new FormData();
    form.append("type", type);
    form.append("title", title.trim());
    form.append("date", date);
    form.append("notes", notes.trim());
    if (file) form.append("file", file);

    try {
      const res = await fetch("/api/medical", { method: "POST", body: form });
      const data = await res.json() as { record?: MedicalRecord; error?: string };
      if (data.error) { setError(data.error); return; }
      if (data.record) {
        onUploaded(data.record);
        setTitle("");
        setNotes("");
        setFile(null);
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
        <label className={labelClass}>标题 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="如：2024年度体检报告、血糖化验单..."
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>上传文件（JPG / PNG / PDF）</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-[13px] text-[#5a5550] file:mr-3 file:px-3 file:py-1.5 file:border file:border-[#d8d4ca] file:bg-[#f5f2eb] file:text-[12px] file:text-[#5a5550] file:cursor-pointer hover:file:border-[#003087]"
        />
      </div>

      <div>
        <label className={labelClass}>备注（可选）</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="记录就诊情况、医生建议等..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {error && <p className="text-[12px] text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={uploading}
        className="px-5 py-2 bg-[#003087] text-white text-[13px] hover:bg-[#00256a] transition-colors disabled:opacity-40"
      >
        {uploading ? "上传中..." : "保存记录"}
      </button>
    </form>
  );
}

export default function HealthPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch("/api/medical")
      .then((r) => r.json())
      .then((d) => setRecords(d.records ?? []))
      .finally(() => setLoading(false));
  }, []);

  function handleUploaded(record: MedicalRecord) {
    setRecords((prev) => [record, ...prev]);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  // Group by year-month
  const grouped = records.reduce<Record<string, MedicalRecord[]>>((acc, r) => {
    const d = new Date(r.recordDate);
    const key = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    (acc[key] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="border-b border-[#d8d4ca] pb-5">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">个人健康</p>
        <div className="flex items-end justify-between">
          <h1
            className="text-3xl font-bold text-[#1c1a16]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            疾病管理
          </h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className={`px-4 py-1.5 text-[13px] border transition-colors ${
              showForm
                ? "border-[#003087] text-[#003087]"
                : "border-[#d8d4ca] text-[#5a5550] hover:border-[#003087] hover:text-[#003087]"
            }`}
          >
            {showForm ? "收起" : "+ 上传记录"}
          </button>
        </div>
        <p className="text-[13px] text-[#9a9590] mt-1">存储体检报告、病例单，支持 AI 智能分析</p>
      </div>

      {/* Upload form */}
      {showForm && <UploadForm onUploaded={handleUploaded} />}

      {/* Record list */}
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
                  <RecordCard key={r.id} record={r} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
