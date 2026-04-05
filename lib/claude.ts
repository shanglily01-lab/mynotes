import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env["google-key"] ?? "");
const MODEL = "gemini-2.5-flash";

async function ask(prompt: string, maxTokens = 1024, jsonMode = false): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      maxOutputTokens: maxTokens,
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  });

  const maxRetries = 5;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastErr = err;
      const msg = String(err);
      const isNetworkErr =
        msg.includes("fetch failed") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("socket hang up");
      if (isNetworkErr && attempt < maxRetries) {
        const wait = attempt * 3000;
        console.warn(`[claude] attempt ${attempt} network error, retrying in ${wait / 1000}s...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// 生成文章中文摘要（约200字）
export async function summarizeArticle(
  title: string,
  content: string
): Promise<string> {
  return ask(
    `请用中文对以下文章进行200字以内的摘要，突出核心知识点，语言简洁清晰：\n\n标题：${title}\n\n内容：${content.slice(0, 2000)}`
  );
}

export interface PlanItemRaw {
  subjectId: string;
  title: string;
  content: string;
  articleId?: string;
}

// 根据文章列表生成每日学习计划
export async function generateDailyPlan(
  articlesPerSubject: Record<
    string,
    {
      id: string;
      title: string;
      summary: string;
      subjectName: string;
      foundations: string[];
    }[]
  >
): Promise<PlanItemRaw[]> {
  const prompt = Object.entries(articlesPerSubject)
    .map(([subjectId, articles]) => {
      const subjectName = articles[0]?.subjectName ?? subjectId;
      const foundations = articles[0]?.foundations ?? [];
      const articleList = articles
        .slice(0, 3)
        .map((a, i) => `${i + 1}. ${a.title}\n摘要：${a.summary}`)
        .join("\n\n");
      if (subjectId === "news") {
        return `学科：${subjectName}（id: ${subjectId}）\n\n【今日新闻】\n${articleList}`;
      }
      const foundationList = foundations.map((f) => `• ${f}`).join("\n");
      return `学科：${subjectName}（id: ${subjectId}）\n\n【系统性基础主题（每次选1个融入任务）】\n${foundationList}\n\n【最新文章】\n${articleList}`;
    })
    .join("\n\n---\n\n");

  const text = await ask(
    `根据以下各学科的资料，为每个学科生成今日学习任务。

要求：
- 学科类（非新闻）：每个任务结合一个基础主题和最新文章，300字以内，含核心概念和与文章的关联
- 每日新闻（news）：生成2-3条今日热点，每条100字以内，说明事件背景和意义
- 循环覆盖基础主题，确保系统性学习

只返回JSON数组，不要其他文字：
[
  {
    "subjectId": "学科id",
    "title": "任务标题",
    "content": "学习要点内容"
  }
]

资料：
${prompt}`,
    8192,
    true
  );

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]) as PlanItemRaw[];
  } catch (err) {
    console.error("generateDailyPlan parse error:", err);
    return [];
  }
}

export interface ExamQuestionRaw {
  subject: string;
  question: string;
  options: string[];
  answer: string;
  explain: string;
}

// 根据本周学习内容生成考试题
export async function generateExamQuestions(
  weekSummary: string
): Promise<ExamQuestionRaw[]> {
  const text = await ask(
    `根据以下本周学习内容，为每个学科各出4道单选题（ABCD四选一），包含解析。

只返回JSON数组，不要其他文字：
[
  {
    "subject": "学科名称",
    "question": "题目",
    "options": ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"],
    "answer": "A",
    "explain": "解析"
  }
]

本周学习内容：
${weekSummary}`,
    8192,
    true
  );

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]) as ExamQuestionRaw[];
  } catch (err) {
    console.error("generateExamQuestions parse error:", err);
    return [];
  }
}

// 根据错题生成评估报告
export async function generateEvaluation(
  wrongQuestions: { subject: string; question: string; explain: string }[]
): Promise<Record<string, string>> {
  if (wrongQuestions.length === 0) {
    return {};
  }

  const grouped = wrongQuestions.reduce<
    Record<string, { question: string; explain: string }[]>
  >((acc, q) => {
    if (!acc[q.subject]) acc[q.subject] = [];
    acc[q.subject].push({ question: q.question, explain: q.explain });
    return acc;
  }, {});

  const prompt = Object.entries(grouped)
    .map(
      ([subject, qs]) =>
        `学科：${subject}\n错题：\n${qs.map((q, i) => `${i + 1}. ${q.question}\n正确解析：${q.explain}`).join("\n")}`
    )
    .join("\n\n---\n\n");

  const text = await ask(
    `根据以下各学科错题，针对每个学科给出100字以内的学习建议和薄弱点分析。

只返回JSON对象，不要其他文字：
{
  "学科名称": "评语内容"
}

错题列表：
${prompt}`,
    1024,
    true
  );

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};
    return JSON.parse(jsonMatch[0]) as Record<string, string>;
  } catch (err) {
    console.error("generateEvaluation parse error:", err);
    return {};
  }
}

export interface DailyEnglishRaw {
  topic: string;
  articleEn: string;
  articleZh: string;
  vocabulary: { word: string; phonetic: string; meaning: string; example: string }[];
  phrases: { phrase: string; meaning: string; example: string; exampleZh: string }[];
}

// 生成每日英语内容
export async function generateDailyEnglish(): Promise<DailyEnglishRaw> {
  const topics = [
    "workplace communication", "travel and adventure", "technology and innovation",
    "health and wellness", "food and culture", "environment and sustainability",
    "relationships and social life", "science and discovery", "arts and creativity",
    "personal growth and mindset",
  ];
  const topic = topics[new Date().getDay() % topics.length]!;

  const text = await ask(
    `You are an English teacher creating daily learning content for Chinese intermediate learners.
Generate content about the topic: "${topic}".

Return JSON only, no other text:
{
  "topic": "${topic}",
  "articleEn": "A natural, engaging article of 180-220 words. Use vivid language, one short anecdote or example. Avoid overly formal tone.",
  "articleZh": "对应的中文翻译，自然流畅，不要逐字直译",
  "vocabulary": [
    { "word": "word", "phonetic": "/fəˈnetɪk/", "meaning": "中文释义", "example": "Natural example sentence from or related to the article." }
  ],
  "phrases": [
    { "phrase": "common phrase", "meaning": "中文意思", "example": "Example sentence using this phrase.", "exampleZh": "中文翻译" }
  ]
}

Requirements:
- vocabulary: 6 words, chosen from the article, with IPA phonetics
- phrases: 6 common expressions or collocations relevant to the topic
- All examples must be natural, conversational English`,
    4096,
    true
  );

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no JSON in response");
    return JSON.parse(jsonMatch[0]) as DailyEnglishRaw;
  } catch (err) {
    console.error("generateDailyEnglish parse error:", err, text.slice(0, 200));
    throw err;
  }
}

// 根据书名和作者生成书籍深度精读笔记 Markdown（分两次生成后合并）
export async function generateBookNote(
  title: string,
  author: string,
  subjectName: string
): Promise<string> {
  const clean = (s: string) =>
    s.replace(/^```(?:markdown)?\n?/i, "").replace(/\n?```$/i, "").trim();

  // 第一次：书籍背景 + 逐章节深度解析
  const part1 = await ask(
    `你是一位精通${subjectName}领域的资深学者，请为《${title}》（作者：${author || "未知"}）生成深度精读笔记的第一部分，格式为 Markdown，内容要详尽、有深度，不要泛泛而谈。

只输出以下内容，不要加代码块包裹：

# 《${title}》深度精读笔记

**作者：** ${author || "未知"}
**学科：** ${subjectName}

## 核心主张

用 2-3 段深入阐述本书的核心论点、写作目的和主要贡献，说明它解决了什么问题、提出了什么框架。

## 作者与成书背景

详细介绍作者的学术背景、本书写作的历史背景和动机（2-3 段）。

## 全书结构概览

按本书实际章节结构，列出各部分/章节的标题和核心内容（每章 1-2 句话）。

## 核心章节深度解析

针对本书最重要的 5-6 个章节或主题，每个用以下格式展开：

### [章节/主题名称]

**核心问题：** 本章试图回答什么问题？

用 4-6 段自然段深入讲解本章的核心内容，包括：主要论点、关键机制、具体案例或实验、与其他章节的关联。内容要足够详细，让读者无需看原书就能理解这一章的精髓。`,
    16000
  );

  // 第二次：概念体系 + 批判分析 + 实践应用
  const part2 = await ask(
    `你是一位精通${subjectName}领域的资深学者，请为《${title}》（作者：${author || "未知"}）生成深度精读笔记的第二部分，格式为 Markdown，内容要详尽实用。

只输出以下内容，不要加代码块包裹，不要重复书名标题：

## 核心概念体系

列出本书 8-12 个最重要的概念/理论，每个格式：

**[概念名称]**
详细解释这个概念的定义、来源、核心含义，以及它在本书论证体系中的作用（3-5 句话）。

## 经典论点与原文精华

列出 5-7 个本书最具代表性的论点、实验或案例，每条格式：

**[论点/实验名称]**
详细说明其内容、论证方式和意义（3-4 句话）。

## 方法论与实践应用

本书提供了哪些可以实际应用的方法、框架或工具？如何在现实中运用？（3-4 段）

## 对${subjectName}领域的历史地位

详细说明本书在学科史上的地位、对后续研究的影响、引发的争论（2-3 段）。

## 批判性分析

### 局限与争议
本书存在哪些局限性、被批评的观点或争议？（2-3 段）

### 延伸思考
提出 3-5 个深层问题，引导读者进一步思考。

## 学习路径建议

**阅读前推荐：** 列出 2-3 本适合先读的基础书目。
**配合阅读：** 列出 2-3 本可以同期阅读的相关书目。
**深入后续：** 列出 2-3 本读完本书后的进阶书目。`,
    16000
  );

  return `${clean(part1)}\n\n---\n\n${clean(part2)}`;
}

// 为学科生成经典现象与案例 Markdown 文档
export async function generateSubjectCases(
  subjectName: string,
  subjectId: string
): Promise<string> {
  const clean = (s: string) =>
    s.replace(/^```(?:markdown)?\n?/i, "").replace(/\n?```$/i, "").trim();

  const domainNote: Record<string, string> = {
    psychology:  "心理学实验与效应：如巴甫洛夫条件反射、斯坦福监狱实验、旁观者效应、认知失调等",
    biology:     "生物学经典发现与实验：如孟德尔豌豆实验、DNA双螺旋、进化论证据、CRISPR基因编辑等",
    physics:     "物理学经典实验与现象：如双缝干涉、卢瑟福散射、迈克尔逊-莫雷实验、光电效应、薛定谔的猫等",
    sociology:   "社会学经典研究与社会现象：如涂尔干自杀研究、霍桑效应、破窗理论、斯坦福监狱实验、马太效应等",
    ai:          "AI 领域里程碑事件与经典案例：如图灵测试、AlphaGo、GPT系列、ImageNet时刻、提示注入攻击等",
    philosophy:  "哲学经典思想实验与论证：如芝诺悖论、柏拉图洞穴比喻、笛卡尔恶魔假说、电车难题、中文房间论证、缸中大脑等",
    theology:    "神学经典论证与历史事件：如安瑟伦本体论证明、阿奎那五路论证、恶的问题、宗教改革、宗教经验与神秘主义等",
  };

  const hint = domainNote[subjectId] ?? `${subjectName}领域的经典现象、实验和案例`;

  const prompt = `你是一位精通${subjectName}的学者，请整理一份《${subjectName}经典现象与案例》Markdown 文档。

覆盖范围：${hint}

要求：
- 选取 12-15 个最具代表性、最常被引用的经典现象/实验/案例
- 每个案例包含：发现背景、核心内容（含关键数据或结论）、深远意义、与其他概念的联系
- 语言精炼，每个案例 200-300 字，有深度不泛泛
- 按主题或时间线分成 3-4 个小节，使结构清晰
- 只输出 Markdown 正文，不要加代码块包裹

格式示例（严格遵守，用于每个案例）：

### 案例名称

**发现者 / 年代：** xxx

**背景：** 一两句说明研究背景或问题背景。

**核心内容：** 2-4 段详细描述实验/现象的过程、关键数据、结论。

**意义与影响：** 1-2 段说明对该学科的影响，是否引发争议或后续研究。

**延伸联系：** 与哪些概念/理论/其他案例有关联。

---`;

  const text = await ask(prompt, 12288);
  return clean(text);
}

// 为学科生成完整的经典著作与基础教程 Markdown 文档
export async function generateSubjectMaterial(
  subjectName: string,
  foundations: string[]
): Promise<string> {
  const foundationList = foundations.map((f, i) => `${i + 1}. ${f}`).join("\n");

  const text = await ask(
    `你是一位资深教育专家，精通${subjectName}领域。请生成一份《${subjectName}学习指南》，格式为 Markdown，排版简洁清晰。

基础主题参考：
${foundationList}

---

严格按以下模板输出，不要增减章节，不要嵌套超过两级列表：

# ${subjectName}学习指南

## 学科概述

用 2-3 段自然段介绍这门学科是什么、研究什么、有哪些应用领域。

## 为什么要学

用 1 段自然段说明学习价值和实际应用场景。

## 经典著作

列出 5-6 本最重要的著作，每本一行，格式如下：

- **《书名》** — 作者（年份）：一句话说明为何经典及适合阶段。

## 学习路径

### 阶段一：入门（1-2 个月）

**目标：** 一句话描述本阶段能掌握什么。

依次介绍 3 个主题，每个主题格式：

#### 主题名

用 2-3 段自然段讲解核心概念（无需列要点列表）。

**里程碑：** 完成本阶段后能做什么。

---

### 阶段二：进阶（2-3 个月）

**目标：** 一句话。

（同上，3 个主题，每个主题 2-3 段自然段）

**里程碑：** 完成后能做什么。

---

### 阶段三：深入（3-6 个月）

**目标：** 一句话。

（同上，3 个主题，每个主题 2-3 段自然段）

**里程碑：** 完成后能做什么。

---

## 推荐资源

- **公开课：** 列出 2-3 个（MIT OCW / Coursera / B站等）
- **工具与平台：** 列出 2-3 个
- **社区：** 列出 1-2 个

只输出 Markdown 正文，不要加任何额外说明或代码块包裹。`,
    12288
  );

  // 清理可能的 markdown 代码块包裹
  return text.replace(/^```(?:markdown)?\n?/i, "").replace(/\n?```$/i, "").trim();
}
