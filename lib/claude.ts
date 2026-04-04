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

// 为学科生成完整的经典著作与基础教程 Markdown 文档
export async function generateSubjectMaterial(
  subjectName: string,
  foundations: string[]
): Promise<string> {
  const foundationList = foundations.map((f, i) => `${i + 1}. ${f}`).join("\n");

  const text = await ask(
    `你是一位资深教育专家，精通${subjectName}领域。请生成一份完整的《${subjectName}学习指南》Markdown 文档。

基础主题大纲参考：
${foundationList}

文档结构要求（严格按此输出 Markdown）：

# ${subjectName}学习指南

## 一、学科概述
（200字，说明这门学科是什么、研究什么、与哪些领域相关）

## 二、为什么要学
（100字，学习价值和应用场景）

## 三、经典著作与权威教材
列出5-8本最重要的经典著作，每本包含：
- **书名**（作者，出版年）
- 一句话说明为何是经典、适合哪个阶段阅读

## 四、学习路径

### 第一阶段：入门（建议1-2个月）
**阶段目标：**（一句话）

逐一讲解3个入门主题，每个主题包含：
#### 主题名称
- 核心概念讲解（200字）
- 关键要点列表
- 推荐阅读章节

**阶段里程碑：** 完成后能做什么

### 第二阶段：进阶（建议2-3个月）
（同上，3个进阶主题）

### 第三阶段：深入（建议3-6个月）
（同上，3个深入主题）

## 五、学习资源推荐
- 免费公开课（MIT OCW、Coursera、B站等）
- 在线工具和实践平台
- 社区和论坛

只输出 Markdown 正文，不要加任何额外说明。`,
    12288
  );

  // 清理可能的 markdown 代码块包裹
  return text.replace(/^```(?:markdown)?\n?/i, "").replace(/\n?```$/i, "").trim();
}
