import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSchoolMaterialBasic, generateSchoolMaterialAdvanced } from "@/lib/claude-school";
import { writeMarkdown, readMarkdown } from "@/lib/filestore";
import { getPrimarySubject } from "@/lib/primary-subjects";
import { getMiddleSubject } from "@/lib/middle-subjects";

type Ctx = { params: Promise<{ level: string; subject: string }> };
type Phase = "basic" | "advanced";

function getSubjectConfig(level: string, subject: string) {
  if (level === "primary") return getPrimarySubject(subject);
  if (level === "middle") return getMiddleSubject(subject);
  return undefined;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { level, subject } = await params;
  if (!getSubjectConfig(level, subject)) {
    return NextResponse.json({ error: "invalid subject" }, { status: 400 });
  }

  const material = await prisma.schoolMaterial.findUnique({ where: { level_subject: { level, subject } } });
  if (!material) return NextResponse.json({ basic: null, advanced: null });

  const [basic, advanced] = await Promise.all([
    material.basicPath    ? readMarkdown(material.basicPath)    : Promise.resolve(null),
    material.advancedPath ? readMarkdown(material.advancedPath) : Promise.resolve(null),
  ]);

  return NextResponse.json({ basic: basic || null, advanced: advanced || null });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { level, subject } = await params;
  const config = getSubjectConfig(level, subject);
  if (!config || (level !== "primary" && level !== "middle")) {
    return NextResponse.json({ error: "invalid subject" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({})) as { phase?: Phase };
  const phase: Phase = body.phase === "advanced" ? "advanced" : "basic";

  try {
    const content =
      phase === "basic"
        ? await generateSchoolMaterialBasic(level, subject, config.name)
        : await generateSchoolMaterialAdvanced(level, subject, config.name);

    const fileId = `${level}-${subject}-${phase}`;
    const filePath = await writeMarkdown("school-materials", fileId, content);

    await prisma.schoolMaterial.upsert({
      where: { level_subject: { level, subject } },
      create: {
        level,
        subject,
        basicPath:    phase === "basic"    ? filePath : undefined,
        advancedPath: phase === "advanced" ? filePath : undefined,
      },
      update: {
        basicPath:    phase === "basic"    ? filePath : undefined,
        advancedPath: phase === "advanced" ? filePath : undefined,
      },
    });

    return NextResponse.json({ phase, content });
  } catch (err) {
    console.error(`[school-material] generate error ${level}/${subject} phase=${phase}:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "AI generation failed", detail: msg }, { status: 500 });
  }
}
