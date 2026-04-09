import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSubject } from "@/lib/subjects";
import { generateSubjectCases } from "@/lib/claude";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const record = await prisma.subjectCases.findUnique({
    where: { subjectId: slug },
  });

  return NextResponse.json({ content: record?.content ?? null });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const subject = getSubject(slug);
    if (!subject) {
      return NextResponse.json({ ok: false, error: "Subject not found" }, { status: 404 });
    }

    const markdown = await generateSubjectCases(subject.name, slug);

    await prisma.subjectCases.upsert({
      where: { subjectId: slug },
      create: { id: slug, subjectId: slug, content: markdown },
      update: { content: markdown },
    });

    return NextResponse.json({ ok: true, content: markdown });
  } catch (err) {
    console.error("[cases POST] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
