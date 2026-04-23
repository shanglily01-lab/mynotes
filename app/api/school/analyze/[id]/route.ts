import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { SCHOOL_WRONG_ANSWERS_DIR } from "@/lib/filestore";
import type { HSAnalysisResult } from "@/lib/claude";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const record = await prisma.schoolWrongAnswer.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "not found" }, { status: 404 });

  let analysis: HSAnalysisResult | null = null;
  try {
    if (record.analysisJson) analysis = JSON.parse(record.analysisJson) as HSAnalysisResult;
  } catch {
    // ignore
  }

  return NextResponse.json({ record, analysis });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const record = await prisma.schoolWrongAnswer.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (record.imagePath) {
    const basename = path.basename(record.imagePath.replace(/\\/g, "/"));
    const candidates = [record.imagePath, path.join(SCHOOL_WRONG_ANSWERS_DIR, basename)];
    for (const p of candidates) {
      const ok = await fs.unlink(p).then(() => true).catch(() => false);
      if (ok) break;
    }
  }
  await prisma.schoolWrongAnswer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
