import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeHSWrongAnswer } from "@/lib/claude";
import { HS_WRONG_ANSWERS_DIR } from "@/lib/filestore";
import { getHSSubject } from "@/lib/hs-subjects";
import fs from "fs/promises";
import path from "path";

type Ctx = { params: Promise<{ subject: string }> };

const SUPPORTED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest, { params }: Ctx) {
  const { subject } = await params;
  const config = getHSSubject(subject);
  if (!config) {
    return NextResponse.json({ error: "invalid subject" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "no file uploaded" }, { status: 400 });
  }
  if (!SUPPORTED_MIMES.includes(file.type)) {
    return NextResponse.json(
      { error: "only jpg/png/webp/gif images are supported" },
      { status: 400 }
    );
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "file too large (max 10MB)" }, { status: 400 });
  }

  // Create DB record first to get ID
  const record = await prisma.hSWrongAnswer.create({
    data: { subject, mimeType: file.type },
  });

  // Save image file
  await fs.mkdir(HS_WRONG_ANSWERS_DIR, { recursive: true });
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const imagePath = path.join(HS_WRONG_ANSWERS_DIR, `${record.id}.${ext}`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(imagePath, buffer);

  // Run AI analysis
  try {
    const base64 = buffer.toString("base64");
    const analysis = await analyzeHSWrongAnswer(config.name, base64, file.type);

    const imageFileName = path.basename(imagePath);
    await prisma.hSWrongAnswer.update({
      where: { id: record.id },
      data: {
        imagePath: imageFileName,
        analysisJson: JSON.stringify(analysis),
      },
    });

    return NextResponse.json({ id: record.id, analysis });
  } catch (err) {
    console.error(`[hs-analyze] AI error for ${subject}:`, err);
    // Save imagePath even if analysis fails, so record is not orphaned
    await prisma.hSWrongAnswer.update({
      where: { id: record.id },
      data: { imagePath: path.basename(imagePath) },
    });
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}
