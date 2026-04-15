import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs/promises";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/medical/[id]/file — serve the uploaded file
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const record = await prisma.medicalRecord.findUnique({
    where: { id },
    select: { filePath: true, mimeType: true, fileExt: true, title: true },
  });

  if (!record?.filePath) {
    return NextResponse.json({ error: "no file" }, { status: 404 });
  }

  const buffer = await fs.readFile(record.filePath).catch(() => null);
  if (!buffer) return NextResponse.json({ error: "file not found" }, { status: 404 });

  const mimeType = record.mimeType ?? "application/octet-stream";
  const filename = encodeURIComponent(`${record.title}.${record.fileExt ?? "bin"}`);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
