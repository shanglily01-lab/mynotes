import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface EnglishRow { month: string; days: bigint; topics: string }
interface PlanRow    { month: string; done: bigint; total: bigint }
interface ExamRow    { month: string; subjectId: string; score: number | null; totalQ: number | null }
interface ArticleRow { month: string; count: bigint }

export async function GET() {
  const [englishRows, planRows, examRows, articleRows] = await Promise.all([
    prisma.$queryRaw<EnglishRow[]>`
      SELECT DATE_FORMAT(date, '%Y-%m') AS month,
             COUNT(*) AS days,
             GROUP_CONCAT(topic ORDER BY date SEPARATOR '|') AS topics
      FROM DailyEnglish
      GROUP BY month
      ORDER BY month DESC
    `,
    prisma.$queryRaw<PlanRow[]>`
      SELECT DATE_FORMAT(dp.date, '%Y-%m') AS month,
             SUM(CASE WHEN pi.done = 1 THEN 1 ELSE 0 END) AS done,
             COUNT(pi.id) AS total
      FROM DailyPlan dp
      LEFT JOIN PlanItem pi ON pi.planId = dp.id
      GROUP BY month
      ORDER BY month DESC
    `,
    prisma.$queryRaw<ExamRow[]>`
      SELECT DATE_FORMAT(weekStart, '%Y-%m') AS month,
             subjectId, score, totalQ
      FROM Progress
      WHERE score IS NOT NULL
      ORDER BY month DESC
    `,
    prisma.$queryRaw<ArticleRow[]>`
      SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month,
             COUNT(*) AS count
      FROM Article
      GROUP BY month
      ORDER BY month DESC
    `,
  ]);

  // Collect all months
  const allMonths = Array.from(new Set([
    ...englishRows.map((r) => r.month),
    ...planRows.map((r) => r.month),
    ...examRows.map((r) => r.month),
    ...articleRows.map((r) => r.month),
  ])).sort((a, b) => b.localeCompare(a));

  const months = allMonths.map((month) => {
    const [y, m] = month.split("-");
    const label = `${y}年${parseInt(m)}月`;

    const eng = englishRows.find((r) => r.month === month);
    const plan = planRows.find((r) => r.month === month);
    const art = articleRows.find((r) => r.month === month);

    const monthExams = examRows.filter((r) => r.month === month);
    const examSubjects = monthExams
      .filter((r) => r.score !== null && r.totalQ)
      .map((r) => ({
        subjectId: r.subjectId,
        pct: Math.round((r.score! / r.totalQ!) * 100),
      }));
    const avgPct = examSubjects.length > 0
      ? Math.round(examSubjects.reduce((s, r) => s + r.pct, 0) / examSubjects.length)
      : null;

    return {
      month,
      label,
      english: {
        days: eng ? Number(eng.days) : 0,
        topics: eng ? eng.topics.split("|").filter(Boolean) : [],
      },
      plans: {
        done: plan ? Number(plan.done) : 0,
        total: plan ? Number(plan.total) : 0,
      },
      exams: { avgPct, subjects: examSubjects },
      articles: art ? Number(art.count) : 0,
    };
  });

  return NextResponse.json({ months });
}
