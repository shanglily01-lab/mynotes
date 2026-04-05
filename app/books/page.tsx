"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface BookRecord {
  id: string;
  subjectId: string;
  title: string;
  author: string | null;
  filePath: string | null;
  extension: string | null;
  status: string;
  error: string | null;
}

const SUBJECT_NAMES: Record<string, string> = {
  psychology: "心理学",
  biology:    "生物学",
  physics:    "物理学",
  sociology:  "社会学",
  ai:         "人工智能",
  philosophy: "哲学",
  theology:   "神学",
};

const SUBJECT_COLOR: Record<string, string> = {
  psychology: "#6b2d6e",
  biology:    "#1a5c34",
  physics:    "#003087",
  sociology:  "#7a4018",
  ai:         "#1a5060",
  philosophy: "#3a2870",
  theology:   "#7a1c30",
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:     { label: "待生成",  cls: "text-[#9a9590]" },
  downloading: { label: "生成中",  cls: "text-[#003087]" },
  done:        { label: "已完成",  cls: "text-[#1a5c34]" },
  failed:      { label: "失败",    cls: "text-[#7a1c30]" },
};

export default function BooksPage() {
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [scanning, setScanning] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch("/api/books");
      if (!res.ok) return;
      const data = (await res.json()) as { books: BookRecord[] };
      setBooks(data.books);
    } catch {
      // ignore transient fetch errors during polling
    }
  }, []);

  useEffect(() => { void fetchBooks(); }, [fetchBooks]);

  useEffect(() => {
    const hasDownloading = books.some((b) => b.status === "downloading");
    if (!hasDownloading) return;
    const timer = setInterval(() => { void fetchBooks(); }, 5000);
    return () => clearInterval(timer);
  }, [books, fetchBooks]);

  async function handleScan() {
    setScanning(true);
    setMsg("");
    try {
      const res = await fetch("/api/books/scan", { method: "POST" });
      const data = (await res.json()) as { totalInserted: number; bySubject: Record<string, number> };
      setMsg(`扫描完成，新增 ${data.totalInserted} 条书目记录`);
      await fetchBooks();
    } catch {
      setMsg("扫描失败");
    } finally {
      setScanning(false);
    }
  }

  async function handleDownload(subjectId?: string) {
    const key = subjectId ?? "all";
    setDownloading(key);
    setMsg("");
    try {
      const body = subjectId ? { subjectId } : { all: true };
      const res = await fetch("/api/books/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { done: number; failed: number; total: number; message?: string };
      setMsg(data.message ?? `完成：成功 ${data.done} 本，失败 ${data.failed} 本，共 ${data.total} 本`);
      await fetchBooks();
    } catch {
      setMsg("请求失败");
    } finally {
      setDownloading(null);
    }
  }

  async function handleRetry(id: string) {
    setDownloading(id);
    setMsg("");
    try {
      await fetch("/api/books/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setMsg("重试完成");
      await fetchBooks();
    } catch {
      setMsg("重试失败");
    } finally {
      setDownloading(null);
    }
  }

  const grouped = Object.entries(SUBJECT_NAMES).map(([id, name]) => ({
    id,
    name,
    books: books.filter((b) => b.subjectId === id),
  }));

  const stats = {
    total: books.length,
    done: books.filter((b) => b.status === "done").length,
    pending: books.filter((b) => b.status === "pending").length,
    failed: books.filter((b) => b.status === "failed").length,
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="border-b border-[#d8d4ca] pb-5">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">学术书库</p>
        <div className="flex items-end justify-between">
          <div>
            <h1
              className="text-3xl font-bold text-[#1c1a16]"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              书籍笔记
            </h1>
            {books.length > 0 && (
              <p className="text-[13px] text-[#9a9590] mt-1">
                共 {stats.total} 本 · 已生成 {stats.done} · 待处理 {stats.pending + stats.failed}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleScan}
              disabled={scanning}
              className="px-4 py-1.5 text-[13px] border border-[#d8d4ca] text-[#5a5550] hover:border-[#003087] hover:text-[#003087] transition-colors disabled:opacity-40"
            >
              {scanning ? "扫描中..." : "扫描书目"}
            </button>
            <button
              onClick={() => handleDownload()}
              disabled={downloading !== null || (stats.pending + stats.failed) === 0}
              className="px-4 py-1.5 text-[13px] bg-[#003087] text-white hover:bg-[#00256a] transition-colors disabled:opacity-40"
            >
              {downloading === "all" ? "生成中..." : `AI 生成全部 (${stats.pending + stats.failed})`}
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <p className="text-[13px] text-[#003087] border-l-2 border-[#003087] pl-3">{msg}</p>
      )}

      {books.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#d8d4ca]">
          <p className="text-[14px] text-[#9a9590] italic">暂无书目</p>
          <p className="text-[12px] text-[#9a9590] mt-1">点击「扫描书目」从学习资料中提取书单</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ id, name, books: subjectBooks }) => {
            if (subjectBooks.length === 0) return null;
            const color = SUBJECT_COLOR[id] ?? "#003087";
            const pendingCount = subjectBooks.filter((b) => b.status === "pending" || b.status === "failed").length;

            return (
              <div key={id} className="bg-white border border-[#d8d4ca]">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#e4e0d8]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span
                      className="text-[14px] font-semibold text-[#1c1a16]"
                      style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                    >
                      {name}
                    </span>
                    <span className="text-[11px] text-[#9a9590]">{subjectBooks.length} 本</span>
                  </div>
                  {pendingCount > 0 && (
                    <button
                      onClick={() => handleDownload(id)}
                      disabled={downloading !== null}
                      className="text-[11px] px-3 py-1 border border-[#d8d4ca] text-[#5a5550] hover:border-[#003087] hover:text-[#003087] transition-colors disabled:opacity-40"
                    >
                      {downloading === id ? "生成中..." : `AI 生成 (${pendingCount})`}
                    </button>
                  )}
                </div>
                <ul className="divide-y divide-[#e4e0d8]">
                  {subjectBooks.map((book) => {
                    const statusCfg = STATUS_CONFIG[book.status] ?? { label: book.status, cls: "text-[#9a9590]" };
                    return (
                      <li key={book.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          {book.status === "done" ? (
                            <Link
                              href={`/books/${book.id}`}
                              className="text-[13px] font-medium text-[#003087] hover:underline truncate block"
                              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                            >
                              {book.title}
                            </Link>
                          ) : (
                            <p className="text-[13px] font-medium text-[#1c1a16] truncate">{book.title}</p>
                          )}
                          {book.author && (
                            <p className="text-[11px] text-[#9a9590] mt-0.5">{book.author}</p>
                          )}
                          {book.error && (
                            <p className="text-[11px] text-[#7a1c30] mt-0.5 truncate">{book.error}</p>
                          )}
                        </div>
                        <span className={`text-[11px] shrink-0 tabular-nums ${statusCfg.cls}`}>
                          {statusCfg.label}
                        </span>
                        {book.status === "failed" && (
                          <button
                            onClick={() => handleRetry(book.id)}
                            disabled={downloading !== null}
                            className="text-[11px] text-[#003087] hover:underline disabled:opacity-40 shrink-0"
                          >
                            重试
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
