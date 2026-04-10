import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SUBJECTS, getTodayStart } from "@/lib/subjects";
import { generateDailyPlan } from "@/lib/claude";
import { writeText, readText } from "@/lib/filestore";

export async function GET() {
  return _getPlan();
}

export async function POST() {
  const today = getTodayStart();

  const existing = await prisma.dailyPlan.findUnique({
    where: { date: today },
    include: { items: { include: { subject: true } } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, plan: existing, cached: true });
  }

  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const articlesPerSubject: Record<
    string,
    { id: string; title: string; summary: string; subjectName: string; foundations: string[] }[]
  > = {};

  for (const subject of SUBJECTS) {
    // 新闻只取当天；其他学科取最近三天
    const since = subject.id === "news" ? today : threeDaysAgo;

    const articles = await prisma.article.findMany({
      where: { subjectId: subject.id, publishedAt: { gte: since } },
      orderBy: { publishedAt: "desc" },
      take: subject.id === "news" ? 5 : 3,
    });

    if (articles.length > 0) {
      const withSummary = await Promise.all(
        articles.map(async (a) => ({
          id: a.id,
          title: a.title,
          summary: await readText(a.summaryPath),
          subjectName: subject.name,
          foundations: subject.foundations,
        }))
      );
      articlesPerSubject[subject.id] = withSummary;
    } else if (subject.id !== "news") {
      // 新闻没有当天内容就跳过，其他学科用基础兜底
      articlesPerSubject[subject.id] = [
        {
          id: "",
          title: `${subject.name}基础知识回顾`,
          summary: `请复习${subject.name}的基础概念和核心理论`,
          subjectName: subject.name,
          foundations: subject.foundations,
        },
      ];
    }
  }

  const planItems = await generateDailyPlan(articlesPerSubject);

  // AI call takes ~30s; MySQL may drop idle connection — force reconnect
  await prisma.$disconnect();
  await prisma.$connect();

  if (planItems.length === 0) {
    return NextResponse.json(
      { ok: false, error: "AI generation returned empty result" },
      { status: 500 }
    );
  }

  // A previous failed attempt may have left an orphaned plan with no items — delete it
  await prisma.dailyPlan.deleteMany({
    where: { date: today, items: { none: {} } },
  });

  // Ensure all referenced subjects exist in Subject table
  const usedSubjectIds = [...new Set(planItems.map((item) => item.subjectId))];
  for (const subjectId of usedSubjectIds) {
    const subject = SUBJECTS.find((s) => s.id === subjectId);
    if (subject) {
      await prisma.subject.upsert({
        where: { id: subjectId },
        create: { id: subjectId, name: subject.name, icon: subject.icon },
        update: { name: subject.name, icon: subject.icon },
      });
    }
  }

  // 创建计划和条目（先建记录，再写文件）
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

  // 写内容文件并更新路径
  await Promise.all(
    plan.items.map(async (dbItem, i) => {
      const content = planItems[i]?.content ?? "";
      const contentPath = await writeText("plans", dbItem.id, content);
      await prisma.planItem.update({
        where: { id: dbItem.id },
        data: { contentPath },
      });
    })
  );

  return NextResponse.json({ ok: true, plan });
}

async function _getPlan() {
  const today = getTodayStart();
  const plan = await prisma.dailyPlan.findUnique({
    where: { date: today },
    include: { items: { include: { subject: true } } },
  });
  return NextResponse.json({ plan });
}
