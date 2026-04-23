import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import { HS_WRONG_ANSWERS_DIR } from "@/lib/filestore";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const record = await prisma.hSWrongAnswer.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "not found" }, { status: 404 });

  let analysis = null;
  try {
    if (record.analysisJson) analysis = JSON.parse(record.analysisJson);
  } catch {
    // ignore
  }

  return NextResponse.json({ record: { ...record, analysis } });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const record = await prisma.hSWrongAnswer.findUnique({
    where: { id },
    select: { imagePath: true },
  });
  if (!record) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (record.imagePath) {
    const basename = path.basename(record.imagePath.replace(/\\/g, "/"));
    const candidates = [record.imagePath, path.join(HS_WRONG_ANSWERS_DIR, basename)];
    for (const p of candidates) {
      const ok = await fs.unlink(p).then(() => true).catch(() => false);
      if (ok) break;
    }
  }

  await prisma.hSWrongAnswer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
