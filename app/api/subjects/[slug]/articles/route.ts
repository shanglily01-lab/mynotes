import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readText } from "@/lib/filestore";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const articles = await prisma.article.findMany({
    where: { subjectId: slug },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  const articlesWithSummary = await Promise.all(
    articles.map(async (a) => ({
      ...a,
      summary: await readText(a.summaryPath),
    }))
  );

  return NextResponse.json({ articles: articlesWithSummary });
}
