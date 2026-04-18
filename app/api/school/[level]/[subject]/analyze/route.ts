import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/db";
import { analyzeSchoolWrongAnswer } from "@/lib/claude-school";
import { SCHOOL_WRONG_ANSWERS_DIR } from "@/lib/filestore";
import { getPrimarySubject } from "@/lib/primary-subjects";
import { getMiddleSubject } from "@/lib/middle-subjects";

type Ctx = { params: Promise<{ level: string; subject: string }> };

function getSubjectConfig(level: string, subject: string) {
  if (level === "primary") return getPrimarySubject(subject);
  if (level === "middle") return getMiddleSubject(subject);
  return undefined;
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { level, subject } = await params;
  const config = getSubjectConfig(level, subject);
  if (!config || (level !== "primary" && level !== "middle")) {
    return NextResponse.json({ error: "invalid subject" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "file too large (max 10MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const fileName = `${id}.${ext}`;

  await fs.mkdir(SCHOOL_WRONG_ANSWERS_DIR, { recursive: true });
  const filePath = path.join(SCHOOL_WRONG_ANSWERS_DIR, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  const base64 = buffer.toString("base64");
  const mimeType = file.type || "image/jpeg";

  try {
    const analysis = await analyzeSchoolWrongAnswer(level as "primary" | "middle", config.name, base64, mimeType);

    const record = await prisma.schoolWrongAnswer.create({
      data: {
        level,
        subject,
        imagePath:    filePath,
        mimeType,
        analysisJson: JSON.stringify(analysis),
      },
    });

    return NextResponse.json({ id: record.id, analysis });
  } catch (err) {
    console.error(`[school-analyze] error ${level}/${subject}:`, err);
    await fs.unlink(filePath).catch(() => undefined);
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}
