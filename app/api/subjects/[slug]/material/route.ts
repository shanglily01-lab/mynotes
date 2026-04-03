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

  const material = await prisma.subjectMaterial.findUnique({
    where: { subjectId: slug },
  });

  if (!material) return NextResponse.json({ material: null });

  const raw = await readText(material.roadmapPath);
  if (!raw) return NextResponse.json({ material: null });

  try {
    const roadmap = JSON.parse(raw);
    return NextResponse.json({ material: { ...material, roadmap } });
  } catch {
    return NextResponse.json({ material: null });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const subject = getSubject(slug);
  if (!subject) {
    return NextResponse.json({ ok: false, error: "Subject not found" }, { status: 404 });
  }

  const roadmap = await generateSubjectMaterial(subject.name, subject.foundations);

  await prisma.$disconnect();
  await prisma.$connect();

  const existing = await prisma.subjectMaterial.findUnique({
    where: { subjectId: slug },
  });

  const id = existing?.id ?? slug;
  const roadmapPath = await writeText("materials", id, JSON.stringify(roadmap, null, 2));

  await prisma.subjectMaterial.upsert({
    where: { subjectId: slug },
    create: { subjectId: slug, roadmapPath },
    update: { roadmapPath },
  });

  return NextResponse.json({ ok: true, roadmap });
}
