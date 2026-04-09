import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSubject } from "@/lib/subjects";
import { generateSubjectMaterial } from "@/lib/claude";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const subject = getSubject(slug);

  const material = await prisma.subjectMaterial.findUnique({
    where: { subjectId: slug },
  });

  if (!material?.content) return NextResponse.json({ material: null });

  return NextResponse.json({
    material: {
      id: material.id,
      subjectId: material.subjectId,
      content: material.content,
      openResources: subject?.openResources ?? [],
    },
  });
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

    const markdown = await generateSubjectMaterial(subject.name, subject.foundations);

    // Ensure Subject row exists before upserting material
    await prisma.subject.upsert({
      where: { id: slug },
      create: { id: slug, name: subject.name, icon: subject.icon },
      update: { name: subject.name, icon: subject.icon },
    });

    await prisma.subjectMaterial.upsert({
      where: { subjectId: slug },
      create: { subjectId: slug, content: markdown },
      update: { content: markdown },
    });

    return NextResponse.json({ ok: true, content: markdown, openResources: subject.openResources });
  } catch (err) {
    console.error("[material POST] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
