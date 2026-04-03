import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();

const today = new Date();
today.setHours(0, 0, 0, 0);
const threeDaysAgo = new Date(today);
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

const SUBJECTS = ["psychology", "biology", "physics", "sociology", "ai"];
const articlesPerSubject = {};

for (const subjectId of SUBJECTS) {
  const articles = await prisma.article.findMany({
    where: { subjectId, publishedAt: { gte: threeDaysAgo } },
    orderBy: { publishedAt: "desc" },
    take: 3,
    include: { subject: true },
  });

  if (articles.length > 0) {
    const withSummary = await Promise.all(
      articles.map(async (a) => {
        let summary = "";
        try { summary = await fs.readFile(a.summaryPath, "utf-8"); } catch {}
        return { id: a.id, title: a.title, summary, subjectName: a.subject.name };
      })
    );
    articlesPerSubject[subjectId] = withSummary;
  } else {
    articlesPerSubject[subjectId] = [
      { id: "", title: "基础知识回顾", summary: `请复习${subjectId}的基础概念和核心理论`, subjectName: subjectId },
    ];
  }
}

const genAI = new GoogleGenerativeAI(process.env["google-key"] ?? "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { maxOutputTokens: 8192 } });

const promptBody = Object.entries(articlesPerSubject)
  .map(([subjectId, articles]) => {
    const subjectName = articles[0]?.subjectName ?? subjectId;
    const articleList = articles.slice(0, 3)
      .map((a, i) => `${i + 1}. ${a.title}\n摘要：${a.summary}`)
      .join("\n\n");
    return `学科：${subjectName}（id: ${subjectId}）\n${articleList}`;
  })
  .join("\n\n---\n\n");

const fullPrompt = `根据以下各学科最新文章，为每个学科生成1-2个今日学习任务。每个任务包含标题和学习要点（300字以内）。

只返回JSON数组，不要其他文字：
[
  {
    "subjectId": "学科id",
    "title": "任务标题",
    "content": "学习要点内容"
  }
]

文章资料：
${promptBody}`;

const result = await model.generateContent(fullPrompt);
const text = result.response.text();
console.log("Response length:", text.length);
console.log("Last 200 chars:", JSON.stringify(text.slice(-200)));

const jsonMatch = text.match(/\[[\s\S]*\]/);
if (!jsonMatch) {
  console.log("ERROR: No JSON array found");
  console.log("Full response:", text);
} else {
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    console.log("OK - parsed items:", parsed.length);
  } catch (e) {
    console.log("JSON parse error:", e.message);
    console.log("Matched:", jsonMatch[0].slice(0, 200));
  }
}

await prisma.$disconnect();
