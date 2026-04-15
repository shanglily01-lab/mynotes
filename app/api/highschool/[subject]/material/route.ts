import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateHSMaterialBasic, generateHSMaterialAdvanced } from "@/lib/claude";
import { writeMarkdown, readMarkdown } from "@/lib/filestore";
import { getHSSubject } from "@/lib/hs-subjects";

type Ctx = { params: Promise<{ subject: string }> };
type Phase = "basic" | "advanced";

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { subject } = await params;
  if (!getHSSubject(subject)) {
    return NextResponse.json({ error: "invalid subject" }, { status: 400 });
  }

  const material = await prisma.hSMaterial.findUnique({ where: { subject } });
  if (!material) return NextResponse.json({ basic: null, advanced: null });

  const [basic, advanced] = await Promise.all([
    material.basicPath ? readMarkdown(material.basicPath) : Promise.resolve(null),
    material.advancedPath ? readMarkdown(material.advancedPath) : Promise.resolve(null),
  ]);

  return NextResponse.json({
    basic: basic || null,
    advanced: advanced || null,
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { subject } = await params;
  const config = getHSSubject(subject);
  if (!config) {
    return NextResponse.json({ error: "invalid subject" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({})) as { phase?: Phase };
  const phase: Phase = body.phase === "advanced" ? "advanced" : "basic";

  try {
    const content =
      phase === "basic"
        ? await generateHSMaterialBasic(subject, config.name)
        : await generateHSMaterialAdvanced(subject, config.name);

    const fileId = `${subject}-${phase}`;
    const filePath = await writeMarkdown("hs-materials", fileId, content);

    await prisma.hSMaterial.upsert({
      where: { subject },
      create: {
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
    console.error(`[hs-material] generate error for ${subject} phase=${phase}:`, err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
