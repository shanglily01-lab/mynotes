import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

const MEDICAL_DIR = path.join(process.cwd(), "data", "medical");

async function ensureDir() {
  await fs.mkdir(MEDICAL_DIR, { recursive: true });
}

// GET /api/medical — list all records
export async function GET() {
  const records = await prisma.medicalRecord.findMany({
    orderBy: { recordDate: "desc" },
    select: {
      id: true,
      type: true,
      title: true,
      recordDate: true,
      fileExt: true,
      mimeType: true,
      notes: true,
      aiSummary: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ records });
}

// POST /api/medical — upload a new record
export async function POST(req: NextRequest) {
  const form = await req.formData();

  const type       = (form.get("type")  as string) ?? "other";
  const title      = (form.get("title") as string) ?? "";
  const recordDate = (form.get("date")  as string) ?? new Date().toISOString().slice(0, 10);
  const notes      = (form.get("notes") as string) ?? "";
  const file       = form.get("file") as File | null;

  if (!title.trim()) {
    return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
  }

  // Create DB record first to get id
  const record = await prisma.medicalRecord.create({
    data: {
      type,
      title: title.trim(),
      recordDate: new Date(recordDate),
      notes: notes.trim() || null,
    },
  });

  // Save file if provided
  if (file && file.size > 0) {
    await ensureDir();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const filePath = path.join(MEDICAL_DIR, `${record.id}.${ext}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    await prisma.medicalRecord.update({
      where: { id: record.id },
      data: { filePath, fileExt: ext, mimeType: file.type },
    });
  }

  return NextResponse.json({ record });
}
