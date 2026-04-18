"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Hero {
  id: string;
  name: string;
  title: string;
}

interface Race {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  bgColor: string;
  heroes: Hero[];
}

const RACES: Race[] = [
  {
    id: "human",
    name: "人族联盟",
    subtitle: "洛丹伦王国",
    color: "#003087",
    bgColor: "#eef1f8",
    heroes: [
      { id: "arthas",  name: "阿尔萨斯",  title: "洛丹伦王子 · 圣骑士" },
      { id: "jaina",   name: "吉安娜",    title: "天才女法师 · 大法师" },
      { id: "uther",   name: "乌瑟尔",    title: "光明使者 · 骑士团领袖" },
      { id: "muradin", name: "穆拉丁",    title: "矮人探险家 · 山丘之王" },
    ],
  },
  {
    id: "nightelf",
    name: "暗夜精灵",
    subtitle: "永恒守护者",
    color: "#1a5c34",
    bgColor: "#edf5ef",
    heroes: [
      { id: "illidan",   name: "伊利丹",   title: "背叛者 · 恶魔猎手" },
      { id: "tyrande",   name: "泰兰德",   title: "月神大祭司 · 精灵领袖" },
      { id: "malfurion", name: "马法里昂", title: "德鲁伊先祖 · 自然守护" },
      { id: "maiev",     name: "玛薇",     title: "暗影猎手 · 伊利丹狱卒" },
    ],
  },
  {
    id: "orc",
    name: "兽人部落",
    subtitle: "自由战士",
    color: "#7a4018",
    bgColor: "#f5efea",
    heroes: [
      { id: "thrall",  name: "萨尔",     title: "大酋长 · 元素萨满" },
      { id: "grom",    name: "格罗玛什", title: "血刃首领 · 战争魔王" },
      { id: "cairne",  name: "卡因",     title: "牛头人酋长 · 大地之力" },
      { id: "rexxar",  name: "雷克萨",   title: "流浪英雄 · 自然之友" },
    ],
  },
  {
    id: "undead",
    name: "亡灵天灾",
    subtitle: "永恒诅咒",
    color: "#4a1a70",
    bgColor: "#f0ecf5",
    heroes: [
      { id: "arthas_dk", name: "阿尔萨斯",   title: "死亡骑士 · 巫妖王使者" },
      { id: "sylvanas",  name: "希尔瓦娜斯", title: "幽魂将领 · 被遗忘者女王" },
      { id: "kelthuzad", name: "科尔苏斯",   title: "巫妖 · 巫妖王第一使徒" },
      { id: "anubarak",  name: "安纳祖",     title: "虫族领主 · 永恒国度君主" },
    ],
  },
];

const STORY_TYPES = [
  { id: "origin",   label: "出身传奇" },
  { id: "campaign", label: "战役史诗" },
  { id: "tragedy",  label: "命运悲剧" },
  { id: "legacy",   label: "历史传承" },
];

