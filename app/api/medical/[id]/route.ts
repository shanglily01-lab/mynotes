import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs/promises";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/medical/[id]
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const record = await prisma.medicalRecord.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ record });
}

// PATCH /api/medical/[id] — update notes
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { notes } = (await req.json()) as { notes: string };
  const record = await prisma.medicalRecord.update({
    where: { id },
    data: { notes },
  });
  return NextResponse.json({ record });
}

// DELETE /api/medical/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const record = await prisma.medicalRecord.findUnique({
    where: { id },
    select: { filePath: true },
  });
  if (record?.filePath) {
    await fs.unlink(record.filePath).catch(() => undefined);
  }
  await prisma.medicalRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
