import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { HSAnalysisResult } from "@/lib/claude";

type Ctx = { params: Promise<{ level: string; subject: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { level, subject } = await params;

  const records = await prisma.schoolWrongAnswer.findMany({
    where: { level, subject },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const items = records.map((r) => {
    let analysis: HSAnalysisResult | null = null;
    try {
      if (r.analysisJson) analysis = JSON.parse(r.analysisJson) as HSAnalysisResult;
    } catch {
      // ignore
    }
    return {
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      chapter: analysis?.chapter ?? "",
      questionSummary: analysis?.questionSummary ?? "",
      weakPoints: analysis?.knowledgePoints?.map((kp) => kp.name) ?? [],
      analysis,
      imageUrl: `/api/school/analyze/${r.id}/image`,
    };
  });

  return NextResponse.json({ items });
}
