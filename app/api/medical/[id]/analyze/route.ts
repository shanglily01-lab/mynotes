import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";

const genAI = new GoogleGenerativeAI(process.env["google-key"] ?? "");

type Ctx = { params: Promise<{ id: string }> };

const SYSTEM_PROMPT = `你是一位专业的医学顾问。请分析这份医疗文件，用清晰的中文给出以下内容：
1. 文件类型与主要内容概述
2. 关键指标或发现（如有异常请特别指出）
3. 可能的健康意义或需要关注的事项
4. 建议的后续行动（如复查、生活方式调整等）

请用结构化的 Markdown 格式输出，语言通俗易懂，但保持专业准确。
注意：本分析仅供参考，不构成医疗诊断，如有健康问题请咨询医生。`;

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  const record = await prisma.medicalRecord.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Return cached summary if exists
  if (record.aiSummary) {
    return NextResponse.json({ summary: record.aiSummary, cached: true });
  }

  if (!record.filePath || !record.mimeType) {
    return NextResponse.json({ error: "no file to analyze" }, { status: 400 });
  }

  const supportedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
  if (!supportedMimes.includes(record.mimeType)) {
    return NextResponse.json({ error: "unsupported file type for AI analysis" }, { status: 400 });
  }

  const buffer = await fs.readFile(record.filePath).catch(() => null);
  if (!buffer) return NextResponse.json({ error: "file not found" }, { status: 404 });

  const base64 = buffer.toString("base64");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { maxOutputTokens: 2048 },
  });

  const result = await model.generateContent([
    { inlineData: { mimeType: record.mimeType, data: base64 } },
    SYSTEM_PROMPT,
  ]);

  const summary = result.response.text();

  await prisma.medicalRecord.update({
    where: { id },
    data: { aiSummary: summary },
  });

  return NextResponse.json({ summary, cached: false });
}