export default function StoryPage() {
  const [selectedRaceId, setSelectedRaceId] = useState<string>("human");
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [storyType, setStoryType] = useState<string>("origin");
  const [story, setStory] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>("");

  const selectedRace = RACES.find((r) => r.id === selectedRaceId) ?? RACES[0]!;
  const selectedHero = selectedRace.heroes.find((h) => h.id === selectedHeroId) ?? null;

  function selectRace(raceId: string) {
    setSelectedRaceId(raceId);
    setSelectedHeroId(null);
    setStory("");
    setError("");
  }

  async function generateStory() {
    if (!selectedHero) return;
    setGenerating(true);
    setError("");
    setStory("");
    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroId: selectedHero.id,
          heroName: selectedHero.name,
          raceName: selectedRace.name,
          storyType,
        }),
      });
      const data = (await res.json()) as { story?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "生成失败");
      } else {
        setStory(data.story ?? "");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#d8d4ca] pb-5">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">魔兽争霸 III</p>
        <h1
          className="text-3xl font-bold text-[#1c1a16]"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          英雄传说
        </h1>
        <p className="text-[13px] text-[#5a5550] mt-1">四大种族英雄故事 · AI 中文讲解</p>
      </div>

      {/* Race selector */}
      <div>
        <p className="text-[10px] tracking-[0.18em] uppercase text-[#9a9590] mb-3">选择种族</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RACES.map((race) => {
            const active = race.id === selectedRaceId;
            return (
              <button
                key={race.id}
                onClick={() => selectRace(race.id)}
                className="border text-left px-4 py-3 transition-all"
                style={
                  active
                    ? { borderColor: race.color, backgroundColor: race.bgColor }
                    : { borderColor: "#d8d4ca", backgroundColor: "#fff" }
                }
              >
                <p
                  className="text-[14px] font-bold"
                  style={{ color: active ? race.color : "#1c1a16", fontFamily: "var(--font-playfair, Georgia, serif)" }}
                >
                  {race.name}
                </p>
                <p className="text-[10px] text-[#9a9590] mt-0.5">{race.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero selector */}
      <div>
        <p className="text-[10px] tracking-[0.18em] uppercase text-[#9a9590] mb-3">选择英雄</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {selectedRace.heroes.map((hero) => {
            const active = hero.id === selectedHeroId;
            return (
              <button
                key={hero.id}
                onClick={() => {
                  setSelectedHeroId(hero.id);
                  setStory("");
                  setError("");
                }}
                className="border text-left px-3 py-3 transition-all"
                style={
                  active
                    ? { borderColor: selectedRace.color, backgroundColor: selectedRace.bgColor }
                    : { borderColor: "#d8d4ca", backgroundColor: "#fff" }
                }
              >
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: active ? selectedRace.color : "#1c1a16" }}
                >
                  {hero.name}
                </p>
                <p className="text-[10px] text-[#9a9590] mt-0.5 leading-snug">{hero.title}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Story type + generate */}
      {selectedHero && (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] tracking-[0.18em] uppercase text-[#9a9590] mb-3">故事类型</p>
            <div className="flex gap-2 flex-wrap">
              {STORY_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setStoryType(t.id)}
                  className="px-4 py-1.5 text-[12px] border transition-colors"
                  style={
                    storyType === t.id
                      ? { borderColor: selectedRace.color, color: selectedRace.color, backgroundColor: selectedRace.bgColor }
                      : { borderColor: "#d8d4ca", color: "#5a5550" }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={generateStory}
              disabled={generating}
              className="px-6 py-2 text-[13px] font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: generating ? "#9a9590" : selectedRace.color }}
            >
              {generating ? "AI 讲述中..." : `讲述 ${selectedHero.name} 的故事`}
            </button>
            {story && !generating && (
              <button
                onClick={generateStory}
                className="px-4 py-2 text-[12px] border border-[#d8d4ca] text-[#5a5550] hover:border-[#003087] hover:text-[#003087] transition-colors"
              >
                重新生成
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-[13px] text-[#7a1c30] border-l-2 border-[#7a1c30] pl-3">{error}</p>
      )}

      {/* Loading skeleton */}
      {generating && (
        <div className="space-y-3 animate-pulse">
          {[80, 100, 90, 70, 95, 85].map((w, i) => (
            <div key={i} className="h-4 bg-[#e4e0d8] rounded" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {/* Story output */}
      {story && !generating && (
        <div
          className="border-l-4 pl-6 py-2"
          style={{ borderColor: selectedRace.color }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedRace.color }}
            />
            <span className="text-[11px] tracking-[0.15em] uppercase text-[#9a9590]">
              {selectedHero?.name} · {STORY_TYPES.find((t) => t.id === storyType)?.label}
            </span>
          </div>
          <div
            className="prose prose-sm max-w-none text-[#1c1a16] leading-relaxed"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{story}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Empty prompt */}
      {!selectedHero && !story && (
        <div className="text-center py-12 border border-dashed border-[#d8d4ca]">
          <p className="text-[14px] text-[#9a9590] italic">选择种族和英雄，开始聆听传说</p>
        </div>
      )}
    </div>
  );
}
