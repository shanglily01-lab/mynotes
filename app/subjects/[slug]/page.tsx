"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { getSubject } from "@/lib/subjects";
import type { SubjectRoadmap } from "@/lib/claude";

interface Article {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
}

type Tab = "roadmap" | "articles";

export default function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const subject = getSubject(slug);
  const [tab, setTab] = useState<Tab>("roadmap");
  const [articles, setArticles] = useState<Article[]>([]);
  const [roadmap, setRoadmap] = useState<SubjectRoadmap | null>(null);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedStage, setExpandedStage] = useState<number>(0);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/subjects/${slug}/material`)
      .then((r) => r.json())
      .then((d) => setRoadmap(d.material?.roadmap ?? null))
      .finally(() => setLoadingRoadmap(false));
  }, [slug]);

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
    try {
      const res = await fetch(`/api/subjects/${slug}/material`, { method: "POST" });
      const d = await res.json();
      if (d.ok) setRoadmap(d.roadmap as SubjectRoadmap);
    } finally {
      setGenerating(false);
    }
  }

  if (!subject) {
    return <div className="text-center py-20 text-gray-400">学科不存在</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
          <p className="text-sm text-gray-500 mt-1">系统性学习路径 · 最新资讯</p>
        </div>
        {tab === "roadmap" && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "生成中..." : roadmap ? "重新生成" : "生成学习路径"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(["roadmap", "articles"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "roadmap" ? "学习路径" : "最新文章"}
          </button>
        ))}
      </div>

      {/* Roadmap Tab */}
      {tab === "roadmap" && (
        <div>
          {loadingRoadmap ? (
            <div className="text-center py-20 text-gray-400">加载中...</div>
          ) : !roadmap ? (
            <div className="text-center py-20">
              <p className="text-gray-400 mb-4">暂无学习路径，点击右上角按钮生成</p>
              <p className="text-xs text-gray-300">生成需要约30秒，请耐心等待</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
                <h2 className="font-semibold text-blue-900 mb-2">学科概述</h2>
                <p className="text-sm text-blue-800 leading-relaxed">{roadmap.overview}</p>
                <div className="mt-3 pt-3 border-t border-blue-100">
                  <h3 className="text-xs font-medium text-blue-700 mb-1">为什么要学</h3>
                  <p className="text-sm text-blue-700 leading-relaxed">{roadmap.whyLearn}</p>
                </div>
              </div>

              {/* Stages */}
              <div className="space-y-4">
                {roadmap.stages.map((stage, si) => (
                  <div key={si} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Stage header */}
                    <button
                      onClick={() => setExpandedStage(expandedStage === si ? -1 : si)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                          {si + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-gray-800">{stage.stage}</div>
                          <div className="text-xs text-gray-500">{stage.duration} · {stage.goal}</div>
                        </div>
                      </div>
                      <span className="text-gray-400 text-lg">{expandedStage === si ? "−" : "+"}</span>
                    </button>

                    {expandedStage === si && (
                      <div className="p-4 space-y-3">
                        {/* Topics */}
                        {stage.topics.map((topic, ti) => {
                          const key = si * 100 + ti;
                          const isOpen = expandedTopic === key;
                          return (
                            <div key={ti} className="border border-gray-100 rounded-lg overflow-hidden">
                              <button
                                onClick={() => setExpandedTopic(isOpen ? null : key)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
                              >
                                <span className="font-medium text-gray-700 text-sm">{topic.title}</span>
                                <span className="text-gray-400">{isOpen ? "−" : "+"}</span>
                              </button>
                              {isOpen && (
                                <div className="px-4 pb-4">
                                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{topic.content}</p>
                                  <div className="bg-gray-50 rounded p-3">
                                    <div className="text-xs font-medium text-gray-500 mb-2">核心要点</div>
                                    <ul className="space-y-1">
                                      {topic.keyPoints.map((kp, ki) => (
                                        <li key={ki} className="text-sm text-gray-700 flex gap-2">
                                          <span className="text-blue-500 flex-shrink-0">•</span>
                                          {kp}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Milestone */}
                        <div className="mt-2 px-4 py-3 bg-green-50 border border-green-100 rounded-lg">
                          <span className="text-xs font-medium text-green-700">阶段里程碑：</span>
                          <span className="text-sm text-green-800 ml-1">{stage.milestone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
