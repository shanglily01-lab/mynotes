import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSubject } from "@/lib/subjects";
import { generateSubjectMaterial } from "@/lib/claude";
import { fetchOpenResources } from "@/lib/opencourse";
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
    return NextResponse.json({
      material: {
        ...material,
        roadmap,
        openResources: subject?.openResources ?? [],
      },
    });
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

  // 抓取名校公开资源内容（并发）
  const fetchedResources = await fetchOpenResources(subject.openResources);
  console.log(`[material] fetched ${fetchedResources.length}/${subject.openResources.length} resources for ${slug}`);

  const roadmap = await generateSubjectMaterial(subject.name, subject.foundations, fetchedResources);

  // After a ~30s LLM call MySQL may have dropped the idle connection (P1017).
  // Reconnect once and retry rather than calling $disconnect on the shared singleton.
  const saveToDb = async () => {
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
    return roadmapPath;
  };

  try {
    await saveToDb();
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "errorCode" in err
      ? (err as { errorCode: string }).errorCode
      : null;
    if (code === "P1017") {
      await prisma.$connect();
      await saveToDb();
    } else {
      throw err;
    }
  }

  return NextResponse.json({ ok: true, roadmap, openResources: subject.openResources });
}
