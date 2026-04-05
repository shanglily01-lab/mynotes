import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateDailyEnglish } from "@/lib/claude";
import { getTodayStart } from "@/lib/subjects";

// GET /api/english — today's content (generate if missing)
export async function GET() {
  const today = getTodayStart();

  let record = await prisma.dailyEnglish.findUnique({ where: { date: today } });

  if (!record) {
    const data = await generateDailyEnglish();
    record = await prisma.dailyEnglish.create({
      data: {
        date: today,
        topic: data.topic,
        articleEn: data.articleEn,
        articleZh: data.articleZh,
        vocabulary: JSON.stringify(data.vocabulary),
        phrases: JSON.stringify(data.phrases),
      },
    });
  }

  return NextResponse.json({
    topic: record.topic,
    articleEn: record.articleEn,
    articleZh: record.articleZh,
    vocabulary: JSON.parse(record.vocabulary) as unknown[],
    phrases: JSON.parse(record.phrases) as unknown[],
    date: record.date,
  });
}

// POST /api/english — force regenerate today's content
export async function POST() {
  const today = getTodayStart();
  const data = await generateDailyEnglish();

  const record = await prisma.dailyEnglish.upsert({
    where: { date: today },
    create: {
      date: today,
      topic: data.topic,
      articleEn: data.articleEn,
      articleZh: data.articleZh,
      vocabulary: JSON.stringify(data.vocabulary),
      phrases: JSON.stringify(data.phrases),
    },
    update: {
      topic: data.topic,
      articleEn: data.articleEn,
      articleZh: data.articleZh,
      vocabulary: JSON.stringify(data.vocabulary),
      phrases: JSON.stringify(data.phrases),
    },
  });

  return NextResponse.json({
    ok: true,
    topic: record.topic,
    articleEn: record.articleEn,
    articleZh: record.articleZh,
    vocabulary: JSON.parse(record.vocabulary) as unknown[],
    phrases: JSON.parse(record.phrases) as unknown[],
  });
}
