import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { SCHOOL_WRONG_ANSWERS_DIR } from "@/lib/filestore";

type Ctx = { params: Promise<{ id: string }> };

async function tryRead(p: string) {
  try { return await fs.readFile(p); } catch { return null; }
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const record = await prisma.schoolWrongAnswer.findUnique({
    where: { id },
    select: { imagePath: true, mimeType: true },
  });
  if (!record || !record.imagePath) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Strategy: try original imagePath first (back-compat), then re-anchor by basename to current DIR
  const basename = path.basename(record.imagePath.replace(/\\/g, "/"));
  const candidates = [
    record.imagePath,
    path.join(SCHOOL_WRONG_ANSWERS_DIR, basename),
  ];

  for (const p of candidates) {
    const buf = await tryRead(p);
    if (buf) {
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": record.mimeType || "image/jpeg",
          "Cache-Control": "private, max-age=86400",
        },
      });
    }
  }

  console.error(`[school-image] not found in any candidate for ${id}: ${candidates.join(" | ")}`);
  return NextResponse.json({ error: "image file missing" }, { status: 404 });
}
