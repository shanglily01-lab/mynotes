import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHSSubject } from "@/lib/hs-subjects";
import type { HSAnalysisResult } from "@/lib/claude";

type Ctx = { params: Promise<{ subject: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { subject } = await params;
  if (!getHSSubject(subject)) {
    return NextResponse.json({ error: "invalid subject" }, { status: 400 });
  }

  const records = await prisma.hSWrongAnswer.findMany({
    where: { subject },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, analysisJson: true, createdAt: true },
  });

  const items = records.map((r) => {
    let analysis: HSAnalysisResult | null = null;
    try {
      if (r.analysisJson) analysis = JSON.parse(r.analysisJson) as HSAnalysisResult;
    } catch {
      // ignore parse errors
    }
    return {
      id: r.id,
      createdAt: r.createdAt,
      chapter: analysis?.chapter ?? "",
      questionSummary: analysis?.questionSummary ?? "",
      weakPoints: analysis?.knowledgePoints?.map((k) => k.name) ?? [],
      analysis,
    };
  });

  return NextResponse.json({ items });
}
