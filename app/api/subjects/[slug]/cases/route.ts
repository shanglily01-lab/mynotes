import { NextRequest, NextResponse } from "next/server";
import { getSubject } from "@/lib/subjects";
import { generateSubjectCases } from "@/lib/claude";
import { writeMarkdown, readMarkdown } from "@/lib/filestore";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "cases");

function casesPath(slug: string) {
  return path.join(DATA_DIR, `${slug}.md`);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const content = await readMarkdown(casesPath(slug));
  return NextResponse.json({ content: content || null });
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
    await writeMarkdown("cases", slug, markdown);

    return NextResponse.json({ ok: true, content: markdown });
  } catch (err) {
    console.error("[cases POST] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
