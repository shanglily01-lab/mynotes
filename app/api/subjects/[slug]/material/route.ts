import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSubject } from "@/lib/subjects";
import { generateSubjectMaterial } from "@/lib/claude";
import { writeText, readText } from "@/lib/filestore";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const subject = getSubject(slug);

  const material = await prisma.subjectMaterial.findUnique({
    where: { subjectId: slug },
  });

  if (!material) return NextResponse.json({ material: null });

  const content = await readText(material.roadmapPath);
  if (!content) return NextResponse.json({ material: null });

  return NextResponse.json({
    material: {
      id: material.id,
      subjectId: material.subjectId,
      content,
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

    const saveToDb = async () => {
      const existing = await prisma.subjectMaterial.findUnique({
        where: { subjectId: slug },
      });
      const id = existing?.id ?? slug;
      const roadmapPath = await writeText("materials", id, markdown);
      await prisma.subjectMaterial.upsert({
        where: { subjectId: slug },
        create: { subjectId: slug, roadmapPath },
        update: { roadmapPath },
      });
    };

    try {
      await saveToDb();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "P1017") {
        await prisma.$connect();
        await saveToDb();
      } else {
        throw err;
      }
    }

    return NextResponse.json({ ok: true, content: markdown, openResources: subject.openResources });
  } catch (err) {
    console.error("[material POST] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
