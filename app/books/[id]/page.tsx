"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BookRecord {
  id: string;
  subjectId: string;
  title: string;
  author: string | null;
  status: string;
  filePath: string | null;
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

export default function BookReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [book, setBook] = useState<BookRecord | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then((r) => r.json())
      .then((d: { book: BookRecord; content: string }) => {
        setBook(d.book);
        setContent(d.content);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleRegenerate() {
    if (!book) return;
    setRegenerating(true);
    try {
      await fetch("/api/books/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: book.id }),
      });
      const res = await fetch(`/api/books/${id}`);
      const d = (await res.json()) as { book: BookRecord; content: string };
      setBook(d.book);
      setContent(d.content);
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-[13px] text-[#9a9590] italic">加载中...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-16 border border-dashed border-[#d8d4ca]">
        <p className="text-[14px] text-[#9a9590] italic">书籍不存在</p>
        <Link href="/books" className="text-[13px] text-[#003087] mt-2 inline-block hover:underline">
          返回书单
        </Link>
      </div>
    );
  }

  const color = SUBJECT_COLOR[book.subjectId] ?? "#003087";

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="border-b border-[#d8d4ca] pb-5">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/books" className="text-[11px] text-[#9a9590] hover:text-[#5a5550] tracking-wide">
            书籍笔记
          </Link>
          <span className="text-[#d8d4ca]">/</span>
          <span
            className="text-[11px] font-medium tracking-[0.1em] uppercase"
            style={{ color }}
          >
            {SUBJECT_NAMES[book.subjectId] ?? book.subjectId}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-3xl font-bold text-[#1c1a16]"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              《{book.title}》
            </h1>
            {book.author && (
              <p className="text-[13px] text-[#9a9590] mt-1">{book.author}</p>
            )}
          </div>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="shrink-0 px-4 py-1.5 text-[13px] bg-[#003087] text-white hover:bg-[#00256a] transition-colors disabled:opacity-40"
          >
            {regenerating ? "生成中..." : content ? "重新生成" : "生成笔记"}
          </button>
        </div>
      </div>

      {/* Content */}
      {!content ? (
        <div className="text-center py-16 border border-dashed border-[#d8d4ca]">
          <p className="text-[14px] text-[#9a9590] italic">暂无笔记内容</p>
          <p className="text-[12px] text-[#9a9590] mt-1">点击右上角「生成笔记」即可生成 AI 精读笔记</p>
        </div>
      ) : (
        <div className="bg-white border border-[#d8d4ca] px-8 py-8">
          <div className="prose max-w-none
            prose-headings:font-bold
            prose-h1:text-2xl prose-h1:text-[#1c1a16]
            prose-h2:text-xl prose-h2:text-[#1c1a16] prose-h2:border-b prose-h2:border-[#e4e0d8] prose-h2:pb-2 prose-h2:mt-10
            prose-h3:text-base prose-h3:font-semibold prose-h3:text-[#003087] prose-h3:mt-6
            prose-h4:text-sm prose-h4:font-semibold prose-h4:text-[#5a5550]
            prose-p:text-[#5a5550] prose-p:leading-relaxed prose-p:text-[15px]
            prose-li:text-[#5a5550] prose-li:text-[15px]
            prose-strong:text-[#1c1a16]
            prose-a:text-[#003087] prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-[#003087] prose-blockquote:not-italic
            prose-code:bg-[#f5f2eb] prose-code:px-1 prose-code:text-sm
            prose-hr:border-[#e4e0d8]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
