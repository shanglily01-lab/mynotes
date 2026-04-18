import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SUBJECTS, getWeekStart } from "@/lib/subjects";
import { generateExamQuestions } from "@/lib/claude";
import { writeText, readText } from "@/lib/filestore";

export async function POST() {
  const weekStart = getWeekStart();

  const existing = await prisma.exam.findUnique({
    where: { weekStart },
    include: { questions: true },
  });
  if (existing) {
    return NextResponse.json({ ok: true, exam: existing, cached: true });
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const items = await prisma.planItem.findMany({
    where: {
      plan: { date: { gte: weekStart, lt: weekEnd } },
      done: true,
    },
    include: { subject: true },
  });

  let weekSummary = "";
  if (items.length > 0) {
    const grouped = await Promise.all(
      SUBJECTS.map(async (s) => {
        const subItems = items.filter((item) => item.subjectId === s.id) as typeof items;
        if (subItems.length === 0) return null;
        const parts = await Promise.all(
          subItems.map(async (item) => {
            const content = await readText(item.contentPath);
            return `- ${item.title}：${content.slice(0, 300)}`;
          })
        );
        return `学科：${s.name}\n${parts.join("\n")}`;
      })
    );
    weekSummary = grouped.filter(Boolean).join("\n\n---\n\n");
  }

  if (!weekSummary) {
    weekSummary = SUBJECTS.map(
      (s) => `学科：${s.name}\n- 请考察${s.name}的基础概念、核心理论和应用场景`
    ).join("\n\n---\n\n");
  }

  const questions = await generateExamQuestions(weekSummary);

  // AI call takes ~30s; MySQL may drop idle connection — force reconnect
  await prisma.$disconnect();
  await prisma.$connect();

  if (questions.length === 0) {
    return NextResponse.json(
      { ok: false, error: "AI generation returned empty result" },
      { status: 500 }
    );
  }

  // 先创建考试记录（contentPath 留空）
  const exam = await prisma.exam.create({
    data: {
      weekStart,
      questions: {
        create: questions.map((q) => ({
          subject: q.subject,
          options: JSON.stringify(q.options),
          answer: q.answer,
          contentPath: "",
        })),
      },
    },
    include: { questions: true },
  });

  // 写内容文件并更新路径
  await Promise.all(
    exam.questions.map(async (dbQ, i) => {
      const q = questions[i];
      const content = JSON.stringify({
        question: q?.question ?? "",
        explain: q?.explain ?? "",
      });
      const contentPath = await writeText("exams", dbQ.id, content);
      await prisma.examQuestion.update({
        where: { id: dbQ.id },
        data: { contentPath },
      });
    })
  );

  return NextResponse.json({ ok: true, exam });
}
