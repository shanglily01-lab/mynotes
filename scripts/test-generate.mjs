import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();

try {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. 清理孤立计划
  const deleted = await prisma.dailyPlan.deleteMany({
    where: { date: today, items: { none: {} } },
  });
  console.log("deleted orphan plans:", deleted.count);

  // 2. 检查是否已有计划
  const existing = await prisma.dailyPlan.findUnique({
    where: { date: today },
    include: { items: true },
  });
  if (existing) {
    console.log("plan already exists, items:", existing.items.length);
    process.exit(0);
  }

  // 3. 读文章
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const subjects = await prisma.subject.findMany();
  const articlesPerSubject = {};

  for (const subject of subjects) {
    const articles = await prisma.article.findMany({
      where: { subjectId: subject.id, publishedAt: { gte: threeDaysAgo } },
      orderBy: { publishedAt: "desc" },
      take: 3,
    });
    if (articles.length > 0) {
      const withSummary = await Promise.all(articles.map(async (a) => {
        let summary = "";
        try { summary = await fs.readFile(a.summaryPath, "utf-8"); } catch (e) {
          console.log("  WARN read failed:", a.summaryPath, e.message);
        }
        return { id: a.id, title: a.title, summary, subjectName: subject.name };
      }));
      articlesPerSubject[subject.id] = withSummary;
    } else {
      articlesPerSubject[subject.id] = [{ id: "", title: `${subject.name}基础知识回顾`, summary: `请复习${subject.name}的基础概念`, subjectName: subject.name }];
    }
    console.log(`${subject.id}: ${articles.length} articles`);
  }

  // 4. 调用AI
  const genAI = new GoogleGenerativeAI(process.env["google-key"] ?? "");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { maxOutputTokens: 8192 } });

  const promptBody = Object.entries(articlesPerSubject)
    .map(([id, arts]) => `学科：${arts[0]?.subjectName}（id: ${id}）\n${arts.slice(0,3).map((a,i) => `${i+1}. ${a.title}\n摘要：${a.summary}`).join("\n\n")}`)
    .join("\n\n---\n\n");

  const result = await model.generateContent(`根据以下各学科最新文章，为每个学科生成1-2个今日学习任务。每个任务包含标题和学习要点（300字以内）。\n\n只返回JSON数组，不要其他文字：\n[\n  {\n    "subjectId": "学科id",\n    "title": "任务标题",\n    "content": "学习要点内容"\n  }\n]\n\n文章资料：\n${promptBody}`);
  const text = result.response.text();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) { console.log("ERROR: no JSON in response\n", text.slice(0,500)); process.exit(1); }
  const planItems = JSON.parse(jsonMatch[0]);
  console.log("planItems:", planItems.length);

  // 5. 重连
  await prisma.$disconnect();
  await prisma.$connect();
  console.log("reconnected");

  // 6. 创建计划
  const plan = await prisma.dailyPlan.create({
    data: {
      date: today,
      items: {
        create: planItems.map((item) => ({
          subjectId: item.subjectId,
          title: item.title,
          contentPath: "",
          articleId: item.articleId ?? null,
        })),
      },
    },
    include: { items: { include: { subject: true } } },
  });
  console.log("plan created, items:", plan.items.length);

  // 7. 写文件
  const DATA_DIR = path.join(process.cwd(), "data", "plans");
  await fs.mkdir(DATA_DIR, { recursive: true });
  await Promise.all(plan.items.map(async (dbItem, i) => {
    const content = planItems[i]?.content ?? "";
    const filePath = path.join(DATA_DIR, dbItem.id + ".txt");
    await fs.writeFile(filePath, content, "utf-8");
    await prisma.planItem.update({ where: { id: dbItem.id }, data: { contentPath: filePath } });
    console.log(`  item ${dbItem.id} written`);
  }));

  console.log("DONE");
} catch (e) {
  console.error("FATAL:", e);
} finally {
  await prisma.$disconnect();
}
