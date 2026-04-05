"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { getSubject } from "@/lib/subjects";
import type { OpenResource } from "@/lib/subjects";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Article {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
}

type Tab = "material" | "cases" | "resources" | "articles";

const SUBJECT_COLOR: Record<string, string> = {
  psychology:  "#6b2d6e",
  biology:     "#1a5c34",
  physics:     "#003087",
  sociology:   "#7a4018",
  "ai-news":   "#1a5060",
  philosophy:  "#3a2870",
  theology:    "#7a1c30",
};

export default function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const subject = getSubject(slug);
  const color = SUBJECT_COLOR[slug] ?? "#003087";

  const [tab, setTab] = useState<Tab>("material");
  const [articles, setArticles] = useState<Article[]>([]);
  const [content, setContent] = useState<string>("");
  const [casesContent, setCasesContent] = useState<string>("");
  const [openResources, setOpenResources] = useState<OpenResource[]>(
    subject?.openResources ?? []
  );
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingMaterial, setLoadingMaterial] = useState(true);
  const [loadingCases, setLoadingCases] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingCases, setGeneratingCases] = useState(false);
  const [error, setError] = useState("");
  const [casesError, setCasesError] = useState("");

  useEffect(() => {
    fetch(`/api/subjects/${slug}/material`)
      .then((r) => r.json())
      .then((d) => {
        setContent(d.material?.content ?? "");
        setOpenResources(d.material?.openResources ?? subject?.openResources ?? []);
      })
      .finally(() => setLoadingMaterial(false));
  }, [slug, subject?.openResources]);

  useEffect(() => {
    if (tab !== "articles" || articles.length > 0) return;
    setLoadingArticles(true);
    fetch(`/api/subjects/${slug}/articles`)
      .then((r) => r.json())
      .then((d) => setArticles(d.articles ?? []))
      .finally(() => setLoadingArticles(false));
  }, [tab, slug, articles.length]);

  useEffect(() => {
    if (tab !== "cases" || casesContent) return;
    setLoadingCases(true);
    fetch(`/api/subjects/${slug}/cases`)
      .then((r) => r.json())
      .then((d) => setCasesContent(d.content ?? ""))
      .finally(() => setLoadingCases(false));
  }, [tab, slug, casesContent]);

  async function handleGenerateCases() {
    setGeneratingCases(true);
    setCasesError("");
    try {
      const res = await fetch(`/api/subjects/${slug}/cases`, { method: "POST" });
      const d = await res.json() as { ok: boolean; content: string; error?: string };
      if (d.ok) {
        setCasesContent(d.content);
      } else {
        setCasesError(d.error ?? "生成失败，请重试");
      }
    } finally {
      setGeneratingCases(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/subjects/${slug}/material`, { method: "POST" });
      const text = await res.text();
      if (!res.ok || !text) {
        setError(`生成失败 (${res.status})，请重试`);
        return;
      }
      const d = JSON.parse(text) as { ok: boolean; content: string; openResources: OpenResource[]; error?: string };
      if (d.ok) {
        setContent(d.content);
        setOpenResources(d.openResources ?? []);
      } else {
        setError(d.error ?? "生成失败，请重试");
      }
    } finally {
      setGenerating(false);
    }
  }

  if (!subject) {
    return (
      <div className="text-center py-16 border border-dashed border-[#d8d4ca]">
        <p className="text-[14px] text-[#9a9590] italic">学科不存在</p>
      </div>
    );
  }

  const tabLabels: Record<Tab, string> = {
    material: "学习指南",
    cases:    "经典案例",
    resources: "参考资源",
    articles: "最新文章",
  };

  const proseClasses = `prose max-w-none
    prose-headings:font-bold
    prose-h1:text-2xl prose-h1:text-[#1c1a16]
    prose-h2:text-xl prose-h2:text-[#1c1a16] prose-h2:border-b prose-h2:border-[#e4e0d8] prose-h2:pb-2 prose-h2:mt-10
    prose-h3:text-base prose-h3:font-semibold prose-h3:mt-6
    prose-h4:text-sm prose-h4:font-semibold prose-h4:text-[#5a5550]
    prose-p:text-[#5a5550] prose-p:leading-relaxed prose-p:text-[15px]
    prose-li:text-[#5a5550] prose-li:text-[15px]
    prose-strong:text-[#1c1a16]
    prose-a:text-[#003087] prose-a:no-underline hover:prose-a:underline
    prose-blockquote:not-italic prose-blockquote:border-l-[#003087]
    prose-code:bg-[#f5f2eb] prose-code:px-1 prose-code:text-sm
    prose-hr:border-[#e4e0d8]`;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="border-b border-[#d8d4ca] pb-5">
        <p className="text-[11px] tracking-[0.18em] uppercase mb-1" style={{ color }}>
          {subject.name}
        </p>
        <div className="flex items-end justify-between">
          <h1
            className="text-3xl font-bold text-[#1c1a16]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            {subject.name}
          </h1>
          {tab === "material" && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-1.5 text-[13px] bg-[#003087] text-white hover:bg-[#00256a] transition-colors disabled:opacity-40"
            >
              {generating ? "生成中..." : content ? "重新生成" : "生成学习指南"}
            </button>
          )}
          {tab === "cases" && (
            <button
              onClick={handleGenerateCases}
              disabled={generatingCases}
              className="px-4 py-1.5 text-[13px] bg-[#003087] text-white hover:bg-[#00256a] transition-colors disabled:opacity-40"
            >
              {generatingCases ? "生成中..." : casesContent ? "重新生成" : "生成经典案例"}
            </button>
          )}
        </div>
        <p className="text-[12px] text-[#9a9590] mt-2">经典著作 · 学习路径 · 最新资讯</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#d8d4ca]">
        {(["material", "cases", "resources", "articles"] as Tab[]).map((t) => (
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

      {/* Material Tab */}
      {tab === "material" && (
        <div>
          {error && (
            <p className="mb-4 text-[13px] text-[#7a1c30] border-l-2 border-[#7a1c30] pl-3">{error}</p>
          )}
          {loadingMaterial ? (
            <p className="text-center py-16 text-[13px] text-[#9a9590] italic">加载中...</p>
          ) : !content ? (
            <div className="text-center py-16 border border-dashed border-[#d8d4ca]">
              <p className="text-[14px] text-[#9a9590] italic">暂无学习指南</p>
              <p className="text-[12px] text-[#9a9590] mt-1">点击右上角「生成学习指南」，约60秒生成完毕</p>
            </div>
          ) : (
            <div className="bg-white border border-[#d8d4ca] px-8 py-8">
              <div className={proseClasses} style={{ "--tw-prose-headings-color": color } as React.CSSProperties}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cases Tab */}
      {tab === "cases" && (
        <div>
          {casesError && (
            <p className="mb-4 text-[13px] text-[#7a1c30] border-l-2 border-[#7a1c30] pl-3">{casesError}</p>
          )}
          {loadingCases ? (
            <p className="text-center py-16 text-[13px] text-[#9a9590] italic">加载中...</p>
          ) : !casesContent ? (
            <div className="text-center py-16 border border-dashed border-[#d8d4ca]">
              <p className="text-[14px] text-[#9a9590] italic">暂无经典案例</p>
              <p className="text-[12px] text-[#9a9590] mt-1">点击右上角「生成经典案例」，约60秒生成完毕</p>
            </div>
          ) : (
            <div className="bg-white border border-[#d8d4ca] px-8 py-8">
              <div className={proseClasses}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {casesContent}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resources Tab */}
      {tab === "resources" && (
        <div>
          {openResources.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#d8d4ca]">
              <p className="text-[14px] text-[#9a9590] italic">该学科暂无推荐资源</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[12px] text-[#9a9590] mb-4">
                以下为名校开放课件和权威教材链接，AI 生成学习指南时以这些课程体系为参考。
              </p>
              {openResources.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white border border-[#d8d4ca] px-5 py-4 hover:border-[#003087] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3
                        className="text-[14px] font-semibold text-[#1c1a16] mb-1 group-hover:text-[#003087] transition-colors"
                        style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                      >
                        {r.title}
                      </h3>
                      <p className="text-[12px] text-[#9a9590]">{r.description}</p>
                      <p className="text-[11px] text-[#003087] mt-1.5 truncate">{r.url}</p>
                    </div>
                    <span className="text-[#9a9590] flex-shrink-0 mt-1 text-sm">→</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Articles Tab */}
      {tab === "articles" && (
        <div>
          {loadingArticles ? (
            <p className="text-center py-16 text-[13px] text-[#9a9590] italic">加载中...</p>
          ) : articles.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#d8d4ca]">
              <p className="text-[14px] text-[#9a9590] italic">暂无文章</p>
              <p className="text-[12px] text-[#9a9590] mt-1">请先在首页点击「拉取内容」</p>
            </div>
          ) : (
            <div className="space-y-2">
              {articles.map((article) => (
                <div key={article.id} className="bg-white border border-[#d8d4ca] px-5 py-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] tracking-[0.1em] uppercase text-[#9a9590] border border-[#d8d4ca] px-1.5 py-0.5">
                      {article.source}
                    </span>
                    <span className="text-[11px] text-[#9a9590]">
                      {new Date(article.publishedAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  <h3
                    className="text-[14px] font-semibold text-[#1c1a16] mb-2"
                    style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                  >
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#003087] hover:underline"
                    >
                      {article.title}
                    </a>
                  </h3>
                  <p className="text-[13px] text-[#5a5550] leading-relaxed">{article.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
