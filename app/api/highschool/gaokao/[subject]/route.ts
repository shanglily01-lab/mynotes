import { NextRequest, NextResponse } from "next/server";
import { writeMarkdown, readMarkdown } from "@/lib/filestore";
import { getHSSubject } from "@/lib/hs-subjects";
import { generateGaokaoReal, generateGaokaoPredict } from "@/lib/claude";
import path from "path";

type Ctx = { params: Promise<{ subject: string }> };
type GaokaoType = "real" | "predict";

const PREDICT_YEAR = 2026;

function fileId(subject: string, type: GaokaoType): string {
  return `${subject}-${type}`;
}

function gaokaoFilePath(subject: string, type: GaokaoType): string {
  return path.join(process.cwd(), "data", "gaokao", `${fileId(subject, type)}.md`);
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { subject } = await params;
  if (!getHSSubject(subject)) {
    return NextResponse.json({ error: "invalid subject" }, { status: 400 });
  }

  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "real") as GaokaoType;
  if (type !== "real" && type !== "predict") {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const content = await readMarkdown(gaokaoFilePath(subject, type));
  return NextResponse.json({ content: content || null });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { subject } = await params;
  const config = getHSSubject(subject);
  if (!config) {
    return NextResponse.json({ error: "invalid subject" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({})) as { type?: GaokaoType };
  const type: GaokaoType = body.type === "predict" ? "predict" : "real";

  try {
    const content =
      type === "real"
        ? await generateGaokaoReal(subject, config.name)
        : await generateGaokaoPredict(subject, config.name, PREDICT_YEAR);

    await writeMarkdown("gaokao", fileId(subject, type), content);
    return NextResponse.json({ type, content });
  } catch (err) {
    console.error(`[gaokao] generate error ${subject}/${type}:`, err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
