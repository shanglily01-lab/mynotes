"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { getSubject } from "@/lib/subjects";

interface Article {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
}

export default function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const subject = getSubject(slug);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/subjects/${slug}/articles`)
      .then((r) => r.json())
      .then((d) => setArticles(d.articles ?? []))
      .finally(() => setLoading(false));
  }, [slug]);

  if (!subject) {
    return <div className="text-center py-20 text-gray-400">学科不存在</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{subject.name}</h1>
      <p className="text-sm text-gray-500 mb-6">最新文章与学习资料</p>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          暂无文章，请先在首页点击"拉取内容"
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white border border-gray-200 rounded-lg p-5"
            >
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
              <p className="text-sm text-gray-600 leading-relaxed">
                {article.summary}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
