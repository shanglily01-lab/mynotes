import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SUBJECTS, getTodayStart, getWeekStart } from "@/lib/subjects";

export async function GET() {
  const today = getTodayStart();
  const weekStart = getWeekStart();

  const todayPlan = await prisma.dailyPlan.findUnique({
    where: { date: today },
    include: { items: true },
  });

  const weekProgress = await prisma.progress.findMany({
    where: { weekStart },
  });

  const subjects = SUBJECTS.map((s) => {
    const todayItems = todayPlan?.items.filter((i) => i.subjectId === s.id) ?? [];
    const doneCount = todayItems.filter((i) => i.done).length;
    const weekScore = weekProgress.find((p) => p.subjectId === s.id);

    return {
      ...s,
      todayTotal: todayItems.length,
      todayDone: doneCount,
      weekScore: weekScore?.score ?? null,
      weekTotal: weekScore?.totalQ ?? null,
    };
  });

  return NextResponse.json({ subjects });
}
