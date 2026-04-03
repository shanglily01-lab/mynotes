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
  const result = await model.generateContent(prompt);
  return result.response.text();
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

export interface RoadmapStage {
  stage: string;         // 阶段名称，如"入门"、"进阶"、"高级"
  duration: string;      // 预计时长，如"1-2个月"
  goal: string;          // 阶段目标
  topics: {
    title: string;       // 主题名
    content: string;     // 详细讲解（300-500字）
    keyPoints: string[]; // 核心要点（3-5条）
  }[];
  milestone: string;     // 里程碑：完成本阶段后能做什么
}

export interface SubjectRoadmap {
  overview: string;      // 学科概述（200字）
  whyLearn: string;      // 为什么学（100字）
  stages: RoadmapStage[];
}

export async function generateSubjectMaterial(
  subjectName: string,
  foundations: string[],
  resources: { title: string; url: string; description: string; content: string }[] = []
): Promise<SubjectRoadmap> {
  const foundationList = foundations.map((f, i) => `${i + 1}. ${f}`).join("\n");

  const resourceSection =
    resources.length > 0
      ? `\n\n以下是来自名校开放课件和权威教材的真实内容摘录，请基于这些内容生成学习材料：\n\n` +
        resources
          .map(
            (r) =>
              `【${r.title}】\n来源：${r.url}\n说明：${r.description}\n内容摘录：\n${r.content.slice(0, 2000)}`
          )
          .join("\n\n---\n\n")
      : "";

  const text = await ask(
    `你是一位资深教育专家。请为"${subjectName}"学科生成一份完整的系统性学习资料和成长路径。${resourceSection}

学科基础主题大纲：
${foundationList}

要求：
- 生成3个学习阶段（入门→进阶→高级），每个阶段3-4个核心主题
- 每个主题详细讲解300-500字，包含概念解释、原理推导、具体示例
- 内容要忠实于名校教材的知识体系，深度适合自学
- 推荐名校资源中的具体章节或视频

只返回JSON，不要其他文字：
{
  "overview": "学科概述200字以内",
  "whyLearn": "为什么要学这门学科100字以内",
  "stages": [
    {
      "stage": "入门阶段",
      "duration": "预计学习时长",
      "goal": "本阶段学习目标",
      "topics": [
        {
          "title": "主题名称",
          "content": "详细讲解300-500字，包括概念、原理、实例",
          "keyPoints": ["核心要点1", "核心要点2", "核心要点3"]
        }
      ],
      "milestone": "完成本阶段后你能做什么/达到什么水平"
    }
  ]
}`,
    16384,
    true
  );

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no JSON");
    return JSON.parse(jsonMatch[0]) as SubjectRoadmap;
  } catch (err) {
    console.error("generateSubjectMaterial parse error:", err);
    throw err;
  }
}
