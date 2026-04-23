import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const record = await prisma.hSWrongAnswer.findUnique({
    where: { id },
    select: { imagePath: true, mimeType: true },
  });
  if (!record || !record.imagePath) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const buf = await fs.readFile(record.imagePath);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": record.mimeType || "image/jpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (err) {
    console.error(`[hs-image] read failed for ${id}:`, err);
    return NextResponse.json({ error: "image file missing" }, { status: 404 });
  }
}
