import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTodayStart } from "@/lib/subjects";
import { readText } from "@/lib/filestore";

export async function GET() {
  const today = getTodayStart();

  const plan = await prisma.dailyPlan.findUnique({
    where: { date: today },
    include: {
      items: {
        include: { subject: true },
        orderBy: { subjectId: "asc" },
      },
    },
  });

  if (!plan) return NextResponse.json({ plan: null });

  // 读取每个条目的内容文件
  const itemsWithContent = await Promise.all(
    plan.items.map(async (item) => ({
      ...item,
      content: await readText(item.contentPath),
    }))
  );

  return NextResponse.json({ plan: { ...plan, items: itemsWithContent } });
}
