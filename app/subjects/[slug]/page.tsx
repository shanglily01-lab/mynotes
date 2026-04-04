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

type Tab = "material" | "resources" | "articles";

export default function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const subject = getSubject(slug);

  const [tab, setTab] = useState<Tab>("material");
  const [articles, setArticles] = useState<Article[]>([]);
  const [content, setContent] = useState<string>("");
  const [openResources, setOpenResources] = useState<OpenResource[]>(
    subject?.openResources ?? []
  );
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingMaterial, setLoadingMaterial] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

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
    return <div className="text-center py-20 text-gray-400">学科不存在</div>;
  }

  const tabLabels: Record<Tab, string> = {
    material: "学习指南",
    resources: "参考资源",
    articles: "最新文章",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
          <p className="text-sm text-gray-500 mt-1">经典著作 · 学习路径 · 最新资讯</p>
        </div>
        {tab === "material" && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "生成中（约60s）..." : content ? "重新生成" : "生成学习指南"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(["material", "resources", "articles"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
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
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}
          {loadingMaterial ? (
            <div className="text-center py-20 text-gray-400">加载中...</div>
          ) : !content ? (
            <div className="text-center py-20">
              <p className="text-gray-400 mb-2">暂无学习指南</p>
              <p className="text-xs text-gray-300">点击右上角"生成学习指南"，约60秒生成完毕</p>
            </div>
          ) : (
            <div className="prose prose-gray max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h1:text-2xl prose-h2:text-xl prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2
              prose-h3:text-lg prose-h3:text-blue-700
              prose-h4:text-base prose-h4:text-gray-800
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-li:text-gray-700
              prose-strong:text-gray-900
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-blue-300 prose-blockquote:bg-blue-50 prose-blockquote:rounded
              prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-code:text-sm
              prose-hr:border-gray-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {/* Resources Tab */}
      {tab === "resources" && (
        <div>
          {openResources.length === 0 ? (
            <div className="text-center py-20 text-gray-400">该学科暂无推荐资源</div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                以下为名校开放课件和权威教材链接，AI 生成学习指南时以这些课程体系为参考。
              </p>
              {openResources.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">{r.title}</h3>
                      <p className="text-sm text-gray-500">{r.description}</p>
                      <p className="text-xs text-blue-500 mt-2 truncate">{r.url}</p>
                    </div>
                    <span className="text-gray-400 flex-shrink-0 mt-1">→</span>
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
            <div className="text-center py-20 text-gray-400">加载中...</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              暂无文章，请先在首页点击"拉取内容"
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div key={article.id} className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                      {article.source}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(article.publishedAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 hover:underline"
                    >
                      {article.title}
                    </a>
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{article.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
