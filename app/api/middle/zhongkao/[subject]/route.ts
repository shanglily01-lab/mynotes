import { NextRequest, NextResponse } from "next/server";
import { writeMarkdown, readMarkdown } from "@/lib/filestore";
import { getMiddleSubject } from "@/lib/middle-subjects";
import { generateZhongkaoReal, generateZhongkaoPredict } from "@/lib/claude-school";
import path from "path";

type Ctx = { params: Promise<{ subject: string }> };
type ZhongkaoType = "real" | "predict";

const PREDICT_YEAR = 2026;

function fileId(subject: string, type: ZhongkaoType): string {
  return `${subject}-${type}`;
}

function zhongkaoFilePath(subject: string, type: ZhongkaoType): string {
  return path.join(process.cwd(), "data", "zhongkao", `${fileId(subject, type)}.md`);
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { subject } = await params;
  if (!getMiddleSubject(subject)) {
    return NextResponse.json({ error: "invalid subject" }, { status: 400 });
  }

  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "real") as ZhongkaoType;
  if (type !== "real" && type !== "predict") {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const content = await readMarkdown(zhongkaoFilePath(subject, type));
  return NextResponse.json({ content: content || null });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { subject } = await params;
  const config = getMiddleSubject(subject);
  if (!config) {
    return NextResponse.json({ error: "invalid subject" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({})) as { type?: ZhongkaoType };
  const type: ZhongkaoType = body.type === "predict" ? "predict" : "real";

  try {
    const content =
      type === "real"
        ? await generateZhongkaoReal(subject, config.name)
        : await generateZhongkaoPredict(subject, config.name, PREDICT_YEAR);

    await writeMarkdown("zhongkao", fileId(subject, type), content);
    return NextResponse.json({ type, content });
  } catch (err) {
    console.error(`[zhongkao] generate error ${subject}/${type}:`, err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
